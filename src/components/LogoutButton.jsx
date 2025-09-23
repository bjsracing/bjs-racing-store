// File: /src/components/LogoutButton.jsx
import React from "react";
import { useAppStore } from "@/lib/store";

export default function LogoutButton() {
  const signOut = useAppStore((state) => state.signOut);

  return (
    <button
      onClick={signOut}
      className="w-full text-left hover:bg-gray-100 p-3 rounded-lg"
    >
      Keluar
    </button>
  );
}
