# Landing React tersisa — sudah QC

Pengguna mengizinkan menyelesaikan semua section landing yang tersisa dalam satu
tugas. Scope: About, Solutions, Testimonials, Missions dan Sectors. Navbar,
Hero, Partners, Difference dan Footer tetap tersedia. Buka http://127.0.0.1:5176/.
Login, dashboard, CRUD dan CMS belum dimigrasikan. Backend/MySQL tidak disentuh.

## Acuan dan reuse

Seluruh section menggunakan markup setara Pug, SCSS BEM, font/token, grid/fade,
SVG dan foto lokal yang sama. Tidak menghapus kode/aset Pug atau dependency.
Mobile mengikuti adaptasi Pug yang sudah tersedia, bukan desain mobile baru.

- About: heading/description, tiga StatCard reusable dalam dl. Statistik
  3,000+/$8B+/20+ tetap angka marketing, bukan agregasi donasi.
- Solutions: tiga card versi awal yang dipulihkan. Platform featured dengan
  foto/badge, Ascend dan iWave berbeda tanpa tambahan hover featured. Attribute
  data-solution tetap dipertahankan untuk batas lebar deskripsi iWave.
  Learn More membuka overview contoh, bukan halaman produk atau API baru.
- Testimonials: tiga cerita lama; cerita pertama dari desain, dua lainnya
  contoh yang diberi label. Foto yang sama tetap dipakai. Tidak autoplay.
  Previous/Next dibatasi; ArrowLeft/Right/Home/End, announcement dan pengembalian
  fokus ke tombol aktif didukung. Fokus dilakukan setelah render agar tombol
  tujuan sudah enabled. Tidak mengubah preferensi sistem pengguna.
- Missions: manfaat, foto, dan ilustrasi gauge asli. Angka 97+/54% tetap contoh.
  Figure memberi label ilustrasi; detail gauge dekoratif aria-hidden. Tidak
  memakai Chart.js karena grafik ini ilustrasi statis, bukan laporan interaktif.
- Sectors: Nonprofits featured, Healthcare dan Education dengan susunan desktop
  awal. Explore/Learn More membuka preview masing-masing; Close/Escape/backdrop
  memakai Dialog reusable dengan initial focus dan return focus. Nominal,
  volunteer, persentase dan panjang progress bar tetap ilustrasi desain.

## Data dan komponen

Fixture bertipe dipisahkan per section di src/data. Kontrak ada di
src/services/landing-sections-types.ts. Masing-masing domain mempunyai service
async mock, adapter export, query key dan hook TanStack Query. Tidak mengimpor
controller DOM legacy atau memanggil API lama; service dapat diganti REST nanti.

UI state lokal: indeks testimonial dan snapshot isi dialog Solutions/Sectors.
Data query tidak disalin menjadi draft global. Snapshot menjaga isi dialog
jika query berubah ketika dialog terbuka. Dialog melakukan cleanup saat unmount.
Komponen bersama: StatCard, SolutionCard, HeadingLines, GridBackground,
SectionLabel, EndBackground dan SectionDataState; Button/Dialog tetap digunakan.

QC sementara tetap berada setelah section landing dan sebelum Footer seperti
alur migrasi sebelumnya. Pilihan success/empty/error per section menggunakan:
aboutState, solutionsState, testimonialsState, missionsState, sectorsState.
Empty/error disimpan pada URL; default success menghapus parameter. Semua
section memiliki pending/empty/error/retry dan tampilan sukses. Retry pada
skenario error tetap gagal sengaja sampai skenario dipulihkan. Shell tidak
tertutup loading seluruh halaman. Tidak ada mutasi backend pada tugas ini.

## Pemeriksaan

- npm run build lulus strict TypeScript + Vite setelah perubahan terakhir.
- Desktop 1440: About tiga statistik, Solutions tiga card dengan featured lebih
  lebar, Sectors tiga kolom. Screenshot tiap section disimpan.
- Mobile 320: semua grid utama satu kolom, foto dan gauge tetap termuat; tidak
  ada horizontal overflow. Testimonial, Missions dan Sectors diperiksa visual.
  Dialog Solutions lebar 280 px dan masuk viewport 860 px; dialog sektor 282 px.
- Dialog Solutions: buka, Escape dan fokus kembali ke CTA. Sectors: ketiga
  konten dialog benar, Close/Escape dan fokus kembali; mobile Education diuji.
- Testimonial: Next, batas terakhir, Home/End, fokus setelah batas dan ArrowRight
  mobile diuji; count/nama/quote konsisten dan announcement tersedia.
- Success/error/retry/empty/pemulihan diperiksa untuk kelima domain melalui UI.
- Production preview: direct URL sectorsState=empty#sectors dan refresh tetap
  empty. Pemulihan, dialog Solutions/Nonprofits dan Next testimonial berfungsi.
  Semua aset lima section termuat, satu main dan satu h1; console tanpa warning/error.
- Review React: hooks tidak kondisional, query keys lengkap, service async bertipe,
  state UI lokal, label dialog unik, tidak menambah listener global atau menjalankan
  controller DOM lama. Tidak ada dependency, backend atau database baru.
- Screenshot: docs/screenshots/react-{about,solutions,testimonials,missions,sectors}-{desktop,mobile}.jpg.

QC gabungan: spacing antar section, crop foto, Solutions versi awal, carousel,
dialog, serta susunan mobile. Tunggu instruksi sebelum migrasi login/dashboard.

## Revisi setelah QC

Pengguna menerima hasil dan meminta menghapus area di luar desain. Area QC
sementara beserta kontrolnya dan catatan migrasi landing telah dihapus; Sectors
langsung diikuti Footer. Bukti browser/build terbaru ada di react-spa-migration.md.
