// tailwind.config.mjs
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        // Atur 'Inter' sebagai font utama
        sans: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
}