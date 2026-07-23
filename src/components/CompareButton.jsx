// src/components/CompareButton.jsx
import React, { useEffect, useState } from "react";

const CompareButton = ({ productId, className = "" }) => {
  const [inCompare, setInCompare] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkCompare = async () => {
      try {
        const res = await fetch("/api/compare");
        if (!res.ok) return;
        const data = await res.json();
        const exists = (data || []).some((item) => item.product_id === productId);
        setInCompare(exists);
      } catch {
        // ignore
      }
    };
    checkCompare();
  }, [productId]);

  const toggleCompare = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (inCompare) {
        const res = await fetch("/api/compare", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (res.ok) setInCompare(false);
      } else {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (res.ok) setInCompare(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleCompare}
      disabled={loading}
      className={`p-2 rounded-full border transition-colors ${
        inCompare
          ? "bg-blue-50 border-blue-200 text-blue-600"
          : "bg-white border-slate-200 text-slate-400 hover:text-blue-600"
      } ${className}`}
      aria-label={inCompare ? "Hapus dari perbandingan" : "Tambah ke perbandingan"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    </button>
  );
};

export default CompareButton;
