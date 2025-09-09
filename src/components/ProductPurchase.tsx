// File: src/components/ProductPurchase.tsx
// Perbaikan: Diubah ke .tsx, menangani state loading asinkron, dan memperbaiki path impor.

import React, { useState } from "react";
// PERBAIKAN 1: Path impor menunjuk ke file .ts menggunakan alias path.
import { useAppStore } from "@/lib/store.ts";
import { FiShoppingCart, FiPlus, FiMinus } from "react-icons/fi";

// Definisikan tipe data untuk prop 'product' agar lebih aman
interface Product {
  id: string;
  nama: string;
  // tambahkan properti lain dari produk jika diperlukan di sini
}

interface ProductPurchaseProps {
  product: Product;
}

const ProductPurchase = ({ product }: ProductPurchaseProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false); // State untuk loading
  const { addToCart } = useAppStore();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    setQuantity(value);
  };

  // PERBAIKAN 2: Ubah handleAddToCart menjadi fungsi asinkron
  const handleAddToCart = async () => {
    if (isAdding) return; // Mencegah klik ganda
    setIsAdding(true);

    try {
      await addToCart(product, quantity);
      alert(`${quantity} x ${product.nama} berhasil ditambahkan ke keranjang!`);
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang:", error);
      alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
    } finally {
      setIsAdding(false);
    }
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
      {/* PERBAIKAN 3: Tambahkan status disabled dan loading */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="flex-grow flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300 h-10 disabled:bg-slate-400 disabled:cursor-wait"
      >
        {isAdding ? (
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
          <>
            <FiShoppingCart />
            <span>Tambah ke Keranjang</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProductPurchase;
