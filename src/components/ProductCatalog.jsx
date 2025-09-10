// src/components/ProductCatalog.jsx (Versi Final yang bisa menangani 2 tampilan)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import CatalogFilter from "./CatalogFilter.jsx";
import ProductCard from "./ProductCard.jsx";
import ColorSwatchCard from "./ColorSwatchCard.jsx";

const ProductCatalog = ({ filterConfig, cardType = "product" }) => {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        searchTerm: "",
        sort: "terlaris",
        price: "",
        merek: "semua",
        lini_produk: "semua",
        color_variant: "semua",
        ukuran: "semua",
    });

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
            p_search_term: filters.searchTerm,
        });

        if (error) console.error("Gagal memuat produk:", error.message);
        else setAllProducts(data || []);

        setLoading(false);
    }, [filterConfig, filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Kelompokkan produk untuk tampilan Katalog Warna
    const groupedProducts = useMemo(() => {
        if (cardType !== "colorSwatch") return null;

        const uniqueProducts = new Map();
        allProducts.forEach((p) => {
            if (!uniqueProducts.has(p.nama) && p.color_swatch_url) {
                uniqueProducts.set(p.nama, p);
            }
        });
        const uniqueProductList = Array.from(uniqueProducts.values());

        return uniqueProductList.reduce((acc, product) => {
            const variant = product.color_variant || "Lainnya";
            if (!acc[variant]) acc[variant] = [];
            acc[variant].push(product);
            return acc;
        }, {});
    }, [allProducts, cardType]);

    return (
        <div>
            <CatalogFilter
                filters={filters}
                setFilters={setFilters}
                filterConfig={filterConfig}
            />

            {loading ? (
                <p className="text-center py-20">Memuat produk...</p>
            ) : cardType === "colorSwatch" ? (
                // Tampilan untuk Katalog Warna
                Object.keys(groupedProducts).length > 0 ? (
                    <div className="space-y-12">
                        {Object.entries(groupedProducts).map(
                            ([variantName, products]) => (
                                <div key={variantName}>
                                    <h2 className="text-xl font-bold border-b-2 border-orange-400 pb-2 mb-6">
                                        {variantName}
                                    </h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8">
                                        {products.map((product) => (
                                            <ColorSwatchCard
                                                key={product.id}
                                                product={product}
                                                allProductsInCatalog={
                                                    allProducts
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <p className="text-center py-20 text-slate-500">
                        Warna tidak ditemukan.
                    </p>
                )
            ) : // Tampilan untuk Katalog Produk biasa
            allProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {allProducts.map((product) => (
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
