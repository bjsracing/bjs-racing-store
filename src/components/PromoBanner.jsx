// src/components/PromoBanner.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Promo Spesial Racing Gear",
    subtitle: "Diskon hingga 30% untuk helm dan jaket racing",
    cta_text: "Belanja Sekarang",
    cta_href: "/katalog-warna",
    bg_gradient: "from-slate-900 via-slate-800 to-slate-900",
    image_url: null,
  },
  {
    id: "fallback-2",
    title: "Ongkir Gratis Area Lokal",
    subtitle: "Gratis ongkir untuk area internal BJS Racing",
    cta_text: "Lihat Syarat",
    cta_href: "/",
    bg_gradient: "from-orange-600 via-orange-500 to-orange-600",
    image_url: null,
  },
  {
    id: "fallback-3",
    title: "New Arrival: Lift Kit & Onderdil",
    subtitle: "Perangkat underbone terbaru sudah tersedia",
    cta_text: "Lihat Katalog",
    cta_href: "/onderdil",
    bg_gradient: "from-blue-700 via-blue-600 to-blue-700",
    image_url: null,
  },
];

const SLIDE_DURATION = 5000;

const RacingPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="racing-grid"
        x="0"
        y="0"
        width="60"
        height="60"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 30 L30 0 L60 30 L30 60 Z"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#racing-grid)" />
  </svg>
);

const PromoBanner = ({ slides: dbSlides = [] }) => {
  const slides = dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES;
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (next) => {
      setIndex((prev) => {
        const nextIndex = typeof next === "number" ? next : (prev + 1) % slides.length;
        return nextIndex;
      });
      setProgressKey((k) => k + 1);
    },
    [slides.length],
  );

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearInterval(timerRef.current);
  }, [isPaused, progressKey, slides.length]);

  const current = slides[index];
  const total = slides.length;

  return (
    <section
      className="relative w-full h-64 md:h-96 text-white overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-label="Promo banner carousel"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-gradient-to-r ${slide.bg_gradient || "from-slate-900 via-slate-800 to-slate-900"} transition-all duration-500 ease-in-out ${
              idx === index
                ? "opacity-100 translate-x-0"
                : idx < index
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
            }`}
          >
            {/* Background Image */}
            {slide.image_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              />
            )}
            <RacingPattern />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-14 sm:px-20 md:px-24 h-full flex items-center">
        <div
          key={index}
          className="max-w-xl animate-[fadeInUp_0.5s_ease-out]"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg">
            {current.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 md:mb-6 drop-shadow">
            {current.subtitle}
          </p>
          <a
            href={current.cta_href || "/"}
            className="inline-block bg-white text-slate-900 font-semibold px-5 py-2.5 md:px-6 md:py-3 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer shadow-lg"
          >
            {current.cta_text || "Selengkapnya"}
          </a>
        </div>
      </div>

      {/* Arrow Navigation */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Slide sebelumnya"
          >
            <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Slide berikutnya"
          >
            <FiChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </>
      )}

      {/* Bottom Bar: Progress + Numbered Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/20">
            <div
              key={progressKey}
              className="h-full bg-orange-500"
              style={{
                animation: `progressFill ${SLIDE_DURATION}ms linear forwards`,
              }}
            />
          </div>

          {/* Numbered Indicator */}
          <div className="bg-black/30 backdrop-blur-sm px-4 sm:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => goTo(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === index
                      ? "bg-orange-500 w-6"
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                  aria-current={idx === index ? "true" : undefined}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-white/90 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default PromoBanner;
