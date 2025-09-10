// File: src/components/MobileNav.tsx (Diperbaiki)
import React from "react";
import { AuthProvider } from "../lib/authContext";
import MobileMenu from "./MobileMenu";
import MobileMenuButton from "./MobileMenuButton";
import type { Session } from "@supabase/supabase-js"; // Impor tipe Session

// Definisikan tipe untuk props dari Astro
interface NavLink {
  name: string;
  path: string;
}

interface Props {
  navLinks: NavLink[];
  initialSession: Session | null; // Tambahkan initialSession di sini
}

export default function MobileNav({ navLinks, initialSession }: Props) {
  return (
    // Teruskan 'initialSession' ke AuthProvider di sini juga
    <AuthProvider initialSession={initialSession}>
      <MobileMenuButton />
      <MobileMenu navLinks={navLinks} />
    </AuthProvider>
  );
}
