// src/components/ProductCard.jsx (Versi Final dengan Semua Fitur & Desain Anda)

import React from "react";
import AddToCartButton from "./AddToCartButton.jsx";
import { FiStar } from "react-icons/fi";

const ProductCard = ({ product }) => {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    // Logika untuk fitur baru
    const isLowStock = product.stok > 0 && product.stok <= product.stok_min;
    const hasDiscount =
        product.harga_coret && product.harga_coret > product.harga_jual;
    const discountPercentage = hasDiscount
        ? Math.round(
              ((product.harga_coret - product.harga_jual) /
                  product.harga_coret) *
                  100,
          )
        : 0;
    const isBestSeller = product.total_terjual > 50; // Anda bisa sesuaikan ambang batas ini

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group border-2 border-slate-200 hover:border-orange-500 transition-all duration-300 flex flex-col h-full">
            <a
                href={`/products/${product.id}`}
                className="block flex flex-col flex-grow"
            >
                <div className="relative aspect-square bg-white flex items-center justify-center p-2">
                    {/* Gambar Utama */}
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.nama}
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 rounded-md"></div>
                    )}

                    {/* BADGES BARU (Pojok Kiri Atas) */}
                    <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                        {hasDiscount && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                DISKON {discountPercentage}%
                            </div>
                        )}
                        {isBestSeller && (
                            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                TERLARIS
                            </div>
                        )}
                        {isLowStock && (
                            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
                                STOK TERAKHIR
                            </div>
                        )}
                    </div>

                    {/* LINGKARAN WARNA & SKU (di pojok kiri bawah) */}
                    <div className="absolute bottom-2 left-4 flex flex-col items-center">
                        {product.color_swatch_url && (
                            <div className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center overflow-hidden">
                                <img
                                    src={product.color_swatch_url}
                                    alt={`Warna ${product.nama}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <p className="text-base font-bold text-slate-1000 bg-orange-100 px-1.5 rounded mt-2">
                            {product.sku || ""}
                        </p>
                    </div>
                </div>

                <div className="p-3 flex-grow flex flex-col bg-orange-100 mt-0.5">
                    <h3
                        className="text-base font-semibold text-slate-1000 line-clamp-2"
                        title={product.nama}
                    >
                        {product.nama}
                    </h3>
                    <p className="text-sm text-blue-600 italic uppercase tracking-wider font-medium">
                        {product.lini_produk}
                    </p>
                    <div className="flex-grow"></div>

                    <div className="mt-2">
                        {hasDiscount && (
                            <p className="text-sm text-slate-600 line-through">
                                {formatRupiah(product.harga_coret)}
                            </p>
                        )}
                        <p className="font-bold text-xl text-orange-600">
                            {formatRupiah(product.harga_jual)}
                        </p>
                    </div>

                    <div className="flex justify-between text-sm text-slate-1000 mt-1">
                        <span>
                            Ukuran:{" "}
                            <span className="font-semibold">
                                {product.ukuran}
                            </span>
                        </span>
                        <span>
                            Stok:{" "}
                            <span className="font-semibold">
                                {product.stok}
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-800 mt-2 border-t pt-2">
                        <FiStar
                            className="text-yellow-400"
                            fill="currentColor"
                        />
                        <span>{product.rating?.toFixed(1) || "Baru"}</span>
                        <span className="border-l pl-2">
                            {product.total_terjual || 0} Terjual
                        </span>
                    </div>
                </div>
            </a>

            <div className="px-3 pb-3 bg-orange-100">
                <AddToCartButton product={product} />
            </div>
        </div>
    );
};

export default ProductCard;
