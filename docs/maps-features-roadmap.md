# Roadmap Fitur Maps untuk Toko Online BJS Racing

Berdasarkan form alamat yang sudah ada (`AddressForm.tsx`) dan kebutuhan toko online, berikut 5 fitur maps yang bisa diimplementasikan menggunakan Leaflet + OpenStreetMap.

## 1. Map Picker di Form Alamat (Primary)
Customer klik pin di map → otomatis isi `latitude/longitude` + reverse geocoding ke alamat text.
- Integrasi dengan form `AddressForm.tsx` yang sudah ada
- Ganti manual input lat/lng jadi visual map
- Pakai Nominatim untuk reverse geocoding

## 2. Store Location Map (Professional touch)
Tampilkan lokasi toko fisik di halaman "Contact Us" atau homepage.
- Customer bisa lihat alamat toko di map
- Navigasi ke toko dengan 1 klik (Google Maps/Apple Maps deep link)
- Meningkatkan kepercayaan bahwa toko "nyata"

## 3. Delivery Coverage Map (Operational)
Visualisasi area yang terjangkau kurir internal toko.
- Tandai zona internal (Bangsri, dll.) di map
- Customer bisa cek apakah alamatnya di zona internal atau tidak
- Berguna untuk customer yang ingin pastikan area dilayani

## 4. Order Tracking Map (Enhanced tracking)
Track paket kurir secara visual di halaman akun customer.
- Integrasi RajaOngkir tracking API yang sudah ada
- Tampilkan progress paket di map (origin → destination)
- Berguna untuk customer yang suka tracking visual

## 5. Distance Estimation Map (Transparansi ongkir)
Tampilkan jarak dari toko ke alamat customer di checkout.
- Hitung jarak real-time setelah customer pilih alamat
- Tampilkan estimasi "Jarak: X km" sebelum customer pilih kurir
- Meningkatkan transparansi ongkir

---

## Cara Kerja Route & Distance

### OSRM + Fallback Garis Lurus

Kedua fitur **Order Tracking Map** dan **Distance Estimation Map** menggunakan:

1. **OSRM** (`https://router.project-osrm.org`) untuk rute jalanan yang akurat
2. **Fallback garis lurus** jika OSRM gagal/timeout

```ts
// Contoh penggunaan
import { getOsrmRoute, formatDistance, formatDuration } from "@/lib/osrm";

// Untuk tracking map
const route = await getOsrmRoute(
  [originLng, originLat], // toko
  [destLng, destLat]      // customer
);
// route.geometry → polyline untuk Leaflet
// route.distanceMeters → tampilkan "X km"
// route.fallback → true jika pakai garis lurus

// Untuk distance estimation
const route = await getOsrmRoute(
  [storeLng, storeLat],
  [customerLng, customerLat]
);
const distanceText = formatDistance(route.distanceMeters);
const durationText = formatDuration(route.durationSeconds);
```

**Catatan:**
- OSRM public demo server bebas tanpa API key, tapi ada rate limit
- Timeout 5 detik, setelah itu fallback otomatis ke garis lurus
- Hasil polyline可从 `route.geometry` langsung di-render di Leaflet

## Status Implementasi

### ✅ Siap Digunakan
- `src/lib/osrm.ts` — utility OSRM + fallback + format helper

### Menunggu Integrasi
1. **Map Picker** — integrasi ke `AddressForm.tsx`
2. **Order Tracking Map** — render polyline dari `getOsrmRoute()`
3. **Distance Estimation** — tampilkan jarak di checkout
4. **Store Location Map** — halaman statis
5. **Delivery Coverage Map** — visualisasi zona dengan GeoJSON

---

## Rekomendasi Implementasi
Urutan prioritas:
1. **Map Picker** — langsung ke form alamat, ganti input manual lat/lng
2. **Store Location Map** — halaman statis, mudah
3. **Delivery Coverage Map** — visualisasi zona internal
4. **Order Tracking Map** — integrasi RajaOngkir + OSRM
5. **Distance Estimation** — hitung jarak real-time di checkout
