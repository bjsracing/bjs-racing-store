// File: src/components/MobileMenu.tsx (Diperbaiki)
import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import AuthMenu from './AuthMenu'; // Kita akan tambahkan AuthMenu di sini

// Definisikan tipe untuk props
interface NavLink {
  name: string;
  path: string;
}

interface Props {
  navLinks: NavLink[];
}

export default function MobileMenu({ navLinks }: Props) {
  // Ambil state dan fungsi dari store
  const { isMobileMenuOpen, closeMobileMenu } = useAppStore();

  // Efek untuk mengunci scroll body (logika ini sudah benar)
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Jika menu tidak terbuka, jangan render apapun
  if (!isMobileMenuOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-40 pt-24 px-6 flex flex-col md:hidden">
      <nav className="flex flex-col space-y-6">
        {/* Gunakan navLinks dari props */}
        {navLinks.map((link) => (
          <a
            key={link.path}
            href={link.path}
            onClick={closeMobileMenu} // Tutup menu saat link di-klik
            className="text-2xl font-semibold text-slate-700 hover:text-orange-500"
          >
            {link.name}
          </a>
        ))}
      </nav>
      {/* Tambahkan menu otentikasi agar konsisten dengan desain sebelumnya */}
      <div className="mt-auto mb-8 border-t border-slate-200 pt-6">
        <AuthMenu />
      </div>
    </div>
  );
}