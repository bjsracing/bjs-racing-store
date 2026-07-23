// src/components/WishlistButton.jsx
import React, { useEffect, useState } from "react";

const WishlistButton = ({ productId, className = "" }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) return;
        const data = await res.json();
        const exists = (data || []).some((item) => item.product_id === productId);
        setInWishlist(exists);
      } catch {
        // ignore
      }
    };
    checkWishlist();
  }, [productId]);

  const toggleWishlist = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (inWishlist) {
        const res = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (res.ok) setInWishlist(false);
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (res.ok) setInWishlist(true);
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
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full border transition-colors ${
        inWishlist
          ? "bg-red-50 border-red-200 text-red-500"
          : "bg-white border-slate-200 text-slate-400 hover:text-red-500"
      } ${className}`}
      aria-label={inWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
};

export default WishlistButton;
