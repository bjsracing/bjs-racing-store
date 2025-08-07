// src/components/ProductPurchase.jsx

import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { FiShoppingCart, FiPlus, FiMinus } from "react-icons/fi";

const ProductPurchase = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useAppStore();

  const handleQuantityChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    setQuantity(value);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`${quantity} x ${product.nama} berhasil ditambahkan ke keranjang!`);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Input Kuantitas */}
      <div className="flex items-center border rounded-md">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-md"
        >
          <FiMinus />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          className="w-14 h-10 text-center font-semibold border-l border-r focus:ring-0"
        />
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-md"
        >
          <FiPlus />
        </button>
      </div>

      {/* Tombol Tambah ke Keranjang */}
      <button
        onClick={handleAddToCart}
        className="flex-grow flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300 h-10"
      >
        <FiShoppingCart />
        <span>Tambah ke Keranjang</span>
      </button>
    </div>
  );
};

export default ProductPurchase;
