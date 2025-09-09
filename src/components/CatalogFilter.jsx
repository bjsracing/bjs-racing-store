// File: src/components/CatalogFilter.jsx
// Perbaikan: Menyesuaikan cara impor dan penggunaan Supabase client agar aman untuk SSR.

import React, { useState, useEffect, useMemo } from "react";
// PERBAIKAN 1: Impor FUNGSI getSupabaseBrowserClient, bukan konstanta supabase
import { getSupabaseBrowserClient } from "../lib/supabaseClient.js";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

const CatalogFilter = ({ filters, setFilters, filterConfig }) => {
    const [allProducts, setAllProducts] = useState([]);

    // PERBAIKAN 2: Panggil fungsi untuk mendapatkan instance client Supabase yang aman
    const supabase = getSupabaseBrowserClient();

    // Ambil SEMUA data produk yang relevan sekali saja untuk mengisi opsi dropdown
    useEffect(() => {
        const fetchAllProductsForFilter = async () => {
            let query = supabase
                .from("products")
                .select("merek, lini_produk, color_variant, ukuran")
                .eq("status", "Aktif");
            if (filterConfig.category)
                query = query.eq("kategori", filterConfig.category);

            const { data } = await query;
            setAllProducts(data || []);
        };
        fetchAllProductsForFilter();
    }, [supabase, filterConfig]); // PERBAIKAN 3: Tambahkan supabase sebagai dependensi

    // LOGIKA CASCADING FILTER (Tidak ada perubahan, sudah benar)
    const options = useMemo(() => {
        const merekOptions = [
            ...new Set(allProducts.map((p) => p.merek).filter(Boolean)),
        ].sort();

        const filteredByMerek =
            filters.merek === "semua"
                ? allProducts
                : allProducts.filter((p) => p.merek === filters.merek);
        const liniProdukOptions = [
            ...new Set(
                filteredByMerek.map((p) => p.lini_produk).filter(Boolean),
            ),
        ].sort();

        const filteredByLine =
            filters.lini_produk === "semua"
                ? filteredByMerek
                : filteredByMerek.filter(
                      (p) => p.lini_produk === filters.lini_produk,
                  );
        const colorVariantOptions = [
            ...new Set(
                filteredByLine.map((p) => p.color_variant).filter(Boolean),
            ),
        ].sort();

        const filteredByVariant =
            filters.color_variant === "semua"
                ? filteredByLine
                : filteredByLine.filter(
                      (p) => p.color_variant === filters.color_variant,
                  );
        const ukuranOptions = [
            ...new Set(filteredByVariant.map((p) => p.ukuran).filter(Boolean)),
        ].sort();

        return {
            merek: merekOptions,
            lini_produk: liniProdukOptions,
            color_variant: colorVariantOptions,
            ukuran: ukuranOptions,
        };
    }, [allProducts, filters]);

    // LOGIKA HANDLER (Tidak ada perubahan, sudah benar)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "merek")
            setFilters((prev) => ({
                ...prev,
                merek: value,
                lini_produk: "semua",
                color_variant: "semua",
                ukuran: "semua",
            }));
        else if (name === "lini_produk")
            setFilters((prev) => ({
                ...prev,
                lini_produk: value,
                color_variant: "semua",
                ukuran: "semua",
            }));
        else if (name === "color_variant")
            setFilters((prev) => ({
                ...prev,
                color_variant: value,
                ukuran: "semua",
            }));
        else setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (type, value) => {
        if (type === "sort" && filters.price !== "")
            setFilters((prev) => ({ ...prev, sort: value, price: "" }));
        else
            setFilters((prev) => ({
                ...prev,
                sort: value,
                price: type === "price" ? value : "",
            }));
    };

    const resetFilters = () =>
        setFilters({
            searchTerm: "",
            sort: "terlaris",
            price: "",
            merek: "semua",
            lini_produk: "semua",
            color_variant: "semua",
            ukuran: "semua",
        });

    // RENDER JSX (Tidak ada perubahan, sudah benar)
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleInputChange}
                    className="w-full p-2 pl-10 border rounded-lg text-sm"
                    placeholder="Cari di toko ini..."
                />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {filterConfig.showMerekFilter && (
                    <select
                        name="merek"
                        value={filters.merek}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="semua">Semua Merek</option>
                        {options.merek.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                )}
                {filterConfig.showLiniProdukFilter && (
                    <select
                        name="lini_produk"
                        value={filters.lini_produk}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="semua">Semua Lini Produk</option>
                        {options.lini_produk.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                )}
                {filterConfig.showColorVariantFilter && (
                    <select
                        name="color_variant"
                        value={filters.color_variant}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="semua">Semua Varian Warna</option>
                        {options.color_variant.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                )}
                {filterConfig.showUkuranFilter && (
                    <select
                        name="ukuran"
                        value={filters.ukuran}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="semua">Semua Ukuran</option>
                        {options.ukuran.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                )}
                <button
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg text-sm"
                >
                    <FiRefreshCw size={16} /> Reset
                </button>
            </div>
            <div className="flex items-center gap-2 border-t pt-4">
                <span className="text-sm font-semibold text-slate-700 mr-2">
                    Urutkan:
                </span>
                <button
                    onClick={() => handleSortChange("sort", "terlaris")}
                    className={`px-4 py-2 text-sm rounded-md ${filters.sort === "terlaris" && !filters.price ? "bg-orange-500 text-white" : "bg-slate-100"}`}
                >
                    Terlaris
                </button>
                <button
                    onClick={() => handleSortChange("sort", "terbaru")}
                    className={`px-4 py-2 text-sm rounded-md ${filters.sort === "terbaru" && !filters.price ? "bg-orange-500 text-white" : "bg-slate-100"}`}
                >
                    Terbaru
                </button>
                <select
                    value={filters.price}
                    onChange={(e) => handleSortChange("price", e.target.value)}
                    className="p-2 border rounded-lg bg-white text-sm"
                >
                    <option value="">Harga</option>
                    <option value="terendah">Terendah</option>
                    <option value="tertinggi">Tertinggi</option>
                </select>
            </div>
        </div>
    );
};

export default CatalogFilter;
