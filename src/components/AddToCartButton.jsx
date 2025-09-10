// src/components/AddToCartButton.jsx

import React from "react";
import { useAppStore } from "../lib/store.ts";
import id from "../locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  // ✅ Perbaikan: Ambil juga 'fetchCart' dari store untuk menyinkronkan UI
  const { addToCart, fetchCart } = useAppStore();

  const handleAddToCart = async () => {
    try {
      // Panggil fungsi addToCart yang sudah diperbarui di store
      await addToCart(product, 1);

      // ✅ Perbaikan: Panggil fetchCart untuk memperbarui state lokal dari database
      await fetchCart();

      alert(`1 x ${product.nama} berhasil ditambahkan ke keranjang.`);
    } catch (error) {
      console.error("Gagal menambahkan produk ke keranjang:", error);
      alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300"
    >
      <FiShoppingCart />
      <span>{id.components.add_to_cart}</span>
    </button>
  );
};

export default AddToCartButton;
