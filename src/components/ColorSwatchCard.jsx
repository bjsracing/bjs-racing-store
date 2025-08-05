// src/components/ColorSwatchCard.jsx

import React from "react";

const ColorSwatchCard = ({ product }) => {
    return (
        <a href={`/products/${product.id}`} className="block text-center group">
            <div className="aspect-square w-full flex items-center justify-center p-2">
                <img
                    src={product.color_swatch_url}
                    alt={product.nama}
                    className="w-full h-full object-cover rounded-full shadow-md transition-transform duration-300 group-hover:scale-110"
                />
            </div>
            {/* --- BLOK INFO YANG DIPERBARUI --- */}
            <div className="mt-2">
                <p className="text-xs text-slate-400 truncate">
                    {product.merek} - {product.lini_produk}
                </p>
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                    {product.nama}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                    {product.sku}
                </p>
            </div>
        </a>
    );
};

export default ColorSwatchCard;
