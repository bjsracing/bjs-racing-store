// src/components/AddToCartButton.jsx
import React from "react";
import { useAppStore } from "@/lib/store.ts";
import id from "../../public/locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  // Ambil fungsi 'addToCart' DAN 'addToast' dari store
  const { addToCart, addToast } = useAppStore();

  const isOutOfStock = !product || product.stok == null || product.stok <= 0;

  // --- PERBAIKAN: Ubah handle menjadi async dan tambahkan try...catch ---
  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    try {
      // Panggil fungsi addToCart yang sudah "pintar"
      await addToCart(product, 1);
    } catch (error) {
      // Tangkap error spesifik yang kita lempar dari store
      if (error.message === "NOT_AUTHENTICATED") {
        addToast({
          type: "info",
          message: "Silakan login terlebih dahulu untuk berbelanja.",
        });
        // Arahkan ke halaman login
        window.location.href = "/login";
      } else if (error.message === "CUSTOMER_PROFILE_MISSING") {
        addToast({
          type: "warning",
          message: "Profil Anda belum lengkap. Mohon lengkapi data diri.",
        });
        // Arahkan ke halaman lengkapi profil
        window.location.href = "/akun/lengkapi-profil";
      } else {
        // Untuk error lainnya
        addToast({
          type: "error",
          message: "Terjadi kesalahan. Silakan coba lagi.",
        });
        console.error("Add to cart error:", error);
      }
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
    >
      <FiShoppingCart />
      <span>{isOutOfStock ? "Stok Habis" : id.components.add_to_cart}</span>
    </button>
  );
};

export default AddToCartButton;
