// src/components/PromoBanner.jsx
import React, { useState, useEffect } from "react";

const SLIDES = [
  {
    id: 1,
    title: "Promo Spesial Racing Gear",
    subtitle: "Diskon hingga 30% untuk helm dan jaket racing",
    cta: "Belanja Sekarang",
    href: "/katalog-warna",
    bg: "from-slate-900 via-slate-800 to-slate-900",
  },
  {
    id: 2,
    title: "Ongkir Gratis Area Lokal",
    subtitle: "Gratis ongkir untuk area internal BJS Racing",
    cta: "Lihat Syarat",
    href: "/",
    bg: "from-orange-600 via-orange-500 to-orange-600",
  },
  {
    id: 3,
    title: "New Arrival: Lift Kit & Onderdil",
    subtitle: "Perangkat underbone terbaru sudah tersedia",
    cta: "Lihat Katalog",
    href: "/onderdil",
    bg: "from-blue-700 via-blue-600 to-blue-700",
  },
];

const PromoBanner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = SLIDES[index];

  return (
    <section className={`relative w-full h-64 md:h-96 bg-gradient-to-r ${current.bg} text-white overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-center">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-2">{current.title}</h2>
          <p className="text-base md:text-lg text-white/90 mb-4">{current.subtitle}</p>
          <a
            href={current.href}
            className="inline-block bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-100"
          >
            {current.cta}
          </a>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === index ? "bg-white" : "bg-white/50"}`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default PromoBanner;
