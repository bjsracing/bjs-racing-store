// File: src/components/ImageUploader.jsx
// Perbaikan: Menyesuaikan cara impor dan penggunaan Supabase client agar aman untuk SSR.

import React, { useState, useRef } from "react";
// PERBAIKAN 1: Impor FUNGSI getSupabaseBrowserClient, bukan konstanta supabase
import { getSupabaseBrowserClient } from "../lib/supabaseClient.js";
import imageCompression from "browser-image-compression";
import { FiUpload } from "react-icons/fi";

const ImageUploader = ({ productId, onUploadComplete }) => {
  // PERBAIKAN 2: Panggil fungsi untuk mendapatkan instance client Supabase yang aman
  const supabase = getSupabaseBrowserClient();

  const [mainImage, setMainImage] = useState(null);
  const [swatchImage, setSwatchImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [swatchImagePreview, setSwatchImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === "main") {
      setMainImage(file);
      setMainImagePreview(previewUrl);
    } else {
      setSwatchImage(file);
      setSwatchImagePreview(previewUrl);
    }
  };

  const handleUpload = async () => {
    if (!mainImage && !swatchImage) {
      alert("Silakan pilih setidaknya satu gambar untuk diupload.");
      return;
    }
    setIsUploading(true);

    try {
      const updateData = {};
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const BUCKET_NAME = "produk-pilok";

      const uploadFile = async (file, path) => {
        const compressedFile = await imageCompression(file, compressionOptions);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, compressedFile, { upsert: true });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        return publicUrl;
      };

      if (mainImage) {
        const mainImagePath = `public/${productId}-main.jpg`;
        updateData.image_url = await uploadFile(mainImage, mainImagePath);
      }
      if (swatchImage) {
        const swatchImagePath = `public/${productId}-swatch.png`;
        updateData.color_swatch_url = await uploadFile(
          swatchImage,
          swatchImagePath,
        );
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", productId);
        if (updateError) throw updateError;
      }

      alert(
        "Gambar berhasil diupload dan disimpan! Halaman akan dimuat ulang.",
      );
      window.location.reload();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        `Gagal mengupload gambar: ${error?.message || JSON.stringify(error)}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 border-t-4 border-orange-400 p-4 rounded-b-lg shadow-md mt-8">
      <h3 className="font-bold text-lg text-slate-800 mb-4">
        Panel Admin: Upload Gambar
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Gambar Utama (Kaleng)
          </label>
          <div className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center bg-white">
            {mainImagePreview ? (
              <img
                src={mainImagePreview}
                alt="Preview Gambar Utama"
                className="max-h-full max-w-full"
              />
            ) : (
              <span className="text-slate-400">Pilih gambar...</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => handleFileChange(e, "main")}
            className="text-sm mt-2"
          />
        </div>
        <div className="text-center">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Gambar Warna (Lingkaran)
          </label>
          <div className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center bg-white">
            {swatchImagePreview ? (
              <img
                src={swatchImagePreview}
                alt="Preview Warna"
                className="max-h-full max-w-full"
              />
            ) : (
              <span className="text-slate-400">Pilih gambar...</span>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/webp"
            onChange={(e) => handleFileChange(e, "swatch")}
            className="text-sm mt-2"
          />
        </div>
      </div>
      <div className="mt-4 text-right">
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-400"
        >
          {isUploading ? "Mengunggah..." : "Upload & Simpan Gambar"}
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;
