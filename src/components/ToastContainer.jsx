// src/components/ToastContainer.jsx
import React from "react";
import { useAppStore } from "@/lib/store";
import Toast from "./Toast";

const ToastContainer = () => {
  const toasts = useAppStore((state) => state.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
