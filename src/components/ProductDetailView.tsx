// File: src/components/ProductDetailView.tsx
// Perbaikan: Melengkapi Tipe Data, mengembalikan UI rating, dan memperbaiki tipe fungsi.

import React, { useState, useEffect, useMemo } from "react";
// PERBAIKAN 1: Path impor menunjuk ke file .ts dan menggunakan alias path
import { useAppStore } from "@/lib/store.ts";
// PERBAIKAN 2: Mengembalikan FiStar karena akan digunakan lagi
import { FiShoppingCart, FiStar, FiEye, FiPlus, FiMinus } from "react-icons/fi";
import ProductInfoTabs from "./ProductInfoTabs.jsx";

// PERBAIKAN 3: Melengkapi Tipe Data 'Product' agar sesuai dengan penggunaan
interface Product {
    id: string;
    nama: string;
    harga_jual: number;
    harga_coret?: number;
    stok: number;
    stok_min: number;
    merek: string;
    ukuran: string;
    sku: string;
    lini_produk?: string;
    rating?: number;
    jumlah_ulasan?: number;
    total_terjual?: number;
    kategori: string;
    berat_gram: number;
    image_url: string; // Menambahkan image_url
    status: string; // Menambahkan status
}

interface ProductDetailViewProps {
    initialProduct: Product;
    allProductVariants: Product[];
}

const ProductDetailView = ({
    initialProduct,
    allProductVariants,
}: ProductDetailViewProps) => {
    const [product, setProduct] = useState<Product>(initialProduct);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(initialProduct.ukuran);
    const [isAdding, setIsAdding] = useState(false);
    const { addToCart } = useAppStore();

    // PERBAIKAN 4: Menghapus type annotation yang terlalu ketat
    const formatRupiah = (number: number | undefined) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number || 0);

    const availableSizes = useMemo(() => {
        if (!initialProduct) return [];
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

    useEffect(() => {
        const newProductVariant = allProductVariants.find(
            (p) =>
                p.ukuran === selectedSize &&
                p.nama === initialProduct.nama &&
                p.merek === initialProduct.merek &&
                p.lini_produk === initialProduct.lini_produk,
        );
        if (newProductVariant) {
            setProduct(newProductVariant);
            if (quantity > newProductVariant.stok) {
                setQuantity(1);
            }
        }
    }, [selectedSize, allProductVariants, initialProduct, quantity]);

    const handleQuantityChange = (amount: number) => {
        const newQuantity = Math.max(
            1,
            Math.min(product.stok, quantity + amount),
        );
        setQuantity(newQuantity);
    };

    const handleAddToCart = async () => {
        if (isAdding) return;
        setIsAdding(true);
        try {
            await addToCart(product, quantity);
            alert(
                `${quantity} x ${product.nama} (${product.ukuran}) berhasil ditambahkan.`,
            );
        } catch (error) {
            console.error("Gagal menambahkan ke keranjang:", error);
            alert("Gagal menambahkan produk. Silakan coba lagi.");
        } finally {
            setIsAdding(false);
        }
    };

    const hasDiscount =
        product.harga_coret && product.harga_coret > product.harga_jual;

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

            {/* PERBAIKAN 5: Mengembalikan UI Rating */}
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
                    <p className="text-sm text-slate-500 self-end">
                        Stok Tersedia:{" "}
                        <span className="font-bold">{product.stok}</span>
                    </p>
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleAddToCart}
                        disabled={availableSizes.length === 0 || isAdding}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-wait"
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
            </div>

            <ProductInfoTabs product={product} />
        </div>
    );
};

export default ProductDetailView;
