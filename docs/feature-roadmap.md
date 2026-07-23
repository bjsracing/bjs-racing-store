# Roadmap Perbaikan Fitur Toko Online BJS Racing

Berdasarkan stack yang ada (Astro + Supabase + Midtrans + RajaOngkir), berikut fitur-fitur yang bisa diimplementasikan, dari prioritas tinggi hingga rendah.

## Prioritas Tinggi (High Impact)

### 1. Order Tracking Visualization
- Track paket kurir terintegrasi di halaman akun customer
- Integrasi RajaOngkir tracking API sudah ada di backend, tinggal tampilkan status + estimasi
- File terkait: `src/components/TrackingView.jsx`
- File baru: `src/components/OrderTrackingMap.tsx`
- Tingkatkan dengan timeline status yang lebih jelas dan user-friendly
- Status: ✅ DITERAPKAN — Peta tracking pakai Leaflet + OSRM untuk route akurat

### 2. Notifikasi Otomatis Order Status
- Kirim notifikasi WhatsApp/SMS/email ketika:
  - Order dibuat → invoice otomatis
  - Payment confirmed → "Pembayaran diterima"
  - Order dikirim → "Paket dalam perjalanan" + tracking link
  - Order selesai → minta review
- Provider: Wablas / WaAPI untuk WhatsApp, Resend untuk email
- File terkait: `src/lib/notifications.ts`, `src/pages/api/notifications/send.ts`
- Dokumentasi: `docs/notification-setup.md`
- Status: ✅ INFRASTRUCTURE READY — Tinggal isi API key di .env dan trigger dari order flow

### 3. Product Catalog yang Lebih Kaya
- Foto produk lebih dari 1 (multi-image gallery)
- Variant produk (warna, ukuran) jika menjual produk apparel/racing gear
- Produk rekomendasi / "anda mungkin juga suka"
- Stok real-time + notifikasi "stok habis"
- Status: ✅ DITERAPKAN — Multi-image gallery, related products, stok habis badge

## Prioritas Menengah (Medium Impact)

### 4. Admin Analytics Dashboard
- Grafik penjualan harian/mingguan/bulanan
- Produk terlaris
- Metode pembayaran yang paling sering dipakai
- Ongkir terbesar vs pendapatan bersih
- File terkait: `src/pages/api/dashboard.ts`, `src/pages/admin/dashboard.astro`, `src/pages/api/admin/analytics.ts`
- Tinggal tambahkan chart/visualisasi
- Status: ✅ DITERAPKAN — Dashboard admin dengan CSS charts

### 5. Customer Review & Rating
- Setelah order selesai, customer bisa beri rating 1-5 bintang + komen
- Tampilkan rating di halaman produk
- Meningkatkan social proof & kepercayaan
- File terkait: `src/components/ReviewForm.jsx`, `src/components/ReviewsList.jsx`, `src/pages/api/reviews.ts`
- Status: ✅ DITERAPKAN — Form ulasan + daftar ulasan + API

### 6. Promo Banner & Featured Categories
- Banner promosi di homepage (rotating/slider)
- Kategori produk unggulan
- Flash sale dengan countdown timer
- Sudah ada voucher system, tinggal tambahkan UI banner & carousel
- File terkait: `src/components/PromoBanner.jsx`
- Status: ✅ DITERAPKAN — Promo banner slider di homepage

### 7. Live Chat / WhatsApp Chat Button
- Floating WhatsApp button di semua halaman
- Auto-reply dengan nomor order
- Interaksi langsung tanpa pindah app
- Murah & efektif untuk UMKM
- File terkait: `src/components/WhatsAppChatButton.jsx`
- Status: ✅ DITERAPKAN — Floating WhatsApp button di MainLayout

## Prioritas Rendah (Nice-to-have)

### 8. Wishlist / Compare Products
- Simpan produk favorit untuk beli nanti
- Bandingkan spesifikasi produk
- Status: ✅ DITERAPKAN — API + tombol wishlist/compare + halaman akun + navigasi

### 9. Multi-variant Product
- Ukuran, warna, varian dengan harga berbeda
- Perlu perubahan schema `products` + `order_items`
- Status: ✅ DITERAPKAN — Schema DB + UI selector varian di halaman produk

### 10. Search Improvement
- Filter by kategori, harga, merek
- Sort by harga terendah/tertinggi, terbaru, terlaris
- Status: ✅ DITERAPKAN — Filter lengkap + sort di CatalogFilter

### 11. Invoice PDF
- Generate invoice otomatis saat order dibuat
- Download PDF dari halaman akun
- Status: ✅ DITERAPKAN — Download invoice HTML + auto-print

### 12. Loyalty Points
- Poin dari setiap pembelian
- Tukar poin dengan diskon/voucher
- Status: ✅ DITERAPKAN — API + halaman akun + earning otomatis + redeem voucher

---

## Ringkasan Implementasi

### ✅ Sudah Diterapkan
1. **Order Tracking Visualization** — `OrderTrackingMap.tsx` dengan Leaflet + OSRM + fallback garis lurus
2. **Notifikasi Otomatis** — infrastructure + API + trigger di `create-transaction.ts`
3. **Product Catalog** — multi-image gallery, related products, stok habis badge
4. **Admin Analytics** — dashboard dengan CSS charts, API analytics
5. **Customer Review & Rating** — form ulasan, daftar ulasan, API reviews
6. **Promo Banner** — slider banner di homepage
7. **WhatsApp Chat** — floating button di semua halaman
8. **Wishlist / Compare** — API + tombol wishlist/compare + halaman akun + navigasi
9. **Multi-variant Product** — schema DB + UI selector varian di halaman produk
10. **Search Improvement** — filter lengkap + sort di CatalogFilter
11. **Invoice** — download invoice HTML + auto-print dari halaman pesanan
12. **Loyalty Points** — API + halaman akun + earning otomatis + redeem voucher



---

## Catatan Implementasi Maps
Lihat `docs/maps-features-roadmap.md` untuk detail fitur maps yang sudah dan akan diimplementasikan.
