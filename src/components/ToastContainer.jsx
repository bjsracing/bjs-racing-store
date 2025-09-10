// src/components/ToastContainer.jsx

import React from "react";
import { useAppStore } from "../lib/store.ts";
import ToastNotification from "./ToastNotification.jsx";

const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  // Don't render anything if there are no toasts
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full duration-300"
        >
          <ToastNotification
            toast={toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;