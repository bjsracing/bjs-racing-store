// src/components/RelatedProducts.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseBrowserClient.ts";
import ProductCard from "./ProductCard.jsx";

const RelatedProducts = ({ productId, merek, lini_produk, limit = 4 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_related_products", {
          p_product_id: productId,
          p_merek: merek || null,
          p_lini_produk: lini_produk || null,
        });

        if (error) throw error;
        const filtered = (data || [])
          .filter((p) => p.id !== productId)
          .slice(0, limit);
        setProducts(filtered);
      } catch (err) {
        console.error("Gagal memuat produk terkait:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchRelated();
    }
  }, [productId, merek, lini_produk, limit]);

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Produk Terkait</h2>
        <p className="text-slate-500">Memuat produk...</p>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Anda Mungkin Juga Suka</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
