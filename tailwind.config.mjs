// tailwind.config.mjs
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      fontSize: {
        '2xs': '0.625rem', // Ini setara dengan 10px
      },
      // --- TAMBAHKAN KONFIGURASI BARU DI BAWAH INI ---
      screens: {
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
      },
      // Optional: Extend spacing untuk consistency yang lebih baik
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}