// File: src/components/HeaderActions.tsx (File Baru)
import React from "react";
import { AuthProvider } from "../lib/authContext"; // Pastikan path ini benar
import AuthMenu from "./AuthMenu";
import CartIcon from "./CartIcon";

export default function HeaderActions() {
  return (
    <AuthProvider>
      <div className="flex items-center gap-4 mobile:gap-5 tablet:gap-6">
        <CartIcon />
        <AuthMenu />
      </div>
    </AuthProvider>
  );
}
