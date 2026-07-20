# BJS Racing Store

Toko online PWA untuk distributor **Spray Paint (Pilok)** dan **Onderdil/Aksesoris Motor**. Dibangun dengan **Astro + React + Supabase**, deploy di **Vercel**, pembayaran via **Midtrans**, ongkos kirim via **RajaOngkir** & kurir internal toko.

## Tech Stack
- **Astro 5** (SSR, adapter Vercel serverless)
- **React 19** (komponen interaktif via `@astrojs/react`)
- **Tailwind CSS 3**
- **Supabase** (Auth + Postgres + Storage)
- **Midtrans Snap** (pembayaran)
- **vite-plugin-pwa** (installable PWA dengan notifikasi pembaruan)

## Struktur Direktori
```
src/
├── components/      # Komponen Astro & React (UI toko, akun, checkout, voucher)
├── layouts/         # MainLayout.astro (shell halaman)
├── lib/             # supabaseBrowserClient, supabaseServer, store (zustand), voucher
├── middleware.js    # Guard rute terproteksi & cek profil lengkap
├── pages/           # Rute & API endpoints (src/pages/api/*)
├── stores/          # nanostores/zustand store tambahan
public/              # Aset statis & ikon PWA
File SUPABASE/       # Dokumentasi skema, views, functions, triggers
File CATATAN/        # Catatan roadmap & instruksi fitur
```

## Environment Variables
Salin `.env.example` menjadi `.env` (jangan commit `.env`):
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `MIDTRANS_SERVER_KEY`

## Commands
```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # build produksi ke ./dist
npm run preview   # preview hasil build
```

## Alur Pembelian
1. Katalog produk (Pilok / Onderdil) → detail produk dinamis → tambah ke keranjang.
2. Checkout: pilih alamat, hitung ongkir (RajaOngkir / kurir internal), terapkan voucher.
3. `POST /api/payment/create-transaction` membuat order + minta Snap Token Midtrans.
4. Pelanggan bayar via popup Midtrans → `POST /api/payment/webhook` memverifikasi signature, mengurangi stok, dan mencatat ke tabel `transactions` (sinkron ke sistem POS).

## Catatan
- Dokumentasi skema DB ada di `File SUPABASE/` (konteks; tidak selalu lengkap/terbaru).
- Rute terproteksi (`/cart`, `/checkout`, `/akun`) dijaga oleh `src/middleware.js`.
