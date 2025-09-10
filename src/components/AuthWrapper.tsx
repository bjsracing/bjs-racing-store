// File: src/components/AuthWrapper.tsx (File Baru)
// Ini adalah "pulau" React yang berisi Provider dan komponen-komponen yang membutuhkannya.

import React from "react";
import { AuthProvider } from "../lib/authContext"; // Sesuaikan path jika perlu
import AuthMenu from "./AuthMenu"; // Impor komponen menu Anda

export default function AuthWrapper() {
  return (
    // AuthProvider membungkus komponen React di sini
    <AuthProvider>
      <AuthMenu />
    </AuthProvider>
  );
}
