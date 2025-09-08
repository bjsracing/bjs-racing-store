// src/components/ProductDetailView.jsx (Versi Final dengan Stok Dinamis)

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../lib/store.js";
import { FiShoppingCart, FiStar, FiEye, FiPlus, FiMinus } from "react-icons/fi";
import ProductInfoTabs from "./ProductInfoTabs.jsx";

const ProductDetailView = ({ initialProduct, allProductVariants }) => {
    // State untuk produk yang sedang ditampilkan (bisa berubah saat ukuran dipilih)
    const [product, setProduct] = useState(initialProduct);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(initialProduct.ukuran);
    const { addToCart } = useAppStore();

    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);

    // PERBAIKAN UTAMA: Logika untuk mencari ukuran yang tersedia
    const availableSizes = useMemo(() => {
        if (!initialProduct) return [];
        // Cari semua varian produk berdasarkan NAMA, MEREK, dan LINI PRODUK yang sama
        return allProductVariants
            .filter(
                (p) =>
                    p.nama === initialProduct.nama &&
                    p.merek === initialProduct.merek &&
                    p.lini_produk === initialProduct.lini_produk &&
                    p.stok > 0 &&
                    p.status === "Aktif",
            )
            .map((p) => ({ size: p.ukuran, stock: p.stok }))
            .filter(
                (value, index, self) =>
                    self.findIndex((t) => t.size === value.size) === index,
            ); // Ambil unik
    }, [initialProduct, allProductVariants]);

    // PERBAIKAN UTAMA: useEffect untuk memperbarui produk saat ukuran berubah
    useEffect(() => {
        // Cari varian produk yang cocok dengan ukuran yang baru dipilih
        const newProductVariant = allProductVariants.find(
            (p) =>
                p.ukuran === selectedSize &&
                p.nama === initialProduct.nama &&
                p.merek === initialProduct.merek &&
                p.lini_produk === initialProduct.lini_produk,
        );

        if (newProductVariant) {
            setProduct(newProductVariant); // Update produk yang ditampilkan
            // Reset kuantitas jika melebihi stok ukuran baru
            if (quantity > newProductVariant.stok) {
                setQuantity(1);
            }
        }
    }, [selectedSize, allProductVariants, initialProduct, quantity]);

    const handleQuantityChange = (amount) => {
        const newQuantity = Math.max(
            1,
            Math.min(product.stok, quantity + amount),
        );
        setQuantity(newQuantity);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        alert(
            `${quantity} x ${product.nama} (${product.ukuran}) berhasil ditambahkan.`,
        );
    };

    // Logika untuk Badges
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
    const isBestSeller = product.total_terjual > 50;

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {product.merek}
                </p>
                <h1 className="text-4xl font-bold mt-1">
                    {product.nama}{" "}
                    <span className="text-3xl text-slate-400 font-medium">
                        {product.sku}
                    </span>
                </h1>
                {product.lini_produk && (
                    <p className="text-lg text-slate-600 font-semibold">
                        {product.lini_produk}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-orange-500">
                        {product.rating?.toFixed(1) || "5.0"}
                    </span>
                    <FiStar
                        className="text-orange-500"
                        fill="currentColor"
                        size={16}
                    />
                </div>
                <div className="border-l pl-4">
                    <span className="font-bold text-slate-800">
                        {product.jumlah_ulasan || 0}
                    </span>{" "}
                    Ulasan
                </div>
                <div className="border-l pl-4">
                    <span className="font-bold text-slate-800">
                        {product.total_terjual || 0}
                    </span>{" "}
                    Terjual
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
                {hasDiscount && (
                    <p className="text-base text-slate-400 line-through">
                        {formatRupiah(product.harga_coret)}
                    </p>
                )}
                <p className="font-bold text-4xl text-orange-500">
                    {formatRupiah(product.harga_jual)}
                </p>
            </div>

            {product.kategori === "Pilok" && (
                <a
                    href={`/simulator?product_id=${product.id}`}
                    className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-slate-900 transition-colors"
                >
                    <FiEye />
                    <span>Coba Warna di Garasi Virtual</span>
                </a>
            )}

            <div className="bg-white p-6 rounded-xl shadow-lg border">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Pilih Ukuran
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {availableSizes.map((item) => (
                            <button
                                key={item.size}
                                onClick={() => setSelectedSize(item.size)}
                                className={`px-3 py-1.5 text-center text-sm font-semibold rounded-lg border-2 ${selectedSize === item.size ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                            >
                                <div>{item.size}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Jumlah
                        </label>
                        <div className="flex items-center border rounded-md">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-md"
                            >
                                <FiMinus />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                readOnly
                                className="w-14 h-10 text-center font-semibold border-l border-r focus:ring-0"
                            />
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-md"
                            >
                                <FiPlus />
                            </button>
                        </div>
                    </div>
                    {/* PERBAIKAN: Stok dinamis sekarang akan selalu akurat */}
                    <p className="text-sm text-slate-500 self-end">
                        Stok Tersedia:{" "}
                        <span className="font-bold">{product.stok}</span>
                    </p>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleAddToCart}
                        disabled={availableSizes.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
                    >
                        <FiShoppingCart />
                        <span>Tambah ke Keranjang</span>
                    </button>
                </div>
            </div>
            <ProductInfoTabs product={product} />
        </div>
    );
};

export default ProductDetailView;
