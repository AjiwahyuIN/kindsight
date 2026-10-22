# Hero React — sudah QC

Footer React telah diterima pengguna; migrasi dilanjutkan ke Hero saja.
Buka http://127.0.0.1:5176/. Navbar, Hero, area QC dan Footer sudah tersedia;
section landing berikutnya belum dimigrasikan. Tidak ada integrasi backend/MySQL.

## Acuan dan implementasi

- Social proof, avatar, heading/highlight, deskripsi, dua CTA dan ilustrasi
  dashboard mengikuti Pug yang sudah lolos QC. Menggunakan kembali _hero.scss,
  _dashboard-preview.scss, font/token dan SVG/PNG asli tanpa modifikasi aset.
- Hero berada di main full width, di luar Container QC: margin tepi 8 px dan
  preview maksimal 1120 px. Container konten Hero tetap berasal dari SCSS lama.
  Route selain landing mempertahankan layout sebelumnya; main tetap tunggal.
- Data copy/Overview bertipe di src/data/hero.ts dan services/hero-types.ts;
  service async contoh dan hook TanStack Query memakai query key dengan skenario.
  Kontrol QC ?heroState=empty/error menguji empty/error/retry; default success
  dihapus dari URL. Skenario tetap setelah refresh, tanpa request API.
- Ilustrasi dipisah dari HeroContent menjadi HeroIllustration statis. Profil,
  total, forecast, AI, grafik, tanggal dan prospek adalah contoh desain, bukan
  identitas sesi/login atau laporan aktual. Figure memiliki label aksesibel;
  detail ilustrasinya aria-hidden dan tidak berisi kontrol yang dapat difokuskan.
- Chart.js tidak diperlukan untuk ilustrasi statis: CSS/SVG lama dipertahankan,
  termasuk skala container dan crop. Grafik dashboard fungsional menjadi tugas
  tersendiri. Tidak ada angka bisnis baru yang diasumsikan.

## Interaksi

Request a Demo memakai dialog Navbar yang sama melalui handle UI lokal di
layout/Outlet context. Tidak menduplikasi form, service atau mutation. Tombol
Hero mengembalikan fokus ke CTA Hero; pemicu Navbar mobile tetap kembali ke
hamburger. Form tetap preview lokal, tidak mengirim/menyimpan permintaan.
Button dasar ditambah slot endIcon agar urutan label/caret mengikuti Pug.

Watch Overview membuka dialog native melalui komponen Dialog yang sudah ada.
Tiga slide memakai React state; dibuka ulang mulai slide pertama. Previous
nonaktif di awal, Next menjadi Done di akhir. Saat Previous kembali ke awal,
fokus berpindah ke Next agar tidak tertinggal pada tombol disabled. Close,
Escape dan backdrop didukung; fokus kembali ke Watch Overview. Snapshot slide
saat dialog dibuka mempertahankan isinya apabila query berubah di latar belakang.
Video belum tersedia dan keterbatasan tersebut dijelaskan di dialog.

## Mobile dan pemeriksaan

Adaptasi mobile sama dengan Pug: heading responsif, CTA ditumpuk di bawah 480 px,
ukuran/padding mengecil, dan ilustrasi tetap proporsional. Tidak ada desain mobile
baru atau perubahan susunan yang diasumsikan.

- npm run build lulus: strict TypeScript + Vite. Tidak ada dependency baru,
  perubahan Pug/aset/SCSS legacy/backend/schema/seed atau test database.
- Desktop 1440: lebar Hero 1424 px, preview 1120 px; semua aset termuat.
- Mobile 320: CTA column, preview 272 px, dialog Overview 280 px. Tidak ada
  horizontal overflow pada desktop maupun mobile. Ilustrasi tidak punya kontrol.
- Overview: 01/03, Next/Previous, batas pertama, 03/03/Done, Close/Escape,
  reset saat dibuka ulang dan pengembalian fokus diperiksa.
- Demo dari Hero berhasil hingga hasil lokal. Fokus kembali ke Request a Demo
  pada mobile; demo Navbar mobile tetap kembali ke Open navigation.
- Error/retry, empty, pemulihan dan refresh heroState=empty diperiksa.
- Navigasi SPA ke fondasi dan Back, satu main landmark, serta anchor/fokus Footer
  diperiksa setelah penyesuaian layout. Navbar/Footer tidak diganti desainnya.
- Production preview: semua aset termuat, padding CTA 14px 22px, preview 1120px,
  dan Overview Next berjalan. Console desktop tanpa error/warning.
- Screenshot: docs/screenshots/react-hero-desktop.jpg dan react-hero-mobile.jpg.
- Review React: hooks tidak kondisional; data server contoh dikelola Query,
  state dialog/slide lokal; handle UI scoped ke Navbar; refs/effect Dialog dan
  fokus layout memakai cleanup. Tidak ada listener/global state baru atau script
  DOM legacy di subtree React.

QC pengguna: headline/highlight, spacing/avatar, tombol, ukuran/crop ilustrasi,
Overview dan demo, serta susunan mobile. Tunggu QC sebelum Logo Partners.

Hero telah diterima pengguna. Migrasi dilanjutkan ke Logo Partners; lihat [Partners React](react-partners.md).
