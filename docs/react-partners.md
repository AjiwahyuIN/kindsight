# Logo Partners React — sudah QC

Hero telah diterima pengguna. Tugas ini hanya memigrasikan Logo Partners.
Buka http://127.0.0.1:5176/#partners. Difference belum dimigrasikan.

## Implementasi

- Memakai ulang lima SVG lokal, crop/geometri logo, token dan _partners.scss
  dari versi Pug yang telah lolos QC. Tidak mengganti desain atau aset.
- Fixture terpusat di src/data/partners.ts, kontrak PartnerLogo bertipe,
  service asynchronous contoh dan TanStack Query. Key mencakup skenario dan
  pilihan jumlah logo. Tidak mengakses API, CMS, upload atau MySQL lama.
- Carousel infinity berupa set React berulang, tanpa cloneNode atau controller
  DOM legacy. Jarak mencakup gap terakhir; jumlah set minimal dua, atau
  ceil(lebar viewport / lebar set) + 1 agar satu logo pun memenuhi lintasan.
  Kecepatan mengikuti legacy 28 px/detik; kedua sisi memakai blur/gradient 5 px.
- Pause/resume memakai state lokal dan tombol aksesibel aria-pressed. Hover
  desktop dan section keluar viewport juga menghentikan animasi. ResizeObserver,
  IntersectionObserver dan listener media query dibersihkan saat unmount.
- Salinan dekoratif aria-hidden/inert; hanya lima logo asli dibaca screen reader.
  Reduced motion mengikuti OS, menghentikan animasi, menyembunyikan duplikat,
  dan menyediakan scroll horizontal dengan keyboard. Kontrol pause disembunyikan.
- Mobile mempertahankan adaptasi Pug: tinggi section 128 px (desktop 146 px),
  slot/gap responsif dan tombol 44 px. Tidak mengasumsikan desain mobile baru.

## Kontrol QC

Kontrol berada di area QC sementara setelah section, bukan fitur CMS.
URL mempertahankan pilihan setelah refresh:

- partnersState=empty/error: status kosong/error dan retry; default success.
- partnersCount=single: satu logo untuk menguji kontinuitas; default semua.
- partnersMotion=reduce: simulasi reduced motion; tidak menimpa preferensi OS.

Loading, empty, error/retry dan success ditangani per section, tanpa menutup shell.
Retry pada skenario error tetap gagal secara sengaja sampai skenario dipulihkan.

## Pemeriksaan

- npm run build lulus (strict TypeScript + Vite); tidak menambah dependency.
- Desktop 1440 dan mobile 320 tanpa overflow halaman; semua SVG termuat.
- Loop, pause/resume lewat mouse/Space, hover pause, offscreen pause diperiksa.
- Satu logo: track tetap lebih panjang dari viewport pada desktop/mobile.
- Reduced motion: animation none, satu set terlihat, viewport dapat difokuskan,
  ArrowRight menggeser logo. Preferensi sistem pengguna tidak diubah.
- Empty/error/retry/pemulihan dan URL setelah refresh diperiksa.
- Production preview: logo termuat, kedua blur 5 px dan pause berfungsi.
  Console desktop tanpa error/warning.
- Screenshot: docs/screenshots/react-partners-desktop.jpg dan react-partners-mobile.jpg.

QC pengguna: ukuran/jarak logo, loop infinity, blur kiri/kanan, pause/resume dan
susunan mobile. Tunggu QC sebelum Difference.

Pengguna mengizinkan melanjutkan ke Difference; Partners menjadi acuan yang diterima.
