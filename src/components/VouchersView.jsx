// File: /src/components/VouchersView.jsx
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

// Komponen Ikon baru untuk setiap jenis voucher
const VoucherIcon = ({ type }) => {
  if (type === "free_shipping") return <span className="text-3xl">🚚</span>;
  if (type === "percentage") return <span className="text-3xl">%</span>;
  if (type === "fixed_amount") return <span className="text-3xl">Rp</span>;
  return null;
};

// Komponen Kartu Voucher yang telah disempurnakan
const VoucherCard = ({ voucher, onClaim, session }) => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    if (!session) {
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
  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

  return (
    <div className="bg-white rounded-lg shadow-md flex overflow-hidden">
      {/* Bagian Kiri: Ikon & Warna */}
      <div className="flex-shrink-0 w-24 bg-orange-50 flex flex-col items-center justify-center p-4">
        <VoucherIcon type={voucher.type} />
        <p className="text-xs font-bold text-orange-600 mt-2 uppercase text-center">
          {voucher.type === "free_shipping" ? "Gratis Ongkir" : "Diskon Toko"}
        </p>
      </div>
      {/* Bagian Kanan: Detail & Tombol */}
      <div className="flex-grow p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-grow">
          <p className="font-bold text-lg text-slate-800">
            {voucher.description}
          </p>
          <div className="text-xs text-slate-500 mt-2 space-y-1">
            {voucher.min_purchase > 0 && (
              <span>Min. Belanja: {formatRupiah(voucher.min_purchase)}</span>
            )}
            {voucher.max_discount && <span className="mx-2">|</span>}
            {voucher.max_discount && (
              <span>Diskon s/d: {formatRupiah(voucher.max_discount)}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Berlaku hingga: {formatDate(voucher.valid_until)}
          </p>
        </div>
        <button
          onClick={handleClaim}
          disabled={isClaimed || isLoading}
          className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
        >
          {isLoading ? "..." : isClaimed ? "Diklaim" : "Klaim"}
        </button>
      </div>
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
