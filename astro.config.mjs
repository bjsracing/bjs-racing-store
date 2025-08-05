// astro.config.mjs (Versi Final yang Benar)

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: "server",
  integrations: [
    tailwind(),
    react(),
  ],
  vite: {
    server: {
      allowedHosts: ['.replit.dev']
    }
  },
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      // Tempel domain Anda di sini, di dalam tanda kutip
      domains: ["ykotzsmncvyfveypeevb.supabase.co"],
      sizes: [300, 600, 1080],
    },
  })
});