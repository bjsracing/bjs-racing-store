// src/components/FlashSaleSection.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseBrowserClient.ts";
import { FiZap, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const LIMIT = 6;

const getTimeRemaining = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  return {
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const pad = (n) => String(n).padStart(2, "0");

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);

const SkeletonCard = () => (
  <div className="flex-none w-40 mobile:w-44 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
    <div className="aspect-square bg-slate-200 animate-pulse" />
    <div className="p-2.5 space-y-1.5">
      <div className="h-3 bg-slate-200 animate-pulse rounded w-full" />
      <div className="h-3 bg-slate-200 animate-pulse rounded w-2/3" />
      <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2" />
    </div>
  </div>
);

const FlashSaleSection = () => {
  const [time, setTime] = useState(getTimeRemaining);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gt("stok", 0)
        .order("harga_jual", { ascending: true })
        .limit(LIMIT);

      if (error) {
        console.error("Error fetching flash sale products:", error);
        setProducts([]);
      } else {
        const discounted = (data || []).filter(
          (p) => p.harga_coret && p.harga_coret > p.harga_jual,
        );
        setProducts(discounted.length > 0 ? discounted : data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 5);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, loading]);

  const scroll = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 180;
    el.scrollBy({
      left: direction === "prev" ? -amount : amount,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  return (
    <section className="bg-gradient-to-r from-orange-500 via-orange-400 to-red-400 py-10 mobile:py-14 tablet:py-16 overflow-hidden">
      <div className="container mx-auto px-3 mobile:px-4 tablet:px-6">
        {/* Header */}
        <div className="flex flex-col mobile:flex-row items-center justify-between gap-4 mb-8 mobile:mb-10">
          <div className="flex items-center gap-3">
            <FiZap className="w-6 h-6 mobile:w-7 mobile:h-7 text-yellow-300" fill="currentColor" />
            <h2 className="text-xl mobile:text-2xl tablet:text-3xl font-bold text-white">
              Flash Sale
            </h2>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs mobile:text-sm font-bold px-3 py-1 rounded-full animate-[fadeOutIn_3s_ease-in-out_infinite]">
              HARI INI SAJA
            </span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            {["hours", "minutes", "seconds"].map((unit, i) => (
              <React.Fragment key={unit}>
                <div className="bg-white rounded-lg px-3 py-2 mobile:px-4 mobile:py-2.5 shadow-lg">
                  <span className="text-xl mobile:text-2xl font-bold text-orange-600 tabular-nums">
                    {pad(time[unit])}
                  </span>
                </div>
                {i < 2 && (
                  <span className="text-white text-xl mobile:text-2xl font-bold animate-pulse">
                    :
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="relative">
          {/* Arrow Prev */}
          <button
            onClick={() => scroll("prev")}
            disabled={!canScrollPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 mobile:w-10 mobile:h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${
              canScrollPrev
                ? "hover:bg-white text-slate-700"
                : "opacity-0 pointer-events-none"
            }`}
            aria-label="Sebelumnya"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>

          {/* Arrow Next */}
          <button
            onClick={() => scroll("next")}
            disabled={!canScrollNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 mobile:w-10 mobile:h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${
              canScrollNext
                ? "hover:bg-white text-slate-700"
                : "opacity-0 pointer-events-none"
            }`}
            aria-label="Berikutnya"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loading
              ? Array.from({ length: LIMIT }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : products.map((product) => {
                  const hasDiscount =
                    product.harga_coret && product.harga_coret > product.harga_jual;
                  const discountPct = hasDiscount
                    ? Math.round(
                        ((product.harga_coret - product.harga_jual) /
                          product.harga_coret) *
                          100,
                      )
                    : 0;

                  return (
                    <a
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex-none w-40 mobile:w-44 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <div className="relative aspect-square bg-white">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.nama}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}
                        {hasDiscount && (
                          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            -{discountPct}%
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-xs mobile:text-sm font-semibold text-slate-800 line-clamp-2 mb-1">
                          {product.nama}
                        </h3>
                        {hasDiscount && (
                          <p className="text-[10px] text-slate-400 line-through">
                            {formatRupiah(product.harga_coret)}
                          </p>
                        )}
                        <p className="text-sm mobile:text-base font-bold text-orange-500">
                          {formatRupiah(product.harga_jual)}
                        </p>
                      </div>
                    </a>
                  );
                })}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeOutIn {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </section>
  );
};

export default FlashSaleSection;
