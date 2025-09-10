// src/components/AddToCartButton.jsx

import React from "react";
import { useAppStore } from "../lib/store.ts";
import id from "../../public/locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  const { addToCart, fetchCart } = useAppStore();

  const handleAddToCart = async () => {
    try {
      await addToCart(product, 1);
      // Panggil fetchCart untuk memperbarui state setelah penambahan berhasil
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
