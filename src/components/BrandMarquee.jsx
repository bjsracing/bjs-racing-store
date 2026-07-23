// src/components/BrandMarquee.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";

const BRANDS = [
  { name: "Yoshimura", id: "yoshimura" },
  { name: "AP Racing", id: "ap-racing" },
  { name: "Brembo", id: "brembo" },
  { name: "Federal Part", id: "federal-part" },
  { name: "KTC", id: "ktc" },
  { name: "Kawahara", id: "kawahara" },
  { name: "MTRT", id: "mtrt" },
  { name: "RCB", id: "rcb" },
  { name: "Ohlins", id: "ohlins" },
  { name: "Showa", id: "showa" },
];

const DURATION = 30;

const BrandLogo = ({ brand }) => (
  <div className="flex-none px-6 mobile:px-8 flex items-center justify-center select-none">
    <span className="text-lg mobile:text-xl tablet:text-2xl font-bold text-slate-400 hover:text-orange-500 transition-colors duration-200 whitespace-nowrap tracking-tight">
      {brand.name}
    </span>
  </div>
);

const BrandMarquee = () => {
  const [isPaused, setIsPaused] = useState(false);
  const prefersReduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
    const handler = (e) => {
      prefersReduced.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!prefersReduced.current) setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  const items = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section
      className="bg-white border-y border-slate-100 py-6 mobile:py-8 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      role="region"
      aria-label="Brand partner logos"
    >
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 mobile:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 mobile:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div
          className="flex items-center"
          style={{
            animation: prefersReduced.current
              ? "none"
              : `marquee ${DURATION}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          {items.map((brand, idx) => (
            <BrandLogo key={`${brand.id}-${idx}`} brand={brand} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default BrandMarquee;
