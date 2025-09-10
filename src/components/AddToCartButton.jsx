// src/components/AddToCartButton.jsx

import React from "react";
import { useAppStore } from "../lib/store.ts";
import id from "../locales/id/common.json";
import { FiShoppingCart } from "react-icons/fi";

const AddToCartButton = ({ product }) => {
  // ✅ Perbaikan: Ambil juga 'fetchCart' dan 'addToast' dari store untuk toast notifications
  const { addToCart, fetchCart, addToast } = useAppStore();

  const handleAddToCart = async () => {
    try {
      // Panggil fungsi addToCart yang sudah diperbarui di store
      await addToCart(product, 1);

      // ✅ Removed redundant fetchCart - addToCart already calls fetchCart internally

      // Show success toast notification
      addToast({
        type: 'success',
        message: `1 x ${product.nama} berhasil ditambahkan ke keranjang.`,
        duration: 4000
      });
    } catch (error) {
      console.error("Gagal menambahkan produk ke keranjang:", error);
      
      // ✅ Perbaikan: Handle error khusus untuk user yang belum login
      if (error.message === "NOT_AUTHENTICATED") {
        addToast({
          type: 'error',
          message: "Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang.",
          duration: 6000
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      
      // ✅ Perbaikan: Handle error untuk customer profile yang belum lengkap
      if (error.message === "CUSTOMER_PROFILE_MISSING") {
        addToast({
          type: 'warning',
          message: "Profil Anda belum lengkap. Silakan lengkapi profil terlebih dahulu untuk berbelanja.",
          duration: 6000
        });
        setTimeout(() => {
          window.location.href = "/akun/lengkapi-profil";
        }, 1500);
        return;
      }
      
      // Generic error message
      addToast({
        type: 'error',
        message: "Gagal menambahkan produk ke keranjang. Silakan coba lagi.",
        duration: 5000
      });
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
