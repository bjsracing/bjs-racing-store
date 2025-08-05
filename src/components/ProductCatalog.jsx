// src/components/ProductCatalog.jsx (Versi Final & Stabil)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import CatalogFilter from "./CatalogFilter.jsx";
import ProductCard from "./ProductCard.jsx";

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const ProductCatalog = ({ filterConfig }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sort: "terlaris", // Filter default
        price: "",
        searchTerm: "",
        merek: "semua",
        lini_produk: "semua",
        color_variant: "semua",
        ukuran: "semua",
    });
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        let sortBy = filters.sort;
        if (filters.price === "terendah") sortBy = "harga_asc";
        if (filters.price === "tertinggi") sortBy = "harga_desc";

        const { data, error } = await supabase.rpc("search_and_sort_products", {
            p_kategori: filterConfig.category || null,
            p_merek:
                filterConfig.brand ||
                (filters.merek === "semua" ? null : filters.merek),
            p_lini_produk:
                filters.lini_produk === "semua" ? null : filters.lini_produk,
            p_color_variant:
                filters.color_variant === "semua"
                    ? null
                    : filters.color_variant,
            p_ukuran: filters.ukuran === "semua" ? null : filters.ukuran,
            p_sort_by: sortBy,
            p_search_term: debouncedSearchTerm,
        });

        if (error) {
            console.error("Gagal memuat produk:", error.message);
            setProducts([]);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    }, [filterConfig, filters, debouncedSearchTerm]);

    // useEffect utama yang memicu pengambilan data
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div>
            {/* CatalogFilter sekarang hanya menerima state dan fungsi untuk mengubahnya */}
            <CatalogFilter
                filters={filters}
                setFilters={setFilters}
                filterConfig={filterConfig}
            />

            {loading ? (
                <p className="text-center py-20">Memuat produk...</p>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <p className="text-center py-20 text-slate-500">
                    Produk tidak ditemukan.
                </p>
            )}
        </div>
    );
};

export default ProductCatalog;
