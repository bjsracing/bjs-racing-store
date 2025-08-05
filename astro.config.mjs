// astro.config.mjs (Versi Final yang Benar)

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless"; // Menggunakan /serverless untuk Vercel

// https://astro.build/config
export default defineConfig({
  output: "server", // <-- TAMBAHKAN BARIS INI
  integrations: [
    tailwind(),
    react(),
  ],

  vite: {
    server: {
      allowedHosts: [
        '.replit.dev'
      ]
    }
  },

  adapter: vercel()
});