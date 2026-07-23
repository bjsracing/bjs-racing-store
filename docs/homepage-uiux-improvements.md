# Homepage UI/UX Improvements - BJS Racing Store

**Tanggal:** 2025-01-XX
**Status:** Direncanakan
**Scope:** 10 Section Homepage

---

## Ringkasan

Dokumentasi rencana perbaikan UI/UX halaman beranda (homepage) BJS Racing Store. Seluruh section menggunakan **branding warna orange** yang sudah ada, dengan penambahan fitur dan peningkatan visual untuk menciptakan pengalaman belanja yang lebih profesional dan engaging.

---

## Struktur Section Homepage (Top to Bottom)

```
1.  PromoBanner (Enhanced)
2.  Hero Section (Split Layout + StatsCounter)
3.  BrandMarquee (Partner Logos)
4.  FeaturedProducts (Fetch Supabase)
5.  FlashSaleSection (Countdown + Promo)
6.  Kategori Produk (Enhanced Cards)
7.  TrustBadges (Social Proof)
8.  Kenapa Memilih Kami (Enhanced Features)
9.  TestimonialSection (Carousel)
10. NewsletterBanner (Email CTA)
```

---

## 1. PromoBanner (Enhanced)

**File:** `src/components/PromoBanner.jsx`
**Aksi:** Edit (modifikasi komponen yang sudah ada)

### Perubahan:
- **Progress bar animasi**: Garis tipis orange yang mengisi lebar penuh selama 5 detik (durasi setiap slide), memberikan visual cue waktu tersisa
- **Numbered indicator**: Ganti dot navigation dengan angka `01 / 03` yang lebih elegan
- **Transisi lebih halus**: Gunakan CSS `transition` dengan efek fade + slide bersamaan
- **Racing pattern**: Tambahkan subtle geometric pattern/texture pada background setiap slide
- **Pause on hover**: Timer auto-advance berhenti saat user mengarahkan mouse ke banner

### Visual:
```
┌─────────────────────────────────────────┐
│  ════════════════════░░░░░░░░░░░░░░░░░  │ <- Progress bar
│                                         │
│   Promo Spesial Racing Gear             │
│   Diskon hingga 30% untuk helm          │
│                                         │
│   [Belanja Sekarang]                    │
│                                         │
│              01 / 03                    │ <- Numbered indicator
└─────────────────────────────────────────┘
```

---

## 2. Hero Section (Split Layout + StatsCounter)

**File:** `src/pages/index.astro` + `src/components/StatsCounter.jsx` (baru)
**Aksi:** Edit + Buat baru

### Perubahan:
- **Split layout**: Kiri = Teks welcome + CTA buttons, Kanan = StatsCounter (angka animasi)
- **Animated counters**: Angka yang naik saat scroll masuk viewport
  - `500+ Produk`
  - `1000+ Terjual`
  - `4.8 Rating`
- **Background**: Gradient orange dengan subtle racing pattern (geometric lines)
- **Floating badge**: "Promo Minggu Ini" dengan animasi pulse di pojok
- **CTA buttons**: Pill shape dengan shadow, lebih modern
- **Scroll indicator**: Panah bawah dengan animasi bounce

### StatsCounter Component:
- Menggunakan `Intersection Observer` untuk trigger animasi saat visible
- Angka naik dari 0 ke target value dalam ~2 detik
- Format angka dengan separator ribuan

### Visual:
```
┌─────────────────────────────────────────┐
│                                         │
│   Selamat Datang di                    │
│   BJS RACING STORE!          ┌────────┐│
│                              │ 500+   ││
│   Distributor terpercaya...  │ Produk ││
│                              │ 1000+  ││
│   [Lihat Produk] [Kategori] │ Terjual││
│                              │ 4.8    ││
│                              │ Rating ││
│                              └────────┘│
│              ↓ (scroll)                │
└─────────────────────────────────────────┘
```

---

## 3. BrandMarquee (Partner Logos)

**File:** `src/components/BrandMarquee.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Infinite horizontal scroll**: Logo partner bergerak terus-menerus ke kiri
- **Brand logos**: Yoshimura, AP Racing, Brembo, Federal Part, KTC, Kawahara, dll
- **Grayscale -> Color**: Logo abu-abu → berwarna saat hover
- **Background**: Putih bersih dengan border atas/bawah tipis
- **Responsive**: Speed lebih lambat di mobile

### Visual:
```
┌─────────────────────────────────────────┐
│  Yoshimura  AP Racing  Brembo  Federal  │ <- infinite scroll
│  ────────────────────────────────────→  │
└─────────────────────────────────────────┘
```

---

## 4. FeaturedProducts (Fetch Supabase)

**File:** `src/components/FeaturedProducts.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Fetch dari Supabase**: RPC query untuk ambil produk berdasarkan kriteria
- **3 Tab filter**:
  - `Terlaris` → sort by `total_terjual` DESC
  - `Terbaru` → sort by `created_at` DESC
  - `Diskon` → where `harga_coret > harga_jual`
- **Grid responsive**: 2 kolom (mobile) → 3 kolom (tablet) → 4 kolom (desktop)
- **Menggunakan ProductCard** yang sudah ada
- **Loading skeleton**: Menampilkan placeholder saat fetch data
- **"Lihat Semua" link**: Navigasi ke katalog lengkap

### Supabase Query:
```sql
-- Terlaris
SELECT * FROM products
WHERE stok > 0
ORDER BY total_terjual DESC
LIMIT 8;

-- Terbaru
SELECT * FROM products
WHERE stok > 0
ORDER BY created_at DESC
LIMIT 8;

-- Diskon
SELECT * FROM products
WHERE harga_coret > harga_jual AND stok > 0
LIMIT 8;
```

### Visual:
```
┌─────────────────────────────────────────┐
│     Produk Unggulan                      │
│  [Terlaris] [Terbaru] [Diskon]          │ <- Tab filter
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Prod 1│ │Prod 2│ │Prod 3│ │Prod 4│  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Prod 5│ │Prod 6│ │Prod 7│ │Prod 8│  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│         [Lihat Semua Produk →]          │
└─────────────────────────────────────────┘
```

---

## 5. FlashSaleSection (Countdown + Promo)

**File:** `src/components/FlashSaleSection.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Countdown timer**: Hitung mundur ke midnight (00:00:00)
  - Format: `HH : MM : SS`
  - Angka dalam box terpisah dengan separator colon
- **Banner gradient**: Orange-to-red gradient untuk urgency feel
- **Badge "HARI INI SAJA"**: Pulsing animation
- **4-6 produk diskon**: Horizontal scroll di mobile, grid di desktop
- **Fetch dari Supabase**: Produk dengan diskon tertinggi
- **Produk card**: Simplified version (image, nama, harga coret, harga jual, badge diskon%)

### Countdown Logic:
```javascript
// Hitung waktu tersisa sampai midnight
const now = new Date();
const midnight = new Date(now);
midnight.setHours(24, 0, 0, 0);
const diff = midnight - now;
// Convert ke jam:menit:detik
```

### Visual:
```
┌─────────────────────────────────────────┐
│  ⚡ FLASH SALE - HARI INI SAJA!         │
│                                         │
│     ┌──┐   ┌──┐   ┌──┐                │
│     │05│ : │32│ : │18│                │ <- Countdown
│     └──┘   └──┘   └──┘                │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 30%  │ │ 25%  │ │ 40%  │ │ 20%  │  │
│  │Prod 1│ │Prod 2│ │Prod 3│ │Prod 4│  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────┘
```

---

## 6. Kategori Produk (Enhanced Cards)

**File:** `src/pages/index.astro` (section yang dimodifikasi)
**Aksi:** Edit

### Perubahan:
- **Ganti emoji dengan react-icons**: `FiDroplet` (Pilok), `FiCircle` (Spray Paint), `FiCPU` (Onderdil), `FiTool` (Aksesoris)
- **Card lebih besar**: `rounded-2xl` dengan padding lebih luas
- **Gradient background per kategori**: Setiap kategori warna gradient berbeda (tetap nuansa orange)
- **Hover effect**: `scale-105` + shadow-xl + border-orange-500
- **Jumlah produk**: Tampilkan "X produk" di bawah nama kategori
- **Icon container**: Box dengan background orange-100 dan icon orange-500

### Visual:
```
┌─────────────────────────────────────────┐
│       Kategori Produk                   │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  🎨      │  │  💨      │            │
│  │  Pilok   │  │  Spray   │            │
│  │ 120 produk│  │ 80 produk│            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  ⚙️      │  │  🔧      │            │
│  │  Onderdil│  │  Aksesoris│           │
│  │ 200 produk│  │ 50 produk│            │
│  └──────────┘  └──────────┘            │
│                                         │
│       [Lihat Semua Kategori]            │
└─────────────────────────────────────────┘
```

---

## 7. TrustBadges (Social Proof)

**File:** `src/components/TrustBadges.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **4 Trust badges** dalam grid responsive:
  - `Produk 100% Original` (FiShield)
  - `Garansi Resmi` (FiCheckCircle)
  - `Pengiriman Fast` (FiTruck)
  - `CS 24/7` (FiHeadphones)
- **Partner logos kurir**: JNE, J&T, SiCepat, Biteship (dalam baris terpisah)
- **Background**: slate-50 dengan card putih
- **Ikon**: React-icons (Feather Icons) dengan warna orange-500
- **Hover**: Card lift effect (translate-y + shadow)

### Visual:
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 🛡️      │ │ ✅      │ │ 🚚      │  │
│  │ Original│ │ Garansi │ │ Fast    │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│           ┌─────────┐                  │
│           │ 🎧      │                  │
│           │ CS 24/7 │                  │
│           └─────────┘                  │
│                                         │
│  JNE  |  J&T  |  SiCepat  |  Biteship │ <- Partner logos
└─────────────────────────────────────────┘
```

---

## 8. Kenapa Memilih Kami (Enhanced Features)

**File:** `src/pages/index.astro` (section yang dimodifikasi)
**Aksi:** Edit

### Perubahan:
- **Ganti emoji dengan react-icons**: `FiAward` (Kualitas), `FiTruck` (Pengiriman), `FiShield` (Garansi), `FiHeadphones` (Support)
- **Tambah stat number** di bawah setiap kartu: "2000+ Produk", "1000+ Pengiriman", "100% Garansi", "24/7 Support"
- **Card hover lift**: `hover:-translate-y-2` + shadow increase
- **Background**: Gradient subtle dari orange-50 ke white
- **Icon container**: Lingkaran dengan background orange-100

### Visual:
```
┌─────────────────────────────────────────┐
│    Kenapa Memilih BJS Racing Store?     │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  🏆      │ │  🚚      │ │  🛡️      ││
│  │ Kualitas │ │ Pengiriman│ │ Garansi  ││
│  │Terbaik   │ │ Cepat    │ │ Resmi    ││
│  │          │ │          │ │          ││
│  │2000+     │ │1000+     │ │100%      ││
│  │Produk    │ │Terkirim  │ │Garansi   ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

---

## 9. TestimonialSection (Carousel)

**File:** `src/components/TestimonialSection.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Hardcoded testimonials** (belum ada tabel di Supabase)
- **3-4 testimoni** dengan data:
  - Avatar (initial huruf atau foto placeholder)
  - Nama customer
  - Bintang rating (1-5)
  - Teks review
- **Auto-scroll carousel**: Berganti otomatis setiap 4 detik
- **Pause on hover**: Carousel berhenti saat mouse di atas
- **Dot navigation**: Untuk manual selection
- **Background**: Gradient orange sangat light (orange-50)
- **Card**: Rounded dengan shadow dan border halus

### Data Hardcoded:
```javascript
const testimonials = [
  {
    name: "Ahmad Rizki",
    rating: 5,
    text: "Spray paint-nya berkualitas banget! Warna nyata dan tahan lama. Recommended seller!",
    avatar: "AR"
  },
  {
    name: "Siti Nurhaliza",
    rating: 5,
    text: "Pengiriman cepat, packing rapi. Onderdil motor saya pas dan berfungsi dengan baik.",
    avatar: "SN"
  },
  {
    name: "Budi Santoso",
    rating: 4,
    text: "Harga terjangkau untuk kualitas original. Garansi resmi juga ada. Puas!",
    avatar: "BS"
  },
  {
    name: "Dewi Lestari",
    rating: 5,
    text: "Customer service-nya ramah dan fast response. barang sampai dengan selamat.",
    avatar: "DL"
  }
];
```

### Visual:
```
┌─────────────────────────────────────────┐
│   Apa Kata Pelanggan Kami?              │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  ⭐⭐⭐⭐⭐                          ││
│  │  "Spray paint-nya berkualitas       ││
│  │   banget! Warna nyata dan tahan     ││
│  │   lama. Recommended seller!"        ││
│  │                                     ││
│  │  ┌──┐ Ahmad Rizki                  ││
│  │  │AR│                               ││
│  │  └──┘                               ││
│  └─────────────────────────────────────┘│
│           ○ ● ○ ○                       │ <- Dots
└─────────────────────────────────────────┘
```

---

## 10. NewsletterBanner (Email CTA)

**File:** `src/components/NewsletterBanner.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Full-width banner**: Orange gradient background
- **Headline**: "Dapatkan Promo Eksklusif!"
- **Subtext**: "Berlangganan newsletter kami untuk mendapatkan diskon dan info promo terbaru"
- **Input field**: Email input dengan placeholder "Masukkan email Anda"
- **CTA button**: "Berlangganan" dengan white background
- **Background pattern**: Subtle racing-themed pattern
- **Floating badge**: "GRATIS" dengan animasi
- **Responsive**: Stack layout di mobile, inline di desktop

### Visual:
```
┌─────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓                                     ▓│
│▓   Dapatkan Promo Eksklusif!    [GRATIS]│
│▓   Berlangganan untuk diskon...        ▓│
│▓                                     ▓│
│▓   ┌──────────────────┐ [Berlangganan]│
│▓   │ email@domain.com │               ▓│
│▓   └──────────────────┘               ▓│
│▓                                     ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────────────────────────┘
```

---

## File yang Dibuat/Dimodifikasi

| # | File Path | Aksi | Keterangan |
|---|---|---|---|
| 1 | `tailwind.config.mjs` | Edit | Tambah custom brand color `brand-orange: #FF7800` |
| 2 | `src/components/PromoBanner.jsx` | Edit | Enhanced carousel |
| 3 | `src/components/FeaturedProducts.jsx` | **Baru** | Produk unggulan dari Supabase |
| 4 | `src/components/FlashSaleSection.jsx` | **Baru** | Flash sale + countdown |
| 5 | `src/components/BrandMarquee.jsx` | **Baru** | Brand partner scroll |
| 6 | `src/components/TrustBadges.jsx` | **Baru** | Trust + social proof |
| 7 | `src/components/TestimonialSection.jsx` | **Baru** | Testimoni carousel |
| 8 | `src/components/NewsletterBanner.jsx` | **Baru** | Newsletter CTA |
| 9 | `src/components/StatsCounter.jsx` | **Baru** | Animated counters |
| 10 | `src/pages/index.astro` | Edit | Susun ulang semua section |

---

## Catatan Teknis

### Warna Branding
- Primary: `#FF7800` (custom orange di PWA meta)
- Tailwind: `orange-500` (#f97316) hingga `orange-600` (#ea580c)
- Konsisten gunakan `orange-500` untuk primary actions

### Ikon
- Library: `react-icons` (Feather Icons set - `Fi*`)
- Ganti semua emoji dengan ikon React untuk konsistensi

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1023px`
- Desktop: `>= 1024px`

### Performance
- Gunakan `client:visible` atau `client:idle` untuk component yang tidak urgent
- Lazy load produk images
- Skeleton loading untuk fetch data

---

## Status Implementasi

- [ ] 1. PromoBanner (Enhanced)
- [ ] 2. Hero Section + StatsCounter
- [ ] 3. BrandMarquee
- [ ] 4. FeaturedProducts
- [ ] 5. FlashSaleSection
- [ ] 6. Kategori Produk (Enhanced)
- [ ] 7. TrustBadges
- [ ] 8. Kenapa Memilih Kami (Enhanced)
- [ ] 9. TestimonialSection
- [ ] 10. NewsletterBanner
