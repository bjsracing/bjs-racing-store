// src/components/ChangePasswordView.jsx
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseBrowserClient.ts";
import { useAppStore } from "@/lib/store";
// 1. Impor ikon mata
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function ChangePasswordView() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 2. State baru untuk melacak visibilitas password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const addToast = useAppStore((state) => state.addToast);
  const signOut = useAppStore((state) => state.signOut);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addToast({
        type: "error",
        message: "Password baru dan konfirmasi tidak cocok.",
      });
      return;
    }
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
      if (error) throw new Error(error.message);

      addToast({
        type: "success",
        message: "Password berhasil diubah. Anda akan segera logout.",
      });

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
        {/* --- 3. Perbaikan Kolom Password Baru --- */}
        <div>
          <label
            htmlFor="new_password"
            className="block text-sm font-medium text-gray-700"
          >
            Password Baru
          </label>
          <div className="relative mt-1">
            <input
              type={showNewPassword ? "text" : "password"}
              id="new_password"
              name="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* --- 4. Perbaikan Kolom Konfirmasi Password Baru --- */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-gray-700"
          >
            Konfirmasi Password Baru
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm_password"
              name="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
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
