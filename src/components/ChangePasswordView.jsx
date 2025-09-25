// src/components/ChangePasswordView.jsx
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseBrowserClient.ts";
import { useAppStore } from "@/lib/store";

export default function ChangePasswordView() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useAppStore((state) => state.addToast);
  const signOut = useAppStore((state) => state.signOut);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi 1: Cek apakah password cocok
    if (newPassword !== confirmPassword) {
      addToast({
        type: "error",
        message: "Password baru dan konfirmasi tidak cocok.",
      });
      return;
    }
    // Validasi 2: Cek panjang password
    if (newPassword.length < 6) {
      addToast({
        type: "error",
        message: "Password baru harus terdiri dari minimal 6 karakter.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      addToast({
        type: "success",
        message: "Password berhasil diubah. Anda akan segera logout.",
      });

      // Praktik keamanan terbaik: Logout pengguna setelah ganti password
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (error) {
      addToast({
        type: "error",
        message: `Gagal mengubah password: ${error.message}`,
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="new_password"
            className="block text-sm font-medium text-gray-700"
          >
            Password Baru
          </label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-gray-700"
          >
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="text-right">
          <button
            type="submit"
            disabled={isSaving || !newPassword}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isSaving ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
