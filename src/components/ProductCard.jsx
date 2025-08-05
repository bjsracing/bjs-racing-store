// src/components/ProductCard.jsx (Versi Final yang Menggabungkan Desain Anda + Fitur Baru)

import React from "react";
import AddToCartButton from "./AddToCartButton.jsx";
import { FiStar } from "react-icons/fi"; // Impor ikon bintang

const ProductCard = ({ product }) => {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const isLowStock = product.stok <= product.stok_min;
    // Logika baru untuk diskon
    const hasDiscount =
        product.harga_coret && product.harga_coret > product.harga_jual;
    const discountPercentage = hasDiscount
        ? Math.round(
              ((product.harga_coret - product.harga_jual) /
                  product.harga_coret) *
                  100,
          )
        : 0;

    return (
        // Menggunakan struktur utama Anda
        <div className="bg-white rounded-xl shadow-lg shadow-slate-500 overflow-hidden group border border-slate-200 hover:border-orange-500 hover:border-2 transition-all duration-300 flex flex-col hover:shadow-lg">
            <a href={`/products/${product.id}`} className="block">
                <div className="relative aspect-square bg-white shadow-lg flex items-center justify-center p-4">
                    {/* Gambar Utama (tidak berubah) */}
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.nama}
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <svg
                            className="w-16 h-16 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6l2-2m0 0l2 2m-2-2v6m0 0l2 2"
                            ></path>
                        </svg>
                    )}

                    {/* BADGE DISKON BARU (di pojok kanan atas) */}
                    {hasDiscount && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1">
                            {discountPercentage}%
                        </div>
                    )}

                    {/* Wrapper untuk Lingkaran Warna dan SKU (tidak berubah) */}
                    <div className="absolute bottom-2 right-5 flex flex-col items-center">
                        <div className="w-44 h-44 md:w-20 md:h-20 rounded-full shadow-lg shadow-slate-500 flex items-center justify-center overflow-hidden">
                            {product.color_swatch_url ? (
                                <img
                                    src={product.color_swatch_url}
                                    alt={`Warna ${product.nama}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-grey-500"></div>
                            )}
                        </div>
                        <p className="text-lg font-bold text-slate-900 mt-2">
                            {product.sku || ""}
                        </p>
                    </div>
                </div>

                {/* Blok info produk */}
                <div className="p-3 flex-grow bg-orange-100/50 flex flex-col">
                    <p className="text-base text-slate-500 uppercase tracking-wider font-medium">
                        {product.merek || "Tanpa Merek"}
                    </p>
                    <h3
                        className="text-lg font-bold text-slate-800 truncate mt-1 group-hover:text-slate-900 transition-colors"
                        title={product.nama}
                    >
                        {product.nama}
                    </h3>
                    <div className="mt-2">
                        {/* HARGA CORET BARU */}
                        {hasDiscount && (
                            <p className="text-xs text-slate-500 line-through">
                                {formatRupiah(product.harga_coret)}
                            </p>
                        )}
                        <p className="font-bold text-2xl text-orange-600">
                            {formatRupiah(product.harga_jual)}
                        </p>
                    </div>

                    {/* INFO UKURAN & STOK (tidak berubah) */}
                    <div className="flex justify-between text-xs mt-1">
                        <p className="text-slate-500">
                            Ukuran:{" "}
                            <span className="font-semibold text-slate-700">
                                {product.ukuran}
                            </span>
                        </p>
                        <p
                            className={`font-semibold ${isLowStock ? "text-red-500" : "text-slate-700"}`}
                        >
                            Stok: {product.stok}
                        </p>
                    </div>

                    {/* RATING & TERJUAL BARU */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-auto pt-2 border-t mt-2">
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

            {/* Tombol Add to Cart (tidak berubah) */}
            <div className="px-3 pb-3 mt-auto bg-orange-100/50">
                <AddToCartButton product={product} />
            </div>
        </div>
    );
};

export default ProductCard;
