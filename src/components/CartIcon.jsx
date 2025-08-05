// src/components/CartIcon.jsx

import React from "react";
import { useCartStore } from "../lib/cartStore";

const CartIcon = () => {
  // Ambil 'items' dari cart store
  const items = useCartStore((state) => state.items);

  // Hitung total kuantitas semua item di keranjang
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <a
      href="/cart"
      className="relative text-white hover:text-orange-400 transition-colors"
    >
      {/* Ikon Keranjang Belanja */}
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

      {/* Badge Jumlah Item */}
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {totalItems}
        </span>
      )}
    </a>
  );
};

export default CartIcon;
