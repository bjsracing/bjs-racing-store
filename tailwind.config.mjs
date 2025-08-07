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
      // --- TAMBAHKAN BLOK BARU DI SINI ---
      fontSize: {
        '2xs': '0.625rem', // Ini setara dengan 10px
      },
    },
  },
  plugins: [],
}