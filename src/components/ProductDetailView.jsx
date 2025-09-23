// src/components/ProductDetailView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store.ts";
import { FiShoppingCart, FiStar, FiEye, FiPlus, FiMinus } from "react-icons/fi";
import ProductInfoTabs from "./ProductInfoTabs.jsx";

const ProductDetailView = ({ initialProduct, allProductVariants }) => {
    // 1. STATE UTAMA: Lacak varian yang sedang dipilih
    const [selectedVariant, setSelectedVariant] = useState(initialProduct);
    const [quantity, setQuantity] = useState(1);
    
    const { addToCart } = useAppStore();

    // Setiap kali varian yang dipilih berubah, perbarui juga state kuantitas jika perlu
    useEffect(() => {
        if (quantity > selectedVariant.stok) {
            setQuantity(1); // Reset kuantitas jika stok varian baru tidak mencukupi
        }
    }, [selectedVariant]);

    // Helper untuk format Rupiah
    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);

    // Mencari semua ukuran yang tersedia dari grup produk yang sama
    const availableSizes = useMemo(() => {
        return allProductVariants
            .filter(p => p.stok > 0 && p.status === "Aktif")
            .map(p => p.ukuran)
            .filter((value, index, self) => self.indexOf(value) === index);
    }, [allProductVariants]);
    
    // Fungsi untuk mengubah varian saat tombol ukuran diklik
    const handleSizeChange = (size) => {
        const newVariant = allProductVariants.find(p => p.ukuran === size);
        if (newVariant) {
            setSelectedVariant(newVariant);
        }
    };
    
    const handleQuantityChange = (amount) => {
        const newQuantity = Math.max(1, Math.min(selectedVariant.stok, quantity + amount));
        setQuantity(newQuantity);
    };

    const handleAddToCart = () => {
        // Gunakan notifikasi dari store yang sudah kita perbaiki
        addToCart(selectedVariant, quantity);
    };

    // Logika untuk Badges (sekarang membaca dari state 'selectedVariant')
    const hasDiscount = selectedVariant.harga_coret && selectedVariant.harga_coret > selectedVariant.harga_jual;
    const discountPercentage = hasDiscount ? Math.round(((selectedVariant.harga_coret - selectedVariant.harga_jual) / selectedVariant.harga_coret) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* --- SEMUA TAMPILAN DINAMIS PINDAH KE SINI --- */}
            <div>
                <h1 className="text-4xl font-bold mt-1">{selectedVariant.sku} - {selectedVariant.nama}</h1>
                {selectedVariant.lini_produk && <p className="text-lg text-blue-600 font-semibold uppercase tracking-wider">{selectedVariant.lini_produk}</p>}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1"><span className="font-bold text-orange-500">{selectedVariant.rating?.toFixed(1) || '5.0'}</span><FiStar className="text-orange-500" fill="currentColor" size={16} /></div>
                <div className="border-l pl-4"><span className="font-bold text-slate-800">{selectedVariant.jumlah_ulasan || 0}</span> Ulasan</div>
                <div className="border-l pl-4"><span className="font-bold text-slate-800">{selectedVariant.total_terjual || 0}</span> Terjual</div>
            </div>
            <div className="bg-slate-50 shadow-xl p-4 rounded-lg">
                {hasDiscount && <p className="text-xl text-slate-500 line-through">{formatRupiah(selectedVariant.harga_coret)}</p>}
                <p className="font-bold text-4xl text-orange-500">{formatRupiah(selectedVariant.harga_jual)}</p>
            </div>

            <a href={`/simulator?product_id=${selectedVariant.id}`} className="w-full flex items-center justify-center ...">
                <FiEye />
                <span>Coba Warna di Garasi Virtual</span>
            </a>
            
            {/* Panel Pembelian yang sudah digabung */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Ukuran</label>
                    <div className="flex gap-2 flex-wrap">
                        {availableSizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => handleSizeChange(size)}
                                className={`px-3 py-1.5 text-center text-sm font-semibold rounded-lg border-2 ${selectedVariant.ukuran === size ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah</label>
                        <div className="flex items-center border rounded-md">
                            <button onClick={() => handleQuantityChange(-1)} className="w-10 h-10 ..."><FiMinus /></button>
                            <input type="number" value={quantity} readOnly className="w-14 h-10 ..."/>
                            <button onClick={() => handleQuantityChange(1)} disabled={quantity >= selectedVariant.stok} className="w-10 h-10 ... disabled:opacity-50"><FiPlus /></button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 self-end">Stok Tersedia: <span className="font-bold">{selectedVariant.stok}</span></p>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleAddToCart}
                        disabled={selectedVariant.stok <= 0}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
                    >
                        <FiShoppingCart />
                        <span>{selectedVariant.stok > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}</span>
                    </button>
                </div>
            </div>
            
            <ProductInfoTabs product={selectedVariant} />
        </div>
    );
};

export default ProductDetailView;