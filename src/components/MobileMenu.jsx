// File: src/components/MobileMenu.jsx
// Perbaikan: Menyesuaikan path impor store agar menunjuk ke file .ts yang benar.

import React, { useEffect } from "react";
// PERBAIKAN UTAMA: Mengubah impor agar menggunakan store.ts melalui alias path.
import { useAppStore } from "@/lib/store.ts";
import id from "../../public/locales/id/common.json";

const MobileMenu = () => {
    const { isMobileMenuOpen, closeMobileMenu } = useAppStore();

    // Menangani scroll lock saat menu terbuka (logika ini sudah benar)
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        // Fungsi cleanup untuk memastikan scroll kembali normal
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { name: id.nav.home, path: "/" },
        { name: "Produk Pilok", path: "/pilok" },
        { name: "Katalog Pilok", path: "/katalog-warna" },
        { name: "Garasi Virtual", path: "/simulator" },
        { name: "Scan Warna", path: "/scan-warna" },
        { name: id.nav.federal_part, path: "/federal-part" },
    ];

    if (!isMobileMenuOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 text-white z-50 p-4 flex flex-col md:hidden">
            <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-lg text-orange-400">MENU</span>
                <button onClick={closeMobileMenu}>
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
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <nav>
                <ul className="space-y-4">
                    {navLinks.map((link) => (
                        <li key={link.path}>
                            <a
                                href={link.path}
                                onClick={closeMobileMenu}
                                className="text-xl font-semibold hover:text-orange-400"
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default MobileMenu;
