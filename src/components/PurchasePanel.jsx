// src/components/PurchasePanel.jsx (Versi Final dengan Stok Dinamis Akurat)

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../lib/store.js";
import { FiShoppingCart, FiPlus, FiMinus } from "react-icons/fi";

const PurchasePanel = ({ initialProduct, allProductVariants }) => {
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

    const availableSizes = useMemo(() => {
        if (!initialProduct) return [];
        // Logika ini sudah benar, mencari berdasarkan nama, merek, dan lini produk
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
            );
    }, [initialProduct, allProductVariants]);

    // --- PERBAIKAN UTAMA DI SINI ---
    // useEffect untuk memperbarui produk yang ditampilkan saat ukuran berubah
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
            setProduct(newProductVariant); // Update produk yang ditampilkan (termasuk stoknya)
            // Reset kuantitas jika melebihi stok ukuran baru
            if (quantity > newProductVariant.stok) {
                setQuantity(1);
            }
        }
    }, [selectedSize, allProductVariants, initialProduct]);

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

    if (!product) return null;

    return (
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
    );
};

export default PurchasePanel;
