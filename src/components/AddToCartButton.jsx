// src/components/AddToCartButton.jsx

import React from "react";
import { useCartStore } from "../lib/cartStore";
import id from "../../public/locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <button
      onClick={handleAddToCart}
      // PERBAIKAN: Warna diubah menjadi netral dengan hover hijau
      className="w-full flex items-center justify-center gap-2 bg-slate-500 hover:bg-green-600 text-white hover:text-white font-bold py-2 rounded-lg transition-all duration-300"
    >
      <FiShoppingCart />
      <span>{id.components.add_to_cart}</span>
    </button>
  );
};

export default AddToCartButton;
