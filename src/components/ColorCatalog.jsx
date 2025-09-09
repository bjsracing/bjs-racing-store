// File: src/components/ColorCatalog.jsx
// Perbaikan: Disesuaikan dengan arsitektur AuthContext yang aman untuk SSR.

import React, { useState, useEffect, useCallback, useMemo } from "react";
// PERBAIKAN 1: Impor FUNGSI useAuth dari pusat kontrol sesi kita
import { useAuth } from "../lib/authContext.tsx";
import ColorCatalogFilter from "./ColorCatalogFilter.jsx";
import ColorSwatchCard from "./ColorSwatchCard.jsx";

// Hook useDebounce (tidak ada perubahan)
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const ColorCatalog = () => {
    // PERBAIKAN 2: Gunakan hook useAuth untuk mendapatkan client Supabase yang aman
    const { supabase } = useAuth();

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        searchTerm: "",
        merek: "semua",
        lini_produk: "semua",
        color_variant: "semua",
    });

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    const fetchProducts = useCallback(async () => {
        // PERBAIKAN 3: Tambahkan guard clause untuk memastikan supabase sudah siap
        if (!supabase) return;

        setLoading(true);
        let query = supabase
            .from("products")
            .select("*")
            .eq("status", "Aktif")
            .eq("kategori", "Pilok");

        if (filters.merek !== "semua") query = query.eq("merek", filters.merek);
        if (filters.lini_produk !== "semua")
            query = query.eq("lini_produk", filters.lini_produk);
        if (filters.color_variant !== "semua")
            query = query.eq("color_variant", filters.color_variant);
        if (debouncedSearchTerm) {
            query = query.or(
                `nama.ilike.%${debouncedSearchTerm}%,sku.ilike.%${debouncedSearchTerm}%`,
            );
        }

        const { data, error } = await query.order("nama");

        if (error) console.error("Gagal memuat produk:", error.message);
        else {
            const uniqueProducts = new Map();
            (data || []).forEach((p) => {
                if (!uniqueProducts.has(p.nama) && p.color_swatch_url) {
                    uniqueProducts.set(p.nama, p);
                }
            });
            setAllProducts(Array.from(uniqueProducts.values()));
        }
        setLoading(false);
    }, [
        filters.merek,
        filters.lini_produk,
        filters.color_variant,
        debouncedSearchTerm,
        supabase, // supabase sekarang menjadi dependensi yang valid
    ]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Logika pengelompokan (tidak ada perubahan)
    const groupedProducts = useMemo(() => {
        return allProducts.reduce((acc, product) => {
            const variant = product.color_variant || "Lainnya";
            if (!acc[variant]) acc[variant] = [];
            acc[variant].push(product);
            return acc;
        }, {});
    }, [allProducts]);

    // Render JSX (tidak ada perubahan)
    return (
        <div>
            <ColorCatalogFilter filters={filters} setFilters={setFilters} />

            {loading ? (
                <p className="text-center py-20">Memuat warna...</p>
            ) : Object.keys(groupedProducts).length > 0 ? (
                <div className="space-y-12">
                    {Object.entries(groupedProducts)
                        .sort(([variantA], [variantB]) =>
                            variantA.localeCompare(variantB),
                        )
                        .map(([variantName, products]) => (
                            <div key={variantName}>
                                <h2 className="text-xl font-bold border-b-2 border-orange-400 pb-2 mb-6">
                                    {variantName}
                                </h2>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8">
                                    {products.map((product) => (
                                        <ColorSwatchCard
                                            key={product.id}
                                            product={product}
                                            allProductsInCatalog={allProducts}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            ) : (
                <p className="text-center py-20 text-slate-500">
                    Warna tidak ditemukan.
                </p>
            )}
        </div>
    );
};

export default ColorCatalog;
