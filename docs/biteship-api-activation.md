# Biteship API Activation Guide

Test orders yang telah dibuat untuk memenuhi syarat aktivasi API Biteship.

## Test Orders

| No | Tujuan | Order ID | Waybill | Courier | Status |
|----|----------|----------------------------|----------------------|---------|--------|
| 1 | Delivered | `6a60cb229cf413337bf34440` | `WYB-1784728354730` | JNE `reg` | sudah disimulasikan Delivered |
| 2 | Cancelled | `6a60d1b14712b82089101845` | `WYB-1784730033019` | JNE `reg` | siap disimulasikan Cancelled |

Catatan: Keduanya adalah **test order sandbox** (dibuat dengan API key `biteship_test.`). Tidak ada transaksi finansial nyata.

## Syarat dari Biteship

Berdasarkan dokumentasi Biteship dan requirement test order, Anda perlu menyiapkan:

### 1. Test Orders
- Minimal **2 test order**:
  - **1 order berstatus Delivered**
  - **1 order berstatus Cancelled**
- Order harus dibuat menggunakan **sandbox API key** (`biteship_test.`).
- Status disimulasikan via **Biteship Dashboard → Pengiriman → Update Status**.
- Catat **Order ID** dan **Waybill** dari masing-masing order.

### 2. Formulir Aktivasi API
Akses: `https://dashboard.biteship.com/api-activation-form` atau **Dashboard → Pengaturan → API → Aktivasi API**

Isi field yang diminta:
- **Delivered Order ID**: `6a60cb229cf413337bf34440`
- **Cancelled Order ID**: `6a60d1b14712b82089101845`
- **Pilih kurir**: aktifkan yang Anda pakai (misal JNE, GoSend, TIKI, POS)
- **Upload resi pengiriman** (jika diminta):
  - Format PNG/JPG/JPEG, max 1MB
  - Harus jelas: barcode, nomor resi, nama layanan, info pengirim, info penerima, berat/dimensi, logo kurir
- **Informasi toko**: nama, alamat, kontak, website/aplikasi yang diintegrasikan
- **Estimasi volume pengiriman** per bulan

### 3. Verifikasi Webhook
Webhook URL harus merespons `200 OK` saat Biteship mengirim notifikasi:
```
POST https://bjs-racing-store.vercel.app/api/shipping/biteship/webhook
```
- **Headers Signature Key**: `X-Biteship-Signature`
- **Headers Signature Secret**: `6a6ddf1cc876079c31ab21108b069af4e6cc2b7bcf51a946425154acac70c29e`

Pastikan endpoint ini live sebelum submit form, karena Biteship akan mengirim test event.

## Langkah Simulasi Status Test Order

### Delivered
1. Buka **Dashboard → Pengiriman**
2. Cari order `6a60cb229cf413337bf34440`
3. Klik **Update Status** berurutan:
   - CONFIRM PESANAN
   - ALLOCATE
   - START PICKING UP
   - Ambil Barang
   - Menuju Pelanggan
   - SELESAI
4. Catat bahwa webhook terkirim ke endpoint aplikasi Anda.

### Cancelled
1. Buka **Dashboard → Pengiriman**
2. Cari order `6a60d1b14712b82089101845`
3. Klik **Update Status** → pilih **CANCEL**
4. Webhook dengan status `cancelled` harus terkirim.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tombol Update Status tidak muncul | Pastikan menggunakan API key sandbox (`biteship_test.`), bukan production. |
| Order API return 401 | Cek header `Authorization: Bearer <sandbox_api_key>`. |
| Webhook tidak diterima | Pastikan URL `https://bjs-racing-store.vercel.app/api/shipping/biteship/webhook` dapat diakses publik dan merespons 200 OK. |
| Rates API minta top-up | Tetap normal: Rates/Tracking/Maps di sandbox tetap berharga paid usage. |

## Environment Variables yang Diperlukan

Di Vercel Production / local `.env`:
```
BITESHIP_API_KEY=<sandbox atau live API key>
BITESHIP_ORIGIN_LAT=-6.5244682
BITESHIP_ORIGIN_LNG=110.7674915
BITESHIP_ORIGIN_NAME=BJS Racing Store
BITESHIP_ORIGIN_PHONE=0881011669213
BITESHIP_ORIGIN_ADDRESS=Jl. Wijaya Kusuma No.79 Toko BJS RACING, Desa Bangsri, Kec. Bangsri, Kab. Jepara, Jawa Tengah 59453
BITESHIP_ORIGIN_POSTAL=59453
BITESHIP_WEBHOOK_KEY=X-Biteship-Signature
BITESHIP_WEBHOOK_SECRET=6a6ddf1cc876079c31ab21108b069af4e6cc2b7bcf51a946425154acac70c29e
```
