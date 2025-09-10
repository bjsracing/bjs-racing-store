// src/components/RelatedProducts.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import ProductCard from "./ProductCard.jsx";

const RelatedProducts = ({ product }) => {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!product.merek || !product.lini_produk) return;
            setLoading(true);
            const { data, error } = await supabase.rpc("get_related_products", {
                p_product_id: product.id,
                p_merek: product.merek,
                p_lini_produk: product.lini_produk,
            });
            if (data) setRelated(data);
            setLoading(false);
        };
        fetchRelated();
    }, [product]);

    if (loading) return <p>Memuat produk terkait...</p>;
    if (related.length === 0) return null;

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
