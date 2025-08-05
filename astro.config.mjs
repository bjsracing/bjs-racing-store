// astro.config.mjs

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/static"; // <-- Ganti ke /static

export default defineConfig({
  // output: "server", // <-- Hapus atau jadikan komentar baris ini
  integrations: [
    tailwind(),
    react(),
  ],
  vite: {
    server: {
      allowedHosts: ['.replit.dev']
    }
  },
  adapter: vercel() // Adapter Vercel untuk static
});