// File: src/components/RelatedProducts.tsx
// Perbaikan Final: Disesuaikan dengan arsitektur AuthContext yang aman untuk SSR.

import React, { useState, useEffect } from "react";
// PERBAIKAN 1: Impor FUNGSI useAuth dari pusat kontrol sesi kita
import { useAuth } from "../lib/authContext.tsx";
import ProductCard from "./ProductCard.jsx"; // Boleh tetap mengimpor file .jsx

// Definisikan Tipe Data untuk props agar lebih aman
interface Product {
    id: string;
    merek?: string;
    lini_produk?: string;
    // tambahkan properti lain jika ada, agar bisa di-pass ke ProductCard
    [key: string]: any;
}

interface RelatedProductsProps {
    product: Product;
}

const RelatedProducts = ({ product }: RelatedProductsProps) => {
    // PERBAIKAN 2: Gunakan hook useAuth untuk mendapatkan client Supabase yang aman
    const { supabase } = useAuth();

    const [related, setRelated] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // PERBAIKAN 3: Tambahkan guard clause untuk memastikan supabase sudah siap
        if (!supabase) {
            // Jika supabase belum siap, jangan lakukan apa-apa.
            // useEffect akan berjalan lagi saat supabase tersedia.
            return;
        }

        const fetchRelated = async () => {
            if (!product.merek || !product.lini_produk) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase.rpc("get_related_products", {
                p_product_id: product.id,
                p_merek: product.merek,
                p_lini_produk: product.lini_produk,
            });

            if (error) {
                console.error("Gagal memuat produk terkait:", error);
            } else {
                setRelated(data || []);
            }
            setLoading(false);
        };
        fetchRelated();
    }, [product, supabase]); // supabase sekarang menjadi dependensi yang valid

    if (loading)
        return (
            <p className="text-center text-sm text-slate-500">
                Memuat produk terkait...
            </p>
        );
    if (related.length === 0) return null; // Jangan tampilkan apa pun jika tidak ada produk terkait

    return (
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4">
                {related.map((item) => (
                    <div key={item.id} className="w-48 flex-shrink-0">
                        <ProductCard product={item} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
