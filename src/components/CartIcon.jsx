// File: src/components/CartIcon.jsx
// Perbaikan: Menggunakan alias path '@/' untuk impor yang stabil dan mengatasi error build R2.

import React from "react";
// PERBAIKAI UTAMA: Gunakan alias path '@/' yang sudah dikonfigurasi di tsconfig.json.
// Ini adalah cara yang paling stabil untuk impor.
import { useAppStore } from "@/lib/store.ts";

const CartIcon = () => {
  const items = useAppStore((state) => state.items);
  // Menambahkan fallback '|| 0' untuk memastikan quantity selalu berupa angka dan mencegah error
  const totalItems = items.reduce(
    (total, item) => total + (item.quantity || 0),
    0,
  );

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

      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </a>
  );
};

export default CartIcon;
