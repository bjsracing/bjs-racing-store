// src/components/ColorCatalogFilter.jsx

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

const ColorCatalogFilter = ({ filters, setFilters }) => {
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        const fetchAllProductsForFilter = async () => {
            const { data } = await supabase
                .from("products")
                .select("merek, lini_produk, color_variant")
                .eq("status", "Aktif")
                .eq("kategori", "Pilok");
            setAllProducts(data || []);
        };
        fetchAllProductsForFilter();
    }, []);

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

        return {
            merek: merekOptions,
            lini_produk: liniProdukOptions,
            color_variant: colorVariantOptions,
        };
    }, [allProducts, filters]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "merek") {
            setFilters((prev) => ({
                ...prev,
                merek: value,
                lini_produk: "semua",
                color_variant: "semua",
            }));
        } else if (name === "lini_produk") {
            setFilters((prev) => ({
                ...prev,
                lini_produk: value,
                color_variant: "semua",
            }));
        } else {
            setFilters((prev) => ({ ...prev, [name]: value }));
        }
    };

    const resetFilters = () => {
        setFilters({
            searchTerm: "",
            merek: "semua",
            lini_produk: "semua",
            color_variant: "semua",
        });
    };

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
                    placeholder="Cari nama atau kode produk..."
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <button
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg text-sm"
                >
                    <FiRefreshCw size={16} /> Reset
                </button>
            </div>
        </div>
    );
};

export default ColorCatalogFilter;
