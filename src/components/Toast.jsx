// src/components/Toast.jsx
import React, { useEffect } from "react";
import { useAppStore } from "@/lib/store";

// Ikon untuk setiap tipe notifikasi
const icons = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const Toast = ({ toast }) => {
  const removeToast = useAppStore((state) => state.removeToast);
  const duration = toast.duration || 5000; // Default 5 detik

  // Efek untuk menghapus notifikasi secara otomatis setelah durasi tertentu
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, duration, removeToast]);

  return (
    <div
      className="flex items-center gap-4 bg-slate-800 text-white p-4 rounded-lg shadow-lg animate-fade-in-up"
      role="alert"
    >
      <span className="text-2xl">{icons[toast.type]}</span>
      <div className="flex-grow">
        <p className="font-bold text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-white"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
