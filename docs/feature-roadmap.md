# Roadmap Perbaikan Fitur Toko Online BJS Racing

Berdasarkan stack yang ada (Astro + Supabase + Midtrans + RajaOngkir), berikut fitur-fitur yang bisa diimplementasikan, dari prioritas tinggi hingga rendah.

## Prioritas Tinggi (High Impact)

### 1. Order Tracking Visualization
- Track paket kurir terintegrasi di halaman akun customer
- Integrasi RajaOngkir tracking API sudah ada di backend, tinggal tampilkan status + estimasi
- File terkait: `src/components/TrackingView.jsx`
- Tingkatkan dengan timeline status yang lebih jelas dan user-friendly

### 2. Notifikasi Otomatis Order Status
- Kirim notifikasi WhatsApp/SMS/email ketika:
  - Order dibuat → invoice otomatis
  - Payment confirmed → "Pembayaran diterima"
  - Order dikirim → "Paket dalam perjalanan" + tracking link
  - Order selesai → minta review
- Bisa pakai WA API (Wablas/WaAPI) atau email (Resend/SendGrid)
- Sangat meningkatkan kepercayaan customer

### 3. Product Catalog yang Lebih Kaya
- Foto produk lebih dari 1 (multi-image gallery)
- Variant produk (warna, ukuran) jika menjual produk apparel/racing gear
- Produk rekomendasi / "anda mungkin juga suka"
- Stok real-time + notifikasi "stok habis"

## Prioritas Menengah (Medium Impact)

### 4. Admin Analytics Dashboard
- Grafik penjualan harian/mingguan/bulanan
- Produk terlaris
- Metode pembayaran yang paling sering dipakai
- Ongkir terbesar vs pendapatan bersih
- File terkait: `src/pages/api/dashboard.ts`
- Tinggal tambahkan chart/visualisasi

### 5. Customer Review & Rating
- Setelah order selesai, customer bisa beri rating 1-5 bintang + komen
- Tampilkan rating di halaman produk
- Meningkatkan social proof & kepercayaan

### 6. Promo Banner & Featured Categories
- Banner promosi di homepage (rotating/slider)
- Kategori produk unggulan
- Flash sale dengan countdown timer
- Sudah ada voucher system, tinggal tambahkan UI banner & carousel

### 7. Live Chat / WhatsApp Chat Button
- Floating WhatsApp button di semua halaman
- Auto-reply dengan nomor order
- Interaksi langsung tanpa pindah app
- Murah & efektif untuk UMKM

## Prioritas Rendah (Nice-to-have)

### 8. Wishlist / Compare Products
- Simpan produk favorit untuk beli nanti
- Bandingkan spesifikasi produk

### 9. Multi-variant Product
- Ukuran, warna, varian dengan harga berbeda
- Perlu perubahan schema `products` + `order_items`

### 10. Search Improvement
- Filter by kategori, harga, merek
- Sort by harga terendah/tertinggi, terbaru, terlaris

### 11. Invoice PDF
- Generate invoice otomatis saat order dibuat
- Download PDF dari halaman akun

### 12. Loyalty Points
- Poin dari setiap pembelian
- Tukar poin dengan diskon/voucher

---

## Rekomendasi Eksekusi Tahap Awal
Mulai dari:
1. **Notifikasi Order Status** — customer baru dapat info lewat halaman/telepon manual
2. **Multi-image gallery** — meningkatkan konversi penjualan
3. **Admin Analytics Dashboard** — memudahkan monitoring bisnis
