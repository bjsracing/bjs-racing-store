// File: /src/components/VouchersView.jsx
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

// Komponen kecil untuk satu kartu voucher
const VoucherCard = ({ voucher, onClaim, session }) => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    if (!session) {
      // Jika belum login, arahkan ke halaman login
      window.location.href = "/login?redirect=/voucher";
      return;
    }
    setIsLoading(true);
    const success = await onClaim(voucher.id);
    if (success) {
      setIsClaimed(true);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="bg-white border-l-4 border-orange-500 rounded-r-lg shadow-md flex items-center p-4 gap-4">
      <div className="flex-grow">
        <p className="font-bold text-lg text-slate-800">{voucher.code}</p>
        <p className="text-sm text-slate-600 mt-1">{voucher.description}</p>
        <p className="text-xs text-slate-400 mt-2">
          Berlaku hingga: {formatDate(voucher.valid_until)}
        </p>
      </div>
      <button
        onClick={handleClaim}
        disabled={isClaimed || isLoading}
        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "..." : isClaimed ? "Diklaim" : "Klaim"}
      </button>
    </div>
  );
};

// Komponen utama untuk menampilkan daftar voucher
const VouchersView = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useAppStore((state) => state.addToast);
  const session = useAppStore((state) => state.session); // Ambil sesi dari store

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch("/api/vouchers/public");
        const data = await response.json();
        if (response.ok) {
          setVouchers(data);
        } else {
          throw new Error(data.message || "Gagal memuat voucher.");
        }
      } catch (error) {
        addToast({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [addToast]);

  const handleClaimVoucher = async (voucherId) => {
    try {
      const response = await fetch("/api/vouchers/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucher_id: voucherId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      addToast({ type: "success", message: result.message });
      return true; // Mengindikasikan klaim berhasil
    } catch (error) {
      addToast({ type: "error", message: error.message });
      return false; // Mengindikasikan klaim gagal
    }
  };

  if (loading) {
    return <p className="text-center py-10">Memuat voucher...</p>;
  }

  return (
    <div className="space-y-4">
      {vouchers.length > 0 ? (
        vouchers.map((voucher) => (
          <VoucherCard
            key={voucher.id}
            voucher={voucher}
            onClaim={handleClaimVoucher}
            session={session}
          />
        ))
      ) : (
        <p className="text-center py-10 text-slate-500">
          Saat ini tidak ada voucher yang tersedia.
        </p>
      )}
    </div>
  );
};

export default VouchersView;
