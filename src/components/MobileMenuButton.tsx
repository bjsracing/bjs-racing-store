// File: src/components/MobileMenuButton.tsx (Diperbaiki)
import React from "react";
import { useAppStore } from "@/lib/store"; // Menggunakan store global

export default function MobileMenuButton() {
    // Ambil state dan fungsi untuk toggle menu dari store
    const { isMobileMenuOpen, toggleMobileMenu } = useAppStore();

    // Pastikan Anda memiliki fungsi 'toggleMobileMenu' di store.ts Anda.
    // Jika belum ada, Anda bisa menggunakan openMobileMenu() atau yang sejenis.

    return (
        <button
            onClick={toggleMobileMenu} // Panggil fungsi dari store saat diklik
            className="z-50 relative p-2"
            aria-label="Toggle menu"
        >
            {/* Ikon hamburger/close yang berubah berdasarkan state dari store */}
            <div
                className="w-6 h-1 bg-slate-800 mb-1 transition-transform duration-300"
                style={{
                    transform: isMobileMenuOpen
                        ? "rotate(45deg) translate(5px, 5px)"
                        : "none",
                }}
            ></div>
            <div
                className="w-6 h-1 bg-slate-800 transition-opacity duration-300"
                style={{ opacity: isMobileMenuOpen ? 0 : 1 }}
            ></div>
            <div
                className="w-6 h-1 bg-slate-800 mt-1 transition-transform duration-300"
                style={{
                    transform: isMobileMenuOpen
                        ? "rotate(-45deg) translate(5px, -5px)"
                        : "none",
                }}
            ></div>
        </button>
    );
}
