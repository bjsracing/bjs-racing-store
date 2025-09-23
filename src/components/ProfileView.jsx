// File: /src/components/ProfileView.jsx
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function ProfileView() {
  const [profile, setProfile] = useState({ nama_pelanggan: "", telepon: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useAppStore((state) => state.addToast);

  // 1. Ambil data profil saat komponen dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Gagal memuat profil.");
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        addToast({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [addToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Kirim data yang diperbarui saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menyimpan profil.");
      }
      addToast({ type: "success", message: "Profil berhasil diperbarui!" });
    } catch (error) {
      addToast({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center p-10">Memuat profil...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nama_pelanggan"
            className="block text-sm font-medium text-gray-700"
          >
            Nama Lengkap
          </label>
          <input
            type="text"
            id="nama_pelanggan"
            name="nama_pelanggan"
            value={profile.nama_pelanggan}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label
            htmlFor="telepon"
            className="block text-sm font-medium text-gray-700"
          >
            Nomor Telepon
          </label>
          <input
            type="tel"
            id="telepon"
            name="telepon"
            value={profile.telepon}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="text-right">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
