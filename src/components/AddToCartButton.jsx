// File: src/components/AddToCartButton.jsx
// Perbaikan: Menambahkan state loading untuk menangani proses penambahan asinkron.

import React, { useState } from "react";
import { useAppStore } from "../lib/store.ts";
import id from "../../public/locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  // Ambil aksi `addToCart` dari store
  const { addToCart } = useAppStore();

  // State lokal untuk melacak status loading
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    // 1. Cek jika produk valid dan tidak sedang dalam proses penambahan
    if (!product || isAdding) return;

    setIsAdding(true); // Mulai loading

    try {
      // 2. Panggil aksi `addToCart` yang sekarang asinkron
      await addToCart(product, 1);
      // Ganti alert dengan notifikasi yang lebih modern jika diinginkan
      alert(`1 x ${product.nama} berhasil ditambahkan ke keranjang.`);
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang:", error);
      alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
    } finally {
      setIsAdding(false); // Selesaikan loading
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      // 3. Nonaktifkan tombol saat proses penambahan berlangsung
      disabled={isAdding}
      className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300 disabled:bg-slate-400 disabled:cursor-wait"
    >
      {isAdding ? (
        // Tampilkan spinner atau teks loading
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Menambahkan...</span>
        </>
      ) : (
        // Tampilan normal
        <>
          <FiShoppingCart />
          <span>{id.components.add_to_cart}</span>
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
