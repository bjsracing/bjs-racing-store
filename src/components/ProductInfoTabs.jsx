// src/components/ProductInfoTabs.jsx

import React, { useState } from "react";

const ProductInfoTabs = ({ product }) => {
  const [activeTab, setActiveTab] = useState("deskripsi");

  const tabs = [
    { id: "deskripsi", label: "Deskripsi Produk" },
    { id: "spesifikasi", label: "Spesifikasi" },
  ];

  return (
    <div className="mt-8">
      {/* Tombol Tab */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Konten Tab */}
      <div className="py-6">
        {activeTab === "deskripsi" && (
          <div className="prose max-w-none text-slate-600">
            <p>
              {product.catatan || "Deskripsi untuk produk ini belum tersedia."}
            </p>
          </div>
        )}

        {/* --- BLOK SPESIFIKASI YANG DIPERBARUI --- */}
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
              <p className="text-slate-600">
                Spesifikasi untuk produk ini belum tersedia.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfoTabs;
