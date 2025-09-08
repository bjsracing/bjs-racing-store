// src/components/AddToCartButton.jsx

import React from "react";
import { useAppStore } from "../lib/store.js";
import id from "../locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  const { addToCart } = useAppStore();

  const handleAddToCart = () => {
    // Pastikan kita selalu mengirim produk dengan kuantitas 1 saat pertama kali ditambah
    addToCart(product, 1);
    alert(`1 x ${product.nama} berhasil ditambahkan ke keranjang.`);
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
