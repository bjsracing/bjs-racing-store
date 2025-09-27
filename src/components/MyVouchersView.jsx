// File: /src/components/MyVouchersView.jsx
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

const MyVouchersView = () => {
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useAppStore((state) => state.addToast);

  useEffect(() => {
    const fetchMyVouchers = async () => {
      try {
        const response = await fetch("/api/vouchers/my-vouchers");
        const data = await response.json();
        if (response.ok) {
          // Ambil detail voucher dari properti 'vouchers' yang di-join
          const vouchersDetails = data.map((item) => item.vouchers);
          setMyVouchers(vouchersDetails);
        } else {
          throw new Error(data.message || "Gagal memuat voucher.");
        }
      } catch (error) {
        addToast({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchMyVouchers();
  }, [addToast]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return <p className="text-center py-10">Memuat voucher Anda...</p>;
  }

  return (
    <div className="space-y-4">
      {myVouchers.length > 0 ? (
        myVouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="bg-white border-l-4 border-green-500 rounded-r-lg shadow-sm p-4"
          >
            <p className="font-bold text-lg text-slate-800">{voucher.code}</p>
            <p className="text-sm text-slate-600 mt-1">{voucher.description}</p>
            <p className="text-xs text-slate-400 mt-2">
              Berlaku hingga: {formatDate(voucher.valid_until)}
            </p>
          </div>
        ))
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-slate-600">
            Anda belum memiliki voucher yang diklaim.
          </p>
          <a
            href="/voucher"
            className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Klaim Voucher
          </a>
        </div>
      )}
    </div>
  );
};

export default MyVouchersView;
