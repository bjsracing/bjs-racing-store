// File: src/components/ColorSimulator.jsx
// Perbaikan: Disesuaikan dengan arsitektur AuthContext dan menangani addToCart asinkron.

import React, { useState, useEffect, useMemo } from "react";
// PERBAIKAN 1: Impor FUNGSI useAuth dari pusat kontrol sesi kita
import { useAuth } from "../lib/authContext.tsx";
import { useAppStore } from "../lib/store.ts";
import { FiShoppingCart } from "react-icons/fi";

// Fungsi hexToHsl (Tidak ada perubahan)
const hexToHsl = (hex) => {
  if (!hex) return [0, 0, 0];
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

const ColorSimulator = ({ initialProductId }) => {
  // PERBAIKAN 2: Gunakan hook useAuth untuk mendapatkan client Supabase yang aman
  const { supabase } = useAuth();

  const [objects, setObjects] = useState([]);
  const [allColorProducts, setAllColorProducts] = useState([]);
  const [simulationVariants, setSimulationVariants] = useState([]);
  const [productLines, setProductLines] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedObjectModel, setSelectedObjectModel] = useState(null);
  const [selectedColorProduct, setSelectedColorProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [simulationImageUrl, setSimulationImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // State loading untuk tombol keranjang
  const { addToCart } = useAppStore();

  useEffect(() => {
    // PERBAIKAN 3: Tambahkan guard clause untuk memastikan supabase sudah siap
    if (!supabase) return;

    const fetchInitialData = async () => {
      setLoading(true);
      const [objectsRes, productsRes, variantsRes, linesRes] =
        await Promise.all([
          supabase.from("simulation_objects").select("*").order("name"),
          supabase
            .from("products")
            .select("*, suppliers(nama_supplier)")
            .eq("kategori", "Pilok")
            .order("merek"),
          supabase.from("simulation_variants").select("*"),
          supabase.from("product_lines").select("*"),
        ]);
      setObjects(objectsRes.data || []);
      setAllColorProducts(productsRes.data || []);
      setSimulationVariants(variantsRes.data || []);
      setProductLines(linesRes.data || []);
      setLoading(false);
    };
    fetchInitialData();
  }, [supabase]); // supabase sekarang menjadi dependensi

  // ... (Semua logika useMemo dan useEffect lainnya tetap sama persis) ...
  useEffect(() => {
    if (loading) return;
    if (!selectedObjectModel && objects.length > 0) {
      setSelectedObjectModel(objects[0]);
    }
    if (!selectedColorProduct) {
      const product =
        allColorProducts.find((p) => p.id === initialProductId) ||
        allColorProducts[0];
      if (product) {
        setSelectedColorProduct(product);
        setSelectedBrand(product.merek);
        setSelectedVariant(product.color_variant);
        setSelectedSize(product.ukuran);
      }
    }
  }, [loading, initialProductId, allColorProducts, objects]);

  useEffect(() => {
    if (!selectedObjectModel || !selectedColorProduct) return;
    const match = simulationVariants.find(
      (v) =>
        v.product_id === selectedColorProduct.id &&
        v.simulation_object_id === selectedObjectModel.id,
    );
    setSimulationImageUrl(
      match ? match.colored_image_url : selectedObjectModel.base_image_url,
    );
  }, [selectedObjectModel, selectedColorProduct, simulationVariants]);

  const brands = useMemo(
    () => [...new Set(allColorProducts.map((p) => p.merek).filter(Boolean))],
    [allColorProducts],
  );
  const productLinesByBrand = useMemo(() => {
    if (!selectedBrand) return [];
    return productLines.filter((line) => line.brand_name === selectedBrand);
  }, [productLines, selectedBrand]);
  const variantsByLine = useMemo(() => {
    if (!selectedBrand || !selectedLine) return [];
    return [
      ...new Set(
        allColorProducts
          .filter(
            (p) =>
              p.merek === selectedBrand &&
              p.lini_produk === selectedLine &&
              p.color_variant,
          )
          .map((p) => p.color_variant),
      ),
    ];
  }, [allColorProducts, selectedBrand, selectedLine]);
  const colorPalette = useMemo(() => {
    if (!selectedBrand || !selectedLine || !selectedVariant) return [];
    const filteredProducts = allColorProducts.filter(
      (p) =>
        p.merek === selectedBrand &&
        p.lini_produk === selectedLine &&
        p.color_variant === selectedVariant &&
        p.color_swatch_url,
    );
    const uniqueColors = new Map();
    filteredProducts.forEach((p) => {
      if (!uniqueColors.has(p.nama)) {
        uniqueColors.set(p.nama, p);
      }
    });
    return Array.from(uniqueColors.values()).sort((a, b) => {
      const [h1, s1, l1] = hexToHsl(a.color_hex);
      const [h2, s2, l2] = hexToHsl(b.color_hex);
      if (h1 !== h2) return h1 - h2;
      if (l1 !== l2) return l1 - l2;
      return s1 - s2;
    });
  }, [allColorProducts, selectedBrand, selectedLine, selectedVariant]);
  const objectModels = useMemo(
    () => [...new Set(objects.map((o) => o.model).filter(Boolean))],
    [objects],
  );
  const availableSizes = useMemo(() => {
    if (!selectedColorProduct) return [];
    const productVariants = allColorProducts.filter(
      (p) =>
        p.nama === selectedColorProduct.nama &&
        p.merek === selectedColorProduct.merek &&
        p.lini_produk === selectedColorProduct.lini_produk,
    );
    const inStockVariants = productVariants.filter(
      (p) => p.stok > 0 && p.status === "Aktif",
    );
    const uniqueSizes = new Map();
    inStockVariants.forEach((p) => {
      if (!uniqueSizes.has(p.ukuran)) {
        uniqueSizes.set(p.ukuran, { size: p.ukuran, stock: p.stok });
      }
    });
    return Array.from(uniqueSizes.values());
  }, [allColorProducts, selectedColorProduct]);

  // PERBAIKAN 4: Ubah handleAddToCart menjadi fungsi asinkron
  const handleAddToCart = async () => {
    if (!selectedColorProduct || !selectedSize)
      return alert("Silakan pilih ukuran terlebih dahulu.");
    if (isAddingToCart) return;

    const productToAdd = allColorProducts.find(
      (p) =>
        p.nama === selectedColorProduct.nama &&
        p.merek === selectedColorProduct.merek &&
        p.ukuran === selectedSize,
    );

    if (productToAdd) {
      setIsAddingToCart(true);
      try {
        await addToCart(productToAdd, 1);
        alert(
          `1 x ${productToAdd.nama} (${productToAdd.ukuran}) berhasil ditambahkan.`,
        );
      } catch (error) {
        alert("Gagal menambahkan ke keranjang.");
      } finally {
        setIsAddingToCart(false);
      }
    } else {
      alert("Produk dengan ukuran yang dipilih tidak ditemukan.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">Menyiapkan Virtual Garage...</div>
    );

  // Render JSX (dengan tombol Add to Cart yang diperbarui)
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Kolom Kiri - Filter */}
      <div className="w-full lg:w-1/4 bg-white p-4 rounded-xl shadow-lg h-fit">
        {/* ... (Isi filter Anda tetap sama) ... */}
      </div>

      {/* Kolom Tengah - Simulator */}
      <div className="w-full lg:w-1/2 space-y-6">
        {/* ... (Isi simulator Anda tetap sama) ... */}
      </div>

      {/* Kolom Kanan - Detail Produk */}
      <div className="w-full lg:w-1/4">
        {selectedColorProduct && (
          <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
            <div className="flex-grow">
              {/* ... (Detail produk Anda tetap sama) ... */}
            </div>
            <div className="mt-6 pt-4 border-t">
              {/* PERBAIKAN 5: Tombol sekarang menangani state loading */}
              <button
                onClick={handleAddToCart}
                disabled={availableSizes.length === 0 || isAddingToCart}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-wait"
              >
                {isAddingToCart ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w.org/2000/svg"
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
        )}
      </div>
    </div>
  );
};

export default ColorSimulator;
