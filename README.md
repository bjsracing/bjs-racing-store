# BJS Racing Store

Toko online PWA untuk distributor **Spray Paint (Pilok)** dan **Onderdil/Aksesoris Motor**. Dibangun dengan **Astro + React + Supabase**, deploy di **Vercel**, pembayaran via **Midtrans** (+ BRI QRIS), ongkos kirim via **Biteship** & **RajaOngkir**.

## Tech Stack
- **Astro 7** (SSR, Rust HTML compiler, adapter Vercel serverless v11)
- **React 19** (komponen interaktif via `@astrojs/react` v6)
- **Tailwind CSS 3** (via PostCSS, `postcss.config.cjs`)
- **Supabase** (Auth + Postgres + Storage)
- **Midtrans Snap** + **BRI QRIS** (pembayaran)
- **Biteship** + **RajaOngkir** (ongkos kirim)
- **vite-plugin-pwa 1.3** (installable PWA dengan notifikasi pembaruan)
- **Leaflet** + **OSRM** (peta & rute pengiriman)

## Struktur Direktori
```
src/
├── components/      # Komponen Astro & React (UI toko, akun, checkout, voucher)
├── layouts/         # MainLayout.astro, AdminLayout.astro
├── lib/             # supabaseBrowserClient, supabaseServer, biteship, osrm, store (zustand)
├── middleware.js    # Guard rute terproteksi & cek profil lengkap
├── pages/           # Rute & API endpoints (src/pages/api/*)
├── stores/          # nanostores reactive atoms
├── styles/          # global.css (Tailwind directives)
public/              # Aset statis, ikon PWA, locales
File SUPABASE/       # Dokumentasi skema, views, functions, triggers
File CATATAN/        # Catatan roadmap & instruksi fitur
```

## Environment Variables
Salin `.env.example` menjadi `.env` (jangan commit `.env`):
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `MIDTRANS_SERVER_KEY`, `PUBLIC_MIDTRANS_CLIENT_KEY`
- `RAJAONGKIR_API_KEY`, `RAJAONGKIR_ORIGIN_ID`
- `BITESHIP_API_KEY`, `BITESHIP_ORIGIN_*`
- `BRI_*` keys, `PAYMENT_GATEWAY`

## Commands
```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # build produksi ke ./dist
npm run preview   # preview hasil build
```

## Alur Pembelian
1. Katalog produk (Pilok / Onderdil) → detail produk dinamis → tambah ke keranjang.
2. Checkout: pilih alamat, hitung ongkir (Biteship / RajaOngkir / kurir internal), terapkan voucher.
3. `POST /api/payment/create-transaction` membuat order + minta Snap Token Midtrans.
4. Pelanggan bayar via popup Midtrans → `POST /api/payment/webhook` memverifikasi signature, mengurangi stok, dan mencatat ke tabel `transactions` (sinkron ke sistem POS).

## Catatan Teknis
- **Cookie override**: Astro 7 membutuhkan `cookie@2.x` (ESM), sedangkan `@supabase/ssr` membutuhkan `cookie@1.x` (CJS). Ditangani via selective overrides di `package.json`.
- **Tailwind CSS**: Diproses oleh PostCSS via `postcss.config.cjs`. File `src/styles/global.css` berisi `@tailwind` directives dan diimport ke `MainLayout.astro`.
- **PWA**: VitePWA dikonfigurasi dengan `registerType: 'prompt'` (user konfirmasi update). Service worker manual dihapus; gunakan `useRegisterSW` dari VitePWA.
- **Dokumentasi skema DB** ada di `File SUPABASE/` (konteks; tidak selalu lengkap/terbaru).
- **Rute terproteksi** (`/cart`, `/checkout`, `/akun`) dijaga oleh `src/middleware.js`.
- **Path aliases**: `@/*` → `src/*`, `@/lib/*`, `@/components/*`, `@/layouts/*` (di `tsconfig.json`).
