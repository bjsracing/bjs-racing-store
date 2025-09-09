// File: src/components/SsrTest.jsx
// Tujuan: Komponen ini HANYA untuk menguji apakah impor dari supabaseClient.js
// menyebabkan server crash.

import React from "react";

// Baris ini adalah satu-satunya hal yang kita tes.
// Jika Vercel crash saat mencoba mengimpor ini, kita tahu inilah sumber masalahnya.
import { getSupabaseBrowserClient } from "../lib/supabaseClient.js";

const SsrTest = () => {
  console.log("[DEBUG SsrTest] Komponen ini berhasil dirender di browser.");

  // Kita tidak perlu melakukan apa-apa, hanya fakta bahwa ia berhasil dimuat sudah cukup.
  return (
    <div
      style={{
        padding: "20px",
        border: "2px dashed green",
        margin: "20px auto",
        maxWidth: "600px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        Tes Isolasi Berhasil
      </h1>
      <p>
        Jika Anda bisa melihat kotak ini, berarti file{" "}
        <strong>supabaseClient.js</strong> aman untuk diimpor.
      </p>
    </div>
  );
};

export default SsrTest;
