// File: src/components/CartView.jsx

import React, { useEffect } from "react";
import { useAppStore } from "../lib/store.ts";
import { supabase } from "../lib/supabaseClient.ts";

const CartView = () => {
  // Ambil state dan fungsi dari store Zustand
  const { items, removeFromCart, updateQuantity, fetchCart } = useAppStore();

  // Gunakan useEffect untuk memuat data keranjang dari database saat komponen dimuat.
  // Dependencies array kosong ([]) memastikan ini hanya berjalan sekali.
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotal = items.reduce(
    (total, item) => total + (item.quantity || 0) * (item.harga_jual || 0),
    0,
  );

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-slate-700">
          Keranjang Belanja Anda Kosong
        </h2>
        <p className="text-slate-500 mt-2">
          Mari jelajahi produk kami dan temukan yang Anda butuhkan!
        </p>
        <a
          href="/pilok"
          className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Mulai Belanja
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="space-y-4">
        {items.map((item) => {
          const quantity = item.quantity || 0;
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center gap-4 border-b pb-4 last:border-b-0"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-md flex-shrink-0">
                <img
                  src={item.image_url}
                  alt={item.nama}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-grow text-center sm:text-left">
                <p className="font-semibold text-slate-800">{item.nama}</p>
                <p className="text-sm text-slate-500">
                  {item.merek} - {item.ukuran}
                </p>
                <p className="font-semibold text-orange-500 mt-1">
                  {formatRupiah(item.harga_jual)}
                </p>
              </div>

              <div className="flex items-center gap-2 border rounded-md p-1">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, parseInt(e.target.value, 10) || 1)
                  }
                  className="w-12 text-center font-semibold border-none focus:ring-0 bg-transparent"
                />
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                >
                  +
                </button>
              </div>

              <div className="text-right flex-shrink-0 w-28">
                <p className="font-bold text-lg">
                  {formatRupiah(quantity * item.harga_jual)}
                </p>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-end">
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-lg">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-bold text-slate-800">
              {formatRupiah(subtotal)}
            </span>
          </div>
          <p className="text-xs text-slate-400 text-right mt-1">
            Pajak dan ongkos kirim dihitung saat checkout.
          </p>

          <a
            href="/checkout"
            className="mt-4 block text-center w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Lanjut ke Checkout
          </a>
        </div>
      </div>
    </div>
  );
};

export default CartView;
