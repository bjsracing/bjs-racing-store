// src/components/ColorScanner.jsx (Final dengan Pipet Warna Manual yang Stabil)

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient.ts";
import { FiUpload, FiRefreshCw } from "react-icons/fi";

const ColorScanner = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [pickedColor, setPickedColor] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const loupeRef = useRef(null); // Ref untuk "kaca pembesar"

  // Gambar ulang gambar ke canvas saat imageSrc berubah
  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        // Atur ukuran canvas agar sesuai dengan kontainernya, sambil menjaga rasio aspek gambar
        const maxWidth = canvas.parentElement.clientWidth;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [imageSrc]);

  const rgbToHex = (r, g, b) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Hitung posisi kursor relatif terhadap canvas yang ditampilkan
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Hitung rasio skala antara ukuran asli gambar dan ukuran canvas yang ditampilkan
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // Dapatkan koordinat piksel yang sebenarnya
    return { x: x * scaleX, y: y * scaleY };
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !loupeRef.current) return;
    const { x, y } = getCanvasCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    const loupe = loupeRef.current;

    loupe.style.left = `${e.clientX}px`;
    loupe.style.top = `${e.clientY}px`;
    loupe.style.display = "block";

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    loupe.style.backgroundColor = hex;
  };

  const handleMouseLeave = () => {
    if (loupeRef.current) loupeRef.current.style.display = "none";
  };

  const handleCanvasClick = (event) => {
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoordinates(event);
    const ctx = canvasRef.current.getContext("2d");
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);

    setPickedColor(hexColor);
    findMatchingColors(hexColor);
  };

  const findMatchingColors = async (hexColor) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_closest_colors", {
        input_hex: hexColor,
      });
      if (error) throw error;
      setRecommendedProducts(data || []);
    } catch (error) {
      console.error("Gagal mencari warna:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setPickedColor(null);
        setRecommendedProducts([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetScanner = () => {
    setImageSrc(null);
    setPickedColor(null);
    setRecommendedProducts([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">
        Pindai Warna dari Gambar
      </h2>
      <p className="text-center text-slate-500 mb-6">
        Unggah gambar, lalu gerakkan kursor di atasnya untuk memilih warna.
      </p>

      {/* Kaca Pembesar (Pipet) */}
      <div
        ref={loupeRef}
        style={{
          display: "none",
          position: "fixed",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "4px solid white",
          boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
        }}
      ></div>

      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        {!imageSrc ? (
          <div className="flex flex-col items-center">
            <FiUpload className="text-4xl text-slate-400 mb-2" />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="max-w-full mx-auto rounded-md cursor-crosshair"
          />
        )}
      </div>

      {loading && (
        <p className="text-center mt-4 animate-pulse">Mencari rekomendasi...</p>
      )}

      {recommendedProducts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-center text-lg">
            Warna yang Paling Cocok:
          </h3>
          <div className="flex items-center justify-center gap-4 mt-2 mb-4 p-2 bg-slate-100 rounded-lg">
            <div
              style={{ backgroundColor: pickedColor }}
              className="w-10 h-10 rounded-full border-2 shadow-inner"
            ></div>
            <p className="font-mono text-base">Warna Pilihan: {pickedColor}</p>
          </div>
          <div className="space-y-3">
            {recommendedProducts.map((product) => (
              <a
                href={`/products/${product.id}`}
                key={product.id}
                className="flex items-center gap-4 p-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div
                  style={{ backgroundColor: product.color_hex }}
                  className="w-12 h-12 rounded-full border flex-shrink-0"
                ></div>
                <div className="flex-grow">
                  <p className="font-semibold">{product.nama}</p>
                  <p className="text-sm text-slate-500">
                    {product.merek} - {product.sku}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    {Math.max(0, 100 - product.distance).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-400">Kecocokan</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      {imageSrc && (
        <div className="mt-6 text-center">
          <button
            onClick={resetScanner}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-slate-500 hover:text-slate-800"
          >
            <FiRefreshCw /> Pindai Gambar Lain
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorScanner;
