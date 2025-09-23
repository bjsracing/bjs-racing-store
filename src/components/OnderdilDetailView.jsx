// src/components/OnderdilDetailView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store.ts";
import {
    FiShoppingCart,
    FiStar,
    FiChevronLeft,
    FiChevronRight,
    FiPlus,
    FiMinus,
} from "react-icons/fi";
import ProductInfoTabs from "./ProductInfoTabs.jsx"; // Kita gunakan lagi komponen ini

const OnderdilDetailView = ({ initialProduct, allProductVariants }) => {
    const [selectedVariant, setSelectedVariant] = useState(initialProduct);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { addToCart } = useAppStore();

    // Efek untuk mereset kuantitas jika stok varian baru tidak mencukupi
    useEffect(() => {
        if (quantity > selectedVariant.stok) {
            setQuantity(1);
        }
        // Juga reset gambar ke gambar utama setiap kali varian berubah
        setCurrentImageIndex(0);
    }, [selectedVariant]);

    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);

    // --- LOGIKA BARU: Galeri Gambar ---
    const images = useMemo(() => {
        return [
            selectedVariant.image_url,
            selectedVariant.image_url_2,
            selectedVariant.image_url_3,
        ].filter(Boolean); // Filter untuk menghapus URL gambar yang kosong/null
    }, [selectedVariant]);

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1,
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1,
        );
    };

    // Logika untuk pilihan varian (ukuran, dll)
    const availableVariants = useMemo(() => {
        return allProductVariants
            .filter((p) => p.stok > 0 && p.status === "Aktif")
            .map((p) => ({ ukuran: p.ukuran, id: p.id }))
            .filter(
                (value, index, self) =>
                    self.findIndex((t) => t.ukuran === value.ukuran) === index,
            );
    }, [allProductVariants]);

    const handleVariantChange = (variantId) => {
        const newVariant = allProductVariants.find((p) => p.id === variantId);
        if (newVariant) {
            setSelectedVariant(newVariant);
        }
    };

    const handleQuantityChange = (amount) => {
        const newQuantity = Math.max(
            1,
            Math.min(selectedVariant.stok, quantity + amount),
        );
        setQuantity(newQuantity);
    };

    const handleAddToCart = () => {
        addToCart(selectedVariant, quantity);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* --- KOLOM KIRI: GALERI GAMBAR DINAMIS --- */}
            <div className="relative aspect-square">
                <div className="bg-white rounded-lg flex items-center justify-center p-2 shadow-xl border h-full">
                    {images.length > 0 ? (
                        <img
                            src={images[currentImageIndex]}
                            alt={selectedVariant.nama}
                            className="w-full h-full object-contain transition-opacity duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 rounded-md"></div>
                    )}
                </div>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md"
                        >
                            <FiChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md"
                        >
                            <FiChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* --- KOLOM KANAN: INFO & AKSI (SESUAI PERMINTAAN) --- */}
            <div className="space-y-4">
                <div>
                    {/* Tampilan Judul Baru: Nama - Kode */}
                    <h1 className="text-4xl font-bold mt-1">
                        {selectedVariant.nama} - {selectedVariant.kode}
                    </h1>
                    {/* Tampilan Merek di bawah judul */}
                    <p className="text-lg text-slate-600 font-semibold">
                        {selectedVariant.merek}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-orange-500">
                            {selectedVariant.rating?.toFixed(1) || "5.0"}
                        </span>
                        <FiStar
                            className="text-orange-500"
                            fill="currentColor"
                            size={16}
                        />
                    </div>
                    <div className="border-l pl-4">
                        <span className="font-bold text-slate-800">
                            {selectedVariant.jumlah_ulasan || 0}
                        </span>{" "}
                        Ulasan
                    </div>
                    <div className="border-l pl-4">
                        <span className="font-bold text-slate-800">
                            {selectedVariant.total_terjual || 0}
                        </span>{" "}
                        Terjual
                    </div>
                </div>

                <div className="bg-slate-50 shadow-xl p-4 rounded-lg">
                    <p className="font-bold text-4xl text-orange-500">
                        {formatRupiah(selectedVariant.harga_jual)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border">
                    {availableVariants.length > 1 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Pilih Varian (Ukuran/Tipe)
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {availableVariants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() =>
                                            handleVariantChange(variant.id)
                                        }
                                        className={`px-3 py-1.5 text-center text-sm font-semibold rounded-lg border-2 ${selectedVariant.id === variant.id ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                    >
                                        {variant.ukuran}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                                    disabled={quantity >= selectedVariant.stok}
                                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-md disabled:opacity-50"
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 self-end">
                            Stok Tersedia:{" "}
                            <span className="font-bold">
                                {selectedVariant.stok}
                            </span>
                        </p>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedVariant.stok <= 0}
                            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
                        >
                            <FiShoppingCart />
                            <span>
                                {selectedVariant.stok > 0
                                    ? "Tambah ke Keranjang"
                                    : "Stok Habis"}
                            </span>
                        </button>
                    </div>
                </div>

                <ProductInfoTabs product={selectedVariant} />
            </div>
        </div>
    );
};

export default OnderdilDetailView;
