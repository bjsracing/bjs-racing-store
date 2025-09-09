// File: src/components/ProductInfoTabs.tsx
// Perbaikan: Diubah ke .tsx, dan path impor untuk RelatedProducts diperbarui.

import React, { useState } from "react";
// PERBAIKAN UTAMA: Mengimpor file .tsx yang sudah diperbaiki
import RelatedProducts from "./RelatedProducts.tsx"; 

// Definisikan Tipe Data untuk prop 'product' agar lebih aman
interface Product {
    catatan?: string;
    specifications?: Record<string, string>;
    // tambahkan properti lain yang dibutuhkan oleh RelatedProducts
    id: string;
    merek?: string;
    lini_produk?: string;
}

interface ProductInfoTabsProps {
    product: Product;
}

const ProductInfoTabs = ({ product }: ProductInfoTabsProps) => {
    const [activeTab, setActiveTab] = useState("deskripsi");

    const tabs = [
        { id: "deskripsi", label: "Deskripsi Produk" },
        { id: "spesifikasi", label: "Spesifikasi" },
        { id: "terkait", label: "Produk Terkait" },
    ];

    // Logika render tetap sama, tidak ada perubahan
    return (
        <div className="mt-8">
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium ${
                                activeTab === tab.id
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-slate-500 hover:border-slate-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="py-6">
                {activeTab === "deskripsi" && (
                    <div className="prose max-w-none text-slate-600">
                        <p>{product.catatan || "Deskripsi belum tersedia."}</p>
                    </div>
                )}
                {activeTab === "spesifikasi" && (
                    <div>
                        {product.specifications &&
                        Object.keys(product.specifications).length > 0 ? (
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div key={key}>
                                        <dt className="font-semibold text-slate-800">{key}</dt>
                                        <dd className="text-slate-600">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <p className="text-slate-600">Spesifikasi belum tersedia.</p>
                        )}
                    </div>
                )}
                {activeTab === "terkait" && <RelatedProducts product={product} />}
            </div>
        </div>
    );
};

export default ProductInfoTabs;