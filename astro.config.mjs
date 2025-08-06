// astro.config.mjs (Versi Final untuk Deployment Vercel)

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({
    // Menambahkan konfigurasi ini akan meningkatkan performa gambar
    imageService: true,
    imagesConfig: {
      domains: ["ykotzsmncvyfveypeevb.supabase.co"], // Pastikan ini domain Supabase Anda
      sizes: [300, 600, 1080],
    },
  }),
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
  }
});