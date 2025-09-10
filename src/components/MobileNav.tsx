// File: src/components/MobileNav.tsx (Diperbaiki)
import React from "react";
import { AuthProvider } from "../lib/authContext";
import MobileMenu from "./MobileMenu";
import MobileMenuButton from "./MobileMenuButton";

// Definisikan tipe untuk props dari Astro
interface NavLink {
  name: string;
  path: string;
}

interface Props {
  navLinks: NavLink[];
}

export default function MobileNav({ navLinks }: Props) {
  return (
    // AuthProvider dibutuhkan oleh AuthMenu di dalam MobileMenu
    <AuthProvider>
      <MobileMenuButton />
      <MobileMenu navLinks={navLinks} />
    </AuthProvider>
  );
}
