// File: src/components/AddToCartButton.jsx

import React from "react";
import { useAppStore } from "@/lib/store.ts"; // PERBAIKAN: Menggunakan alias path yang konsisten
import id from "../../public/locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  // Ambil fungsi addToCart dari store
  const { addToCart } = useAppStore();

  // 1. PERBAIKAN: Tambahkan pengecekan stok
  // Mengecek apakah produk ada dan stoknya 0 atau kurang
  const isOutOfStock = !product || product.stok == null || product.stok <= 0;

  // 2. PERBAIKAN: Perbarui fungsi handle, hapus alert yang prematur
  const handleAddToCart = async () => {
    // Tombol sudah di-disable, tapi sebagai pengaman tambahan, kita bisa cek lagi
    if (isOutOfStock) return;

    // Panggil fungsi addToCart dari store.
    // Notifikasi sukses atau gagal sekarang akan diurus oleh store itu sendiri.
    await addToCart(product, 1);
  };

  return (
    <button
      onClick={handleAddToCart}
      // 3. PERBAIKAN: Tambahkan properti 'disabled' dan kelas CSS kondisional
      disabled={isOutOfStock}
      className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
    >
      <FiShoppingCart />
      {/* 4. PERBAIKAN: Ubah teks tombol berdasarkan stok */}
      <span>{isOutOfStock ? "Stok Habis" : id.components.add_to_cart}</span>
    </button>
  );
};

export default AddToCartButton;
