# Difference React — diizinkan lanjut

Pengguna mengizinkan melanjutkan setelah Logo Partners. Buka
http://127.0.0.1:5176/#difference. About belum dimigrasikan.

## Implementasi dan acuan

- Memakai ulang _difference.scss, _accordion.scss, token/font, SVG grid/fade,
  ikon community dan Insight. Struktur serta copy mengikuti Pug yang sudah QC.
- Fixture bertipe di src/data/difference.ts, kontrak DifferenceContent, service
  asynchronous contoh, dan hook Query dengan key landing/difference/skenario.
  Tidak menyambungkan CMS/API/upload/MySQL atau mengubah backend/legacy.
- Komponen reusable Accordion menggunakan React state: awalnya panel pertama
  terbuka; satu panel terbuka atau semuanya tertutup. Tombol native mendukung
  Enter/Space; ArrowUp/Down berputar, Home/End memindahkan fokus tanpa membuka.
  useId menghubungkan aria-controls dan aria-labelledby secara unik.
- Ilustrasi Insight memakai figure berlabel, detail dekoratif aria-hidden.
  Angka 12/19/17/23 tetap contoh marketing; tidak dihitung dari donasi.
  Copy panel kedua/ketiga tetap contoh lama karena desain hanya memperlihatkan
  isi panel pertama. Tidak ada definisi bisnis baru.
- Mobile mengikuti adaptasi Pug: judul membungkus, label di bawah, accordion dan
  ilustrasi satu kolom. Tidak mengasumsikan desain mobile tambahan.
- State loading/empty/error/retry ditampilkan per section; shell tetap tersedia.
  Kontrol QC sementara memakai ?differenceState=empty/error; default success.
  Pilihan bertahan setelah refresh. Retry skenario error sengaja tetap gagal.

## Pemeriksaan

- npm run build lulus strict TypeScript + Vite; tanpa dependency tambahan.
- Desktop 1440 dan mobile 320: dua kolom/satu kolom sesuai breakpoint, SVG
  termuat dan tidak ada horizontal overflow. Tombol mobile minimal 72 px.
- Klik, Enter/Space, single-open, tutup semua, ArrowUp/Down, Home/End diuji.
  Hidden panel tidak masuk accessibility tree; fokus tetap di trigger.
- Error/retry, empty dan refresh URL empty diperiksa; service tidak fallback
  diam-diam ke konten default. Navigasi fondasi dan Back merender tiga item lagi.
- Production preview: semua SVG termuat, pergantian panel benar, satu panel
  terbuka. Console mobile setelah navigasi tidak memiliki error/warning.
- React review: hooks tidak kondisional, state accordion lokal, query terpusat,
  id aksesibel stabil; tanpa listener global atau controller DOM legacy.
- Screenshot: docs/screenshots/react-difference-desktop.jpg dan
  react-difference-mobile.jpg.

QC pengguna: heading/spacing/grid, accordion, ilustrasi dan susunan mobile.
Tunggu QC sebelum About.

Pengguna mengizinkan melanjutkan seluruh section landing tersisa tanpa jeda QC; hasil gabungan tercatat di [Landing tersisa](react-landing-remaining.md).
