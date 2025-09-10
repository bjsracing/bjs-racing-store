// File: src/components/HeaderActions.tsx (Diperbaiki)
import React from "react";
import { AuthProvider } from "../lib/authContext";
import AuthMenu from "./AuthMenu";
import CartIcon from "./CartIcon";
import type { Session } from "@supabase/supabase-js"; // Impor tipe Session

// Definisikan tipe untuk props yang diterima dari Astro
interface Props {
  initialSession: Session | null;
}

export default function HeaderActions({ initialSession }: Props) {
  return (
    // 'initialSession' dari server sekarang disuntikkan ke dalam AuthProvider
    <AuthProvider initialSession={initialSession}>
      <div className="flex items-center gap-4 mobile:gap-5 tablet:gap-6">
        <CartIcon />
        <AuthMenu />
      </div>
    </AuthProvider>
  );
}
