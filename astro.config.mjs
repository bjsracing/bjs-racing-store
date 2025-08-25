// astro.config.mjs (Versi Final untuk Deployment Vercel)

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";
import pwa from "@vite-pwa/astro";

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
    pwa({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg', '/logo/logo-bjsracingstore.png'],
      manifest: {
        name: 'BJS RACING STORE',
        short_name: 'BJS Racing',
        theme_color: '#FF7800',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: '/logo/logo-bjsracingstore.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo/logo-bjsracingstore.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo/logo-bjsracingstore.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
      workbox: {
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,txt,woff2}',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'all-pages-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  vite: {
    server: {
      allowedHosts: [
        '.replit.dev'
      ]
    }
  }
});