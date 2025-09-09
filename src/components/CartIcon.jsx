// File: src/components/CartIcon.jsx
// Perbaikan: Refactor untuk menggunakan hook useAuth() dan menampilkan dirinya
// hanya saat pengguna sudah login.

import React from "react";
// 1. Impor custom hook `useAuth` dari pusat kontrol sesi
import { useAuth } from "../lib/authContext.tsx";
// 2. Impor useAppStore untuk data keranjang (tetap sama)
import { useAppStore } from "../lib/store.ts";

const CartIcon = () => {
  // 3. Gunakan hook `useAuth` untuk mendapatkan data sesi dan status loading
  //    Kita ganti nama `isLoading` menjadi `isAuthLoading` agar tidak bentrok
  const { session, isLoading: isAuthLoading } = useAuth();

  // 4. Ambil data keranjang dari Zustand store
  const { items, isLoadingCart } = useAppStore((state) => ({
    items: state.items,
    isLoadingCart: state.isLoadingCart,
  }));

  const totalItems = items.reduce(
    (total, item) => total + (item.quantity || 0),
    0,
  );

  // 5. Logika Render Kondisional yang Baru
  //    - Jika status login masih divalidasi, tampilkan placeholder kosong
  //      untuk mencegah "lompatan" layout.
  if (isAuthLoading) {
    return <div className="w-6 h-6" />; // Placeholder seukuran ikon
  }

  //    - Jika tidak ada sesi (pengguna logout), jangan tampilkan apa pun.
  if (!session) {
    return null;
  }

  //    - Jika ada sesi, tampilkan ikon keranjang.
  return (
    <a
      href="/cart"
      className="relative text-slate-800 hover:text-orange-500 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>

      {/* Logika notifikasi tetap sama: tampilkan jika loading keranjang selesai dan ada item */}
      {!isLoadingCart && totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </a>
  );
};

export default CartIcon;
