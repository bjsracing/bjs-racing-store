# Homepage UI/UX Improvements - BJS Racing Store

**Tanggal:** 2025-01-XX
**Status:** Direncanakan
**Scope:** 11 Section Homepage
**Design System Source:** ui-ux-pro-max skill (e-commerce automotive racing)

---

## Ringkasan

Dokumentasi rencana perbaikan UI/UX halaman beranda (homepage) BJS Racing Store. Seluruh section menggunakan **branding warna orange** yang sudah ada, dengan penambahan fitur dan peningkatan visual untuk menciptakan pengalaman belanja yang lebih profesional dan engaging.

---

## Design System (dari ui-ux-pro-max)

### Pattern
- **App Store Style Landing** + **Bento Grid Showcase**
- Section order: Hero → Product Grid → Features → Social Proof → CTA

### Style
- **Vibrant & Block-based**: Bold, energetic, geometric, high color contrast
- Large sections (48px+ gap), scroll-snap, large type (32px+)
- Transition timing: 200-300ms

### Typography
- **Heading:** Rubik (bold, geometric, cocok untuk racing/automotive)
- **Body:** Nunito Sans (clean, readable, conversion-friendly untuk e-commerce)
- Google Fonts: `Rubik:wght@300;400;500;600;700` + `Nunito+Sans:wght@300;400;500;600;700`
- CSS Import:
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap');
```
- Tailwind Config:
```javascript
fontFamily: {
  heading: ['Rubik', 'sans-serif'],
  body: ['Nunito Sans', 'sans-serif'],
}
```

### Color Strategy
- Primary: `#FF7800` (brand orange dari PWA meta)
- Secondary: `slate-800` / `slate-900` (text, header, footer)
- Background: `slate-50` / `white`
- Urgency: `red-500` (flash sale, diskon badges)
- Trust: `green-500` / `green-600` (success states)

### Key Effects
- Animated patterns pada hero/promo banner
- Bold hover (color + shadow shift, bukan scale berlebihan)
- Skeleton loading untuk async data
- GPU-accelerated animations (transform + will-change)

---

## Struktur Section Homepage (Top to Bottom)

```
1.  PromoBanner (Enhanced)
2.  Hero Section (Split Layout + StatsCounter)
3.  VideoShowcase (YouTube Carousel)         ← NEW
4.  BrandMarquee (Partner Logos)
5.  FeaturedProducts (Fetch Supabase)
6.  FlashSaleSection (Countdown + Promo)
7.  Kategori Produk (Enhanced Cards)
8.  TrustBadges (Social Proof)
9.  Kenapa Memilih Kami (Enhanced Features)
10. TestimonialSection (Carousel)
11. NewsletterBanner (Email CTA)
```

---

## 1. PromoBanner (Enhanced)

**File:** `src/components/PromoBanner.jsx`
**Aksi:** Edit (modifikasi komponen yang sudah ada)

### Perubahan:
- **Progress bar animasi**: Garis tipis orange yang mengisi lebar penuh selama 5 detik (durasi setiap slide), memberikan visual cue waktu tersisa
- **Numbered indicator**: Ganti dot navigation dengan angka `01 / 03` yang lebih elegan
- **Transisi lebih halus**: Gunakan CSS `transition-all duration-300 ease-in-out` dengan efek fade + slide bersamaan
- **Racing pattern**: Tambahkan subtle geometric pattern/texture pada background setiap slide
- **Pause on hover**: Timer auto-advance berhenti saat user mengarahkan mouse ke banner
- **`cursor-pointer`** pada semua clickable area

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
- **Floating badge**: "Promo Minggu Ini" dengan animasi `animate-pulse` di pojok
- **CTA buttons**: Pill shape (`rounded-full`) dengan shadow, lebih modern
- **Scroll indicator**: Panah bawah dengan animasi subtle `animate-pulse` (bukan bounce — menghindari continuous animation yang distracting)

### StatsCounter Component:
- Menggunakan `Intersection Observer` untuk trigger animasi saat visible
- Angka naik dari 0 ke target value dalam ~2 detik
- Format angka dengan separator ribuan (`Intl.NumberFormat`)
- Respect `prefers-reduced-motion`: skip animasi, langsung tampilkan final value

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
│              ↓ (scroll pulse)          │
└─────────────────────────────────────────┘
```

---

## 3. VideoShowcase (YouTube Carousel)

**File:** `src/components/VideoShowcase.jsx` (baru) + `src/components/YouTubeEmbed.jsx` (baru)
**Aksi:** Buat baru (2 komponen)

### Konsep:
Single large video dengan arrow navigation (carousel). User bisa geser ke video lainnya menggunakan tombol arrow `[<]` `[>]`, dot indicators, swipe di mobile, atau keyboard arrow keys. Video menggunakan YouTube embed dengan click-to-play (bukan autoplay).

### Data Video (5 YouTube URLs):

| # | YouTube URL | Video ID | Judul |
|---|---|---|---|
| 1 | https://youtu.be/JYJEdrUTQzE | `JYJEdrUTQzE` | Video Produk 1 |
| 2 | https://youtu.be/4H3ZedPiIvc | `4H3ZedPiIvc` | Video Produk 2 |
| 3 | https://youtu.be/PDdSFtYcLsE | `PDdSFtYcLsE` | Video Produk 3 |
| 4 | https://youtu.be/p84JYNhq3Dc | `p84JYNhq3Dc` | Video Produk 4 |
| 5 | https://youtu.be/8d6-nH6ManQ | `8d6-nH6ManQ` | Video Produk 5 |

### Data Structure:
```javascript
const videos = [
  {
    id: "JYJEdrUTQzE",
    title: "Demo Spray Paint Metallic BJS Racing",
    product: "Pilok Metallic Series"
  },
  {
    id: "4H3ZedPiIvc",
    title: "Review Underbone System Racing",
    product: "Underbone Racing"
  },
  {
    id: "PDdSFtYcLsE",
    title: "Cara Pasang Aksesoris Motor",
    product: "Aksesoris Collection"
  },
  {
    id: "p84JYNhq3Dc",
    title: "Perbandingan Warna Pilok Gold vs Chrome",
    product: "Pilok Premium"
  },
  {
    id: "8d6-nH6ManQ",
    title: "Unboxing Onderdil Federal Part",
    product: "Federal Part Series"
  }
];
```

### Component Architecture:
```
VideoShowcase.jsx
├── Header: "Video Produk Unggulan"
├── Carousel Container (scroll-snap)
│   ├── Arrow Left (FiChevronLeft)
│   ├── Video Slides
│   │   ├── Slide 1: YouTubeEmbed (thumbnail + click-to-play)
│   │   ├── Slide 2: YouTubeEmbed
│   │   ├── Slide 3: YouTubeEmbed
│   │   ├── Slide 4: YouTubeEmbed
│   │   └── Slide 5: YouTubeEmbed
│   └── Arrow Right (FiChevronRight)
├── Dot Indicators (5 dots)
└── "Lihat Semua Video" CTA
```

### Perubahan:
- **CSS Scroll-Snap**: Container menggunakan `overflow-x: auto` + `scroll-snap-type: x mandatory`
- **Arrow navigation**: Tombol `[<]` `[>]` dengan `FiChevronLeft` / `FiChevronRight`
  - onClick: `container.scrollBy({ left: ±slideWidth, behavior: 'smooth' })`
  - Disabled state saat di awal/akhir carousel
- **Dot indicators**: 5 dot navigation, aktif = `bg-orange-500`, inactive = `bg-slate-300`
  - onClick: `container.scrollTo({ left: index * slideWidth, behavior: 'smooth' })`
- **Swipe support**: Native CSS scroll-snap = swipe gesture gratis di mobile
- **Click-to-play**: Thumbnail YouTube + play button overlay → load iframe saat diklik
- **Keyboard navigation**: Arrow keys untuk navigasi carousel (accessibility)
- **`cursor-pointer`** pada semua clickable area (arrows, thumbnails, dots)
- **`prefers-reduced-motion`**: Disable smooth scroll, gunakan instant navigation
- **Lazy loading**: Thumbnail images pakai `loading="lazy"`, iframe hanya load saat play

### YouTubeEmbed Component:
```jsx
// Reusable YouTube player
// Props: videoId, title, showInfo
// State: isPlaying (boolean)
// Thumbnail: https://img.youtube.com/vi/${videoId}/maxresdefault.jpg
// Play button: FiPlay icon, white bg, orange icon
// On click: setState(true) → render <iframe src="youtube.com/embed/${id}?autoplay=1">
```

### Carousel Behavior:

| Device | Aksi | Hasil |
|---|---|---|
| **Desktop** | Klik arrow `[<]` `[>]` | Geser video (smooth scroll) |
| **Desktop** | Klik dot `○ ● ○ ○ ○` | Loncat ke video tertentu |
| **Desktop** | Klik keyboard arrow | Navigasi carousel |
| **Desktop** | Klik thumbnail | Play YouTube video |
| **Mobile** | Swipe left/right | Geser video (native scroll-snap) |
| **Mobile** | Klik thumbnail | Play YouTube video (fullscreen) |

### Responsive Behavior:

| Breakpoint | Layout | Arrow | Swipe |
|---|---|---|---|
| **Mobile** (< 768px) | Full-width video, smaller arrows | Arrow overlay di dalam video | Yes (native scroll-snap) |
| **Tablet** (768-1023px) | Contained width, medium arrows | Arrow di luar video | Yes |
| **Desktop** (>= 1024px) | Max-width 4xl, large arrows | Arrow di luar video | No (use arrows) |

### Performance:
| Concern | Solution |
|---|---|
| YouTube iframe load | Hanya load saat user klik play (click-to-play, bukan autoplay) |
| Thumbnail images | `loading="lazy"`, YouTube CDN (already optimized) |
| Scroll performance | CSS `scroll-snap` = GPU accelerated, no JS scroll calculation |
| Bundle size | Component is small (~3KB total), no external dependencies |

### Accessibility:
| Rule | Implementation |
|---|---|
| `cursor-pointer` | Pada thumbnails, arrows, dots |
| Focus states | `focus:ring-2 focus:ring-orange-500` pada arrows & dots |
| Keyboard navigation | Arrow keys untuk navigasi carousel |
| `prefers-reduced-motion` | Disable smooth scroll, use instant navigation |
| Alt text | Pada semua thumbnail images |
| ARIA labels | `aria-label="Video sebelumnya"`, `aria-label="Video berikutnya"` |
| `role="region"` | `aria-label="Video carousel"` pada container |

### Visual:
```
┌──────────────────────────────────────────────────┐
│      Video Produk Unggulan                        │
│                                                   │
│  [<]  ┌────────────────────────────────────┐  [>] │
│       │                                    │      │
│       │          ▶ Play Button             │      │
│       │                                    │      │
│       │       [YouTube Thumbnail]           │      │
│       │       (aspect-video 16:9)           │      │
│       │                                    │      │
│       │  Demo Spray Paint Metallic BJS     │      │
│       │  "Pilok Metallic Series"           │      │
│       └────────────────────────────────────┘      │
│                                                   │
│                 ○ ● ○ ○ ○                         │  <- Dot indicators
│                                                   │
│            [Lihat Semua Video →]                  │
└──────────────────────────────────────────────────┘
```

---

## 4. BrandMarquee (Partner Logos)

**File:** `src/components/BrandMarquee.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Infinite horizontal scroll**: Logo partner bergerak terus-menerus ke kiri
- **Brand logos**: Yoshimura, AP Racing, Brembo, Federal Part, KTC, Kawahara, dll
- **Grayscale -> Color**: Logo abu-abu → berwarna saat hover (`filter: grayscale(100%)` → `grayscale(0%)`)
- **Background**: Putih bersih dengan border atas/bawah tipis
- **Responsive**: Speed lebih lambat di mobile
- **GPU acceleration**: Gunakan `transform: translateX()` + `will-change: transform` (hindari animating `left`/`margin-left`)
- **`prefers-reduced-motion`**: Pause marquee saat user mengaktifkan reduced motion

### Visual:
```
┌─────────────────────────────────────────┐
│  Yoshimura  AP Racing  Brembo  Federal  │ <- infinite scroll
│  ────────────────────────────────────→  │
└─────────────────────────────────────────┘
```

---

## 5. FeaturedProducts (Fetch Supabase)

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
- **Loading skeleton**: 4 kotak placeholder dengan `animate-pulse` (bg-slate-200, rounded-xl) yang mereplikasi ukuran ProductCard
- **"Lihat Semua" link**: Navigasi ke katalog lengkap
- **`client:visible`** untuk lazy hydration (Astro)

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

### Skeleton Loading Pattern:
```jsx
// 4 skeleton cards dalam grid
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {[...Array(8)].map((_, i) => (
    <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
      <div className="aspect-square bg-slate-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2" />
        <div className="h-5 bg-slate-200 animate-pulse rounded w-1/3" />
      </div>
    </div>
  ))}
</div>
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

## 6. FlashSaleSection (Countdown + Promo)

**File:** `src/components/FlashSaleSection.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Countdown timer**: Hitung mundur ke midnight (00:00:00)
  - Format: `HH : MM : SS`
  - Angka dalam box terpisah dengan separator colon
- **Banner gradient**: Orange-to-red gradient untuk urgency feel
- **Badge "HARI INI SAJA"**: Animasi subtle (fade opacity, bukan continuous pulse yang distracting)
- **4-6 produk diskon**: Horizontal scroll di mobile, grid di desktop
- **Fetch dari Supabase**: Produk dengan diskon tertinggi
- **Produk card**: Simplified version (image, nama, harga coret, harga jual, badge diskon%)
- **`prefers-reduced-motion`**: Countdown tetap jalan tanpa animasi visual

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
│  FLASH SALE - HARI INI SAJA!            │ <- Ikon: FiZap
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

## 7. Kategori Produk (Enhanced Cards)

**File:** `src/pages/index.astro` (section yang dimodifikasi)
**Aksi:** Edit

### Perubahan:
- **Ganti emoji dengan react-icons**: `FiDroplet` (Pilok), `FiCircle` (Spray Paint), `FiCPU` (Onderdil), `FiTool` (Aksesoris)
- **Card lebih besar**: `rounded-2xl` dengan padding lebih luas
- **Gradient background per kategori**: Setiap kategori warna gradient berbeda (tetap nuansa orange)
- **Hover effect**: `shadow-xl` + `border-orange-500` (HINDARI `scale-105` — causes layout shift)
- **`cursor-pointer`** pada semua kartu kategori
- **Jumlah produk**: Tampilkan "X produk" di bawah nama kategori
- **Icon container**: Box dengan background orange-100 dan icon orange-500
- **Transition**: `transition-all duration-200` (150-300ms range)

### Visual:
```
┌─────────────────────────────────────────┐
│       Kategori Produk                   │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ [FiDroplet] │ [FiCircle]  │          │
│  │  Pilok   │  │  Spray   │            │
│  │ 120 produk│  │ 80 produk│            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ [FiCPU]  │  │ [FiTool] │            │
│  │  Onderdil│  │  Aksesoris│           │
│  │ 200 produk│  │ 50 produk│            │
│  └──────────┘  └──────────┘            │
│                                         │
│       [Lihat Semua Kategori]            │
└─────────────────────────────────────────┘
```

---

## 8. TrustBadges (Social Proof)

**File:** `src/components/TrustBadges.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **4 Trust badges** dalam grid responsive:
  - `Produk 100% Original` (`FiShield`)
  - `Garansi Resmi` (`FiCheckCircle`)
  - `Pengiriman Fast` (`FiTruck`)
  - `CS 24/7` (`FiHeadphones`)
- **Partner logos kurir**: JNE, J&T, SiCepat, Biteship (dalam baris terpisah)
- **Background**: slate-50 dengan card putih
- **Ikon**: React-icons (Feather Icons) dengan warna orange-500
- **Hover**: Card `shadow-lg` + `border-orange-500` (bukan translate-y — hindari layout shift)
- **`cursor-pointer`** pada semua badge cards

### Visual:
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │[FiShield]│ │[FiCheck] │ │[FiTruck]│  │
│  │ Original│ │ Garansi │ │ Fast    │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│           ┌─────────┐                  │
│           │[FiHeadph]│                  │
│           │ CS 24/7 │                  │
│           └─────────┘                  │
│                                         │
│  JNE  |  J&T  |  SiCepat  |  Biteship │ <- Partner logos
└─────────────────────────────────────────┘
```

---

## 9. Kenapa Memilih Kami (Enhanced Features)

**File:** `src/pages/index.astro` (section yang dimodifikasi)
**Aksi:** Edit

### Perubahan:
- **Ganti emoji dengan react-icons**: `FiAward` (Kualitas), `FiTruck` (Pengiriman), `FiShield` (Garansi), `FiHeadphones` (Support)
- **Tambah stat number** di bawah setiap kartu: "2000+ Produk", "1000+ Pengiriman", "100% Garansi", "24/7 Support"
- **Card hover**: `shadow-lg` + `border-orange-500` (HINDARI `hover:-translate-y-2` — causes layout shift)
- **Background**: Gradient subtle dari orange-50 ke white
- **Icon container**: Lingkaran dengan background orange-100
- **`cursor-pointer`** pada semua kartu

### Visual:
```
┌─────────────────────────────────────────┐
│    Kenapa Memilih BJS Racing Store?     │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │[FiAward] │ │[FiTruck] │ │[FiShield]││
│  │ Kualitas │ │ Pengiriman│ │ Garansi  ││
│  │Terbaik   │ │ Cepat    │ │ Resmi    ││
│  │          │ │          │ │          ││
│  │2000+     │ │1000+     │ │100%      ││
│  │Produk    │ │Terkirim  │ │Garansi   ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

---

## 10. TestimonialSection (Carousel)

**File:** `src/components/TestimonialSection.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Hardcoded testimonials** (belum ada tabel di Supabase)
- **3-4 testimoni** dengan data:
  - Avatar (initial huruf dengan background orange-100, text orange-600)
  - Nama customer
  - Bintang rating (1-5) menggunakan `FiStar` (fill yellow-400)
  - Teks review
- **Auto-scroll carousel**: Berganti otomatis setiap **6-8 detik** (bukan 4 detik — menghindari carousel yang terlalu cepat mengganggu reading)
- **Pause on hover DAN pause on focus**: Carousel berhenti saat mouse di atas atau element focused
- **Prev/Next buttons** (`FiChevronLeft`, `FiChevronRight`) sebagai alternatif dots navigation
- **Dot navigation**: Untuk manual selection
- **Background**: Gradient orange sangat light (orange-50)
- **Card**: Rounded-xl dengan shadow dan border halus
- **`prefers-reduced-motion`**: Disable auto-scroll, hanya manual navigation

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
    text: "Customer service-nya ramah dan fast response. Barang sampai dengan selamat.",
    avatar: "DL"
  }
];
```

### Visual:
```
┌─────────────────────────────────────────┐
│   Apa Kata Pelanggan Kami?              │
│                                         │
│  [<] ┌───────────────────────────┐ [>] │
│      │  [FiStar][FiStar]...      │      │
│      │  "Spray paint-nya         │      │
│      │   berkualitas banget!..." │      │
│      │                           │      │
│      │  [AR] Ahmad Rizki        │      │
│      └───────────────────────────┘      │
│           ○ ● ○ ○                       │ <- Dots + Prev/Next
└─────────────────────────────────────────┘
```

---

## 11. NewsletterBanner (Email CTA)

**File:** `src/components/NewsletterBanner.jsx` (baru)
**Aksi:** Buat baru

### Perubahan:
- **Full-width banner**: Orange gradient background
- **Headline**: "Dapatkan Promo Eksklusif!"
- **Subtext**: "Berlangganan newsletter kami untuk mendapatkan diskon dan info promo terbaru"
- **Input field**: Email input dengan placeholder "Masukkan email Anda"
- **CTA button**: "Berlangganan" dengan `bg-white text-orange-600 font-bold`
- **Background pattern**: Subtle racing-themed pattern (geometric lines)
- **Floating badge**: "GRATIS" dengan animasi subtle (fade opacity)
- **Responsive**: Stack layout di mobile, inline di desktop

### WCAG Contrast Note:
> **PENTING**: Jangan gunakan `text-white` di atas `bg-orange-500` untuk body text kecil.
> Orange (#F97316) + white text hanya memiliki contrast ratio ~3.0:1 (tidak memenuhi WCAG AA 4.5:1).
> Untuk CTA buttons: gunakan `text-white` hanya untuk `font-bold` large text (minimum 18px).
> Untuk body text: gunakan `text-slate-900` atau `text-orange-950`.

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
| 1 | `tailwind.config.mjs` | Edit | Tambah custom brand color `brand-orange: #FF7800`, fontFamily heading (Rubik) + body (Nunito Sans) |
| 2 | `src/layouts/MainLayout.astro` | Edit | Update Google Fonts import ke Rubik + Nunito Sans |
| 3 | `src/components/PromoBanner.jsx` | Edit | Enhanced carousel |
| 4 | `src/components/YouTubeEmbed.jsx` | **Baru** | Reusable YouTube player (click-to-play) |
| 5 | `src/components/VideoShowcase.jsx` | **Baru** | Video carousel dengan scroll-snap + arrows |
| 6 | `src/components/FeaturedProducts.jsx` | **Baru** | Produk unggulan dari Supabase |
| 7 | `src/components/FlashSaleSection.jsx` | **Baru** | Flash sale + countdown |
| 8 | `src/components/BrandMarquee.jsx` | **Baru** | Brand partner scroll |
| 9 | `src/components/TrustBadges.jsx` | **Baru** | Trust + social proof |
| 10 | `src/components/TestimonialSection.jsx` | **Baru** | Testimoni carousel |
| 11 | `src/components/NewsletterBanner.jsx` | **Baru** | Newsletter CTA |
| 12 | `src/components/StatsCounter.jsx` | **Baru** | Animated counters |
| 13 | `src/pages/index.astro` | Edit | Susun ulang semua section + tambah VideoShowcase |

---

## Catatan Teknis

### Typography
- **Heading font:** Rubik (bold, geometric — cocok untuk racing/automotive theme)
- **Body font:** Nunito Sans (clean, readable — conversion-friendly untuk e-commerce)
- **Fallback:** `fontFamily.sans` dari Tailwind default
- Update di `tailwind.config.mjs` dan `MainLayout.astro` Google Fonts import

### Warna Branding
- Primary: `#FF7800` (custom orange di PWA meta)
- Tailwind: `orange-500` (#f97316) hingga `orange-600` (#ea5800)
- Konsisten gunakan `orange-500` untuk primary actions
- **WCAG Contrast:** Jangan gunakan `text-white` di atas orange untuk body text kecil (contrast ratio ~3.0:1 < 4.5:1 requirement). Gunakan `text-slate-900` atau `text-orange-950` untuk body text.

### Ikon
- Library: `react-icons` (Feather Icons set - `Fi*`)
- **Rule:** Ganti SEMUA emoji dengan ikon React untuk konsistensi
- Konsisten sizing: `w-6 h-6` (24px) untuk semua ikon
- Ikon yang digunakan: `FiDroplet`, `FiCircle`, `FiCPU`, `FiTool`, `FiShield`, `FiCheckCircle`, `FiTruck`, `FiHeadphones`, `FiAward`, `FiStar`, `FiChevronLeft`, `FiChevronRight`, `FiZap`, `FiPlay`

### Cursor Pointer Rule
- **Semua elemen interaktif** wajib memiliki `cursor-pointer`
- Berlaku untuk: card, button, link, tab, badge, carousel navigation
- Tanpa `cursor-pointer`, user tidak akan mengetahui elemen tersebut clickable

### Hover & Interaction Rules
- **Transition timing:** `duration-200` (150-300ms) — hindari instant atau >500ms
- **Hindari `scale` berlebihan:** Jangan gunakan `hover:scale-105` pada card (causes layout shift). Gunakan `hover:shadow-lg` + `hover:border-orange-500` sebagai alternatif
- **Touch devices:** Hover effects tidak work di touch — pastikan semua primary interactions punya `onClick`/`onTap` handler
- **Pattern:** `transition-all duration-200 hover:shadow-lg hover:border-orange-500`

### Focus States (Keyboard Navigation)
- Semua interactive elements harus punya visible focus state
- Gunakan: `focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`
- Berlaku untuk: buttons, links, input fields, tabs
- Wajib untuk accessibility (WCAG 2.1 Level AA)

### prefers-reduced-motion
- Semua animasi harus respect `@media (prefers-reduced-motion: reduce)`
- Animasi yang terpengaruh:
  - StatsCounter: skip counting animation, langsung tampilkan final value
  - PromoBanner: disable auto-advance, hanya manual navigation
  - VideoShowcase: disable smooth scroll, gunakan instant navigation
  - BrandMarquee: pause marquee
  - FlashSale countdown: tetap jalan tanpa visual animation
  - TestimonialSection: disable auto-scroll
- Implementation:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Z-Index Scale
```
z-0:   default content
z-10:  sticky elements (header navbar)
z-20:  floating badges, promo badges
z-30:  modals, overlays, dropdowns
z-50:  toast notifications, WhatsApp button
```

### Section Spacing Standard
- **Section padding:** `py-16 md:py-20 lg:py-24` (64px-96px)
- **Gap antar section:** `space-y-12 md:space-y-16` (48px-64px)
- **Inner content gap:** `gap-6 md:gap-8` (24px-32px)
- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1023px`
- Desktop: `>= 1024px`
- **Mobile-first approach:** Default mobile + `md:` + `lg:` (bukan desktop-first)
- **Test di:** 375px, 768px, 1024px, 1440px

### Image Optimization
- **Lazy loading:** `loading="lazy"` dan `decoding="async"` untuk semua product images
- **Hero/promo images:** Gunakan Astro `<Image>` component untuk auto-optimization
- **Format:** Gunakan WebP jika memungkinkan (via Astro Image)
- **srcset:** Untuk responsive images, gunakan `srcset` dan `sizes` attributes
- **Alt text:** Semua gambar wajib memiliki `alt` text yang deskriptif

### Performance
- Gunakan `client:visible` atau `client:idle` untuk component yang tidak urgent
- Lazy load produk images (`loading="lazy"`)
- Skeleton loading untuk fetch data (animate-pulse placeholder)
- BrandMarquee: Gunakan `transform: translateX()` + `will-change: transform` untuk GPU acceleration
- Hindari animating `left`, `margin-left`, atau `top` (causes layout thrashing)
- Virtualize lists jika melebihi 100 items (react-window / react-virtual)

### Accessibility
- Semua images punya `alt` text
- Form inputs punya labels
- Color bukan satu-satunya indicator (tambahkan teks/ikon)
- `prefers-reduced-motion` dihormati
- Focus states visible untuk keyboard navigation
- WCAG AA contrast ratio minimum 4.5:1 untuk body text

---

## Pre-Delivery Checklist

Sebelum deliver UI code, verifikasi item-item ini:

### Visual Quality
- [ ] Tidak ada emoji yang digunakan sebagai ikon (gunakan SVG: react-icons Fi*)
- [ ] Semua ikon dari konsisten icon set (Feather Icons via react-icons)
- [ ] Hover states tidak menyebabkan layout shift
- [ ] Gunakan theme colors langsung (`bg-orange-500`) bukan var() wrapper
- [ ] `cursor-pointer` pada semua elemen clickable

### Interaction
- [ ] Semua clickable elements punya `cursor-pointer`
- [ ] Hover states memberikan visual feedback yang jelas (shadow, border, color)
- [ ] Transitions smooth (150-300ms, `duration-200`)
- [ ] Focus states visible untuk keyboard navigation (`focus:ring-2`)

### WCAG Compliance
- [ ] Light mode text punya contrast sufficient (4.5:1 minimum)
- [ ] Glass/transparent elements visible di light mode
- [ ] Borders visible di kedua mode
- [ ] `prefers-reduced-motion` dihormati

### Responsive
- [ ] Responsive di 375px, 768px, 1024px, 1440px
- [ ] Tidak ada horizontal scroll di mobile
- [ ] Floating elements punya spacing proper dari edges
- [ ] Tidak ada content yang tersembunyi di belakang fixed navbar

### Accessibility
- [ ] Semua images punya `alt` text
- [ ] Form inputs punya labels
- [ ] Color bukan satu-satunya indicator
- [ ] `prefers-reduced-motion` respected

### Performance
- [ ] Images punya `loading="lazy"` dan `decoding="async"`
- [ ] Skeleton loading untuk async data fetch
- [ ] Marquee menggunakan `transform: translateX()` + `will-change: transform`
- [ ] Component hydration: `client:visible` atau `client:idle`

---

## Status Implementasi

- [x] 1. PromoBanner (Enhanced) ✅
- [x] 2. Hero Section + StatsCounter ✅
- [x] 3. VideoShowcase (YouTube Carousel) ✅
- [x] 4. BrandMarquee ✅
- [x] 5. FeaturedProducts ✅
- [x] 6. FlashSaleSection ✅
- [x] 7. Kategori Produk (Enhanced) ✅
- [x] 8. TrustBadges ✅
- [x] 9. Kenapa Memilih Kami (Enhanced) ✅
- [x] 10. TestimonialSection ✅
- [x] 11. NewsletterBanner ✅
- [x] 12. Typography Update (Rubik + Nunito Sans) ✅
- [x] 13. tailwind.config.mjs Update ✅
- [x] 14. MainLayout.astro Google Fonts Update ✅
