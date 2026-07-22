# Plan: Implementasi BRIVA + Transfer Bank Manual Polling

## Background
Pengembangan payment gateway mandiri saat ini sudah memiliki:
- **QRIS MPM Dynamic** via BRIAPI SNAP 2.0 (sandbox verified, callback webhook berjalan)
- **Biteship** untuk kurir (GoSend/POS/JNE/TIKI, sandbox test order berhasil)
- **Webhook Biteship** merespons 200 OK untuk validasi awal

Yang **belum diimplementasikan**:
- **BRIVA** (Virtual Account) sebagai opsi pembayaran otomatis (callback BRI).
- **Transfer bank manual** dengan auto-detect via **polling BRI account statement / BRIVA report**, sehingga admin tidak perlu konfirmasi manual.

## Prasyarat / Blokir yang Harus Diselesaikan Dulu
1. **Konfirmasi syarat BRIAPI production untuk perorangan**  
   Saat ini sandbox BRIAPI bisa diakses sebagai individu. Namun, documentation BRI menyebutkan bahwa upgrade ke production API diminta melampirkan dokumen badan usaha (Akta Pendirian, SIUP, dll.).  
   **Action**: Hubungi **BRI cabang Anda / Relationship Manager BRImerchant** untuk menanyakan apakah merchant perorangan dengan KTP+NPWP bisa menggunakan BRIAPI SNAP/BRIVA di production, atau terbatas untuk QRIS Static saja.

2. **Legalitas usaha**  
   Jika BRI mewajibkan badan usaha untuk BRIAPI production, pilih salah satu:
   - Ubah status usaha ke **UD** (Usaha Dagang) atau bentuk lain.
   - Pindah ke payment gateway lain yang mendukung individu (contoh: Midtrans/Xendit dengan individu).
   - Tetap pakai **QRIS Static** merchant BRI (tanpa API per-transaksi), hanya untuk QRIS.

## Arsitektur yang Akan Diimplementasikan

### A. BRIVA (Virtual Account)
Flow:
1. Checkout: customer pilih **BRIVA**.
2. `create-transaction.ts` memanggil BRIVA Create API (`POST /snap/v1.0/transfer-va/create-va`) untuk generate VA unik per order.
3. Simpan `briva_no`, `payment_reference`, `gateway='briva'` di tabel `payments`.
4. Callback BRI via webhook `/api/payment/bri/callback` (BRIVA push notification) → `confirmOrderPayment()` auto.
5. Jika callback missed, fallback polling via BRIVA status API.

Env vars BRIVA yang dibutuhkan:
```
BRI_BRIVA_INSTITUTION_CODE=<kode institusi BRIVA dari BRI, 5 digit>
BRI_BRIVA_PARTNER_SERVICE_ID=<partner service id BRIVA, biasanya sama/berhubung dengan partner_id>
# BRIVA menggunakan endpoint yang sama dengan SNAP:
BRI_API_BASE_URL=https://sandbox.partner.api.bri.co.id
BRI_CLIENT_ID
BRI_CLIENT_SECRET
BRI_PRIVATE_KEY / BRI_PUBLIC_KEY
```

Endpoint baru:
- `POST /api/payment/briva/create` → create VA untuk order tertentu (admin/checkout).
- `POST /api/payment/bri/callback` → verifikasi signature BRIVA + QRIS callback.
- `GET /api/payment/briva/status` → inquiry status VA.

### B. Transfer Bank Manual dengan Polling Statement
Flow:
1. Checkout: customer pilih **Transfer Bank BRI**.
2. Tampilkan nomor rekening BRI toko + total yang harus dibayar.
3. `create-transaction.ts` insert payment dengan `gateway='bank_transfer'`, `status='awaiting_payment'`.
4. **Polling job** (scheduled/cron via Vercel Cron / Supabase Edge Function):
   - Ambil orders dengan `status='awaiting_payment'` dan `gateway='bank_transfer'`.
   - Cek mutasi rekening BRI via **Account Statement API** atau **extrak MT940/statement file**.
   - Match transaksi masuk dengan `order_number` + amount + date window.
   - Jika match valid → `confirmOrderPayment()`.
5. **Rollback**: jika expired, batalkan order.

Env vars untuk polling:
```
BRI_ACCOUNT_STATEMENT_API_URL atau fallback ke manual statement mechanism
BRI_ACCOUNT_NUMBER=<nomor rekening BRI toko>
# Interval polling: misal 60 detik
BANK_TRANSFER_POLL_INTERVAL_SECONDS=60
BANK_TRANSFER_MATCH_TOLERANCE_IDR=5000
```

Catatan:
- BRI Account Statement API v2.0 requires Corporate ID (legal entity?). Perlu verifikasi.
- Alternatif tanpa BRIAPI: manual upload statement (MT940/file) dari admin → sistem parsing + auto-match. Lebih fleksibel untuk perorangan.

### C. Callback Webhook BRI Bersama
`/api/payment/bri/callback` akan menangani:
- QRIS MPM Dynamic callback (`qr-dynamic-mpm-notify`).
- BRIVA push notification (`/v1/0/transfer-va/notify-Payment-intrabank` atau SNAP equivalent).

Verifikasi signature tetap pakai `verifyBriSignature()` dengan `BRI_PUBLIC_KEY`.

## Environment Variables Tambahan
Ditambahkan ke `.env` dan Vercel:
```
# BRIVA
BRI_BRIVA_INSTITUTION_CODE=
BRI_BRIVA_PARTNER_SERVICE_ID=

# Bank transfer polling
BRI_ACCOUNT_NUMBER=
BANK_TRANSFER_POLL_INTERVAL_SECONDS=60
BANK_TRANSFER_MATCH_TOLERANCE_IDR=5000

# Optional: jika menggunakan statement API/cron
BRI_ACCOUNT_STATEMENT_API_URL=
```

## File yang Akan Ditambahkan / Diubah
- `src/lib/briva.ts` — createVA, inquiryVA, updateStatusVA, verifyBrivaNotification.
- `src/lib/bankTransferPolling.ts` — scheduled matcher untuk transfer bank manual.
- `src/pages/api/payment/briva/create.ts` — create BRIVA per order.
- `src/pages/api/payment/bri/callback.ts` — diperluas menang BRIVA + QRIS.
- `src/pages/api/payment/bank-transfer/poll.ts` — endpoint trigger polling (untuk Vercel Cron atau admin).
- `src/pages/api/payment/create-transaction.ts` — branch baru `gateway='briva'` dan `'bank_transfer'`.
- `src/components/CheckoutView.tsx` — tambah opsi pembayaran BRVA + transfer bank di UI.
- `docs/bank-transfer-briva-implementation.md` — panduan testing setara dengan Biteship.

## Validasi / Testing Plan
1. Sandbox BRIVA: create VA → pay via BRI test environment → callback diterima.
2. Polling: inject dummy mutasi → pastikan auto-match + confirm`.
3. End-to-end di staging Vercel sebelum production.

## Risks / Open Questions
- BRIVA production untuk perorangan? Tanya RM BRI terlebih dahulu.
- BRI Account Statement API untuk perorangan? Alternatif manual upload MT940 lebih aman.
- BRIVA expiration: max 60 bulan menurut docs, butuh handling extend/cancel jika order expired sebelum bayar.
- Balance/prefund: BRIVA settlement masuk ke rekening BRI Anda (sudah ada rekening toko).
- BRIVA callback signature scheme: cek dokumentasi terbaru (`x-partner-id` requirement, path verifikasi).

## Next Action
1. Hubungi BRI cabang Jepara untuk klarifikasi BRIVA/BRIAPI untuk perorangan.
2. Jika diizinkan: lanjut implement BRIVA + polling.
3. Jika tidak diizinkan: pertimbangkan Midtrans/Xendit untuk VA/transfer auto-confirm, atau QRIS Static merchant BRI tanpa API.
