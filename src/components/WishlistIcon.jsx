// File: src/components/WishlistIcon.jsx
// Ikon wishlist di navbar dengan badge count

import React, { useState, useEffect } from "react";

const WishlistIcon = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) return;
        const data = await res.json();
        setCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
  }, []);

  return (
    <a
      href="/akun/wishlist"
      className="relative text-slate-800 hover:text-red-500 transition-colors"
      aria-label={`Wishlist${count > 0 ? ` (${count} item)` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
};

export default WishlistIcon;
