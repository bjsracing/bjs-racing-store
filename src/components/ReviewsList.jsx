// src/components/ReviewsList.jsx
import React, { useEffect, useState } from "react";

const ReviewsList = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/reviews?product_id=${productId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data || []);
        }
      } catch (err) {
        console.error("Gagal memuat ulasan:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Memuat ulasan...</p>;
  }

  if (!reviews.length) {
    return <p className="text-sm text-slate-500">Belum ada ulasan untuk produk ini.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, idx) => (
        <div key={idx} className="border-b pb-3 last:border-b-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {review.customers?.nama_pelanggan || "Customer"}
            </span>
            <span className="text-orange-500 text-sm">
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-slate-600 mt-1">{review.comment}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {new Date(review.created_at).toLocaleDateString("id-ID", {
              dateStyle: "medium",
            })}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;
