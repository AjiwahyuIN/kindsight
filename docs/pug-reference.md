> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Kindsight

Fondasi frontend dengan Pug, Vite, SCSS (BEM), dan Vanilla JavaScript.
Navbar, Hero, Logo Partners, Kindsight Difference, dan About telah lolos QC.
Solutions dan Testimonial telah lolos QC. Missions, Sectors, dan Footer menunggu QC bersama.
Frontend landing dihentikan pada kondisi saat ini sesuai instruksi pengguna. Fondasi backend dan database lokal sudah diimplementasikan. Login admin telah lolos QC. CRUD donor/campaign/donasi telah lolos QC. API laporan dashboard sudah tersedia. Integrasi konten dan tampilan dashboard penuh belum diimplementasikan.

Rancangan Phase 3 (login admin, CRUD, database, dan API): [docs/phase-3-plan.md](phase-3-plan.md).

## Menjalankan

Gunakan Node.js `^20.19.0` atau `>=22.12.0`.

```sh
npm ci
npm run dev
```

- `/` menampilkan Navbar, Hero, Logo Partners, Kindsight Difference, About, Solutions, Testimonial, Missions, Sectors, dan Footer.
- `/foundation.html` adalah halaman QC font, warna, container, dan button.

```sh
npm run build
npm run preview
```

Build menghasilkan kedua entry HTML beserta aset lokal di `dist/`.

## Struktur

```text
src/
  pages/                 # Halaman Pug
  templates/
    layouts/             # Dokumen dasar
    mixins/              # Komponen Pug reusable
    components/          # Section reusable, dimulai dari Navbar
  scripts/
    components/          # Perilaku Navbar
    data/                # Data contoh navigasi terpusat
    services/            # Akses data async dan simulasi demo lokal
  styles/
    tokens/              # Warna, typography, spacing, radius, shadow
    base/                # Reset dan global style
    components/          # Container dan button
    pages/               # Style khusus halaman QC
```

Pug di HTML entry dikompilasi sebelum Vite memproses script dan aset.
Gunakan `extends` untuk layout dan `include`/mixin untuk komponen.
Saat menambahkan komponen, pasangkan mixin Pug dengan partial SCSS BEM;
buat modul JavaScript komponen hanya jika membutuhkan perilaku.

Contoh:

```pug
include ../templates/mixins/button.pug

+button('Simpan', { variant: 'primary', type: 'submit' })
+button('Lihat detail', { href: '/detail.html', variant: 'outline' })
+button('Tidak tersedia')(disabled)
```

Button mendukung `primary`, `dark`, `light`, `outline`; ukuran `md` dan `sm`.
Gunakan atribut native melalui `&attributes`, misalnya `disabled`, `aria-label`,
atau `data-*`. Link memakai `href`; disabled hanya berlaku pada native button.

## Keputusan fondasi

- Font Inter Tight variable, subset Latin, dibundel lokal melalui Fontsource;
  weight desain: 400, 500, 600. Tidak memerlukan request Google Fonts saat runtime.
- Token diekstrak dari Figma karena file tidak mempunyai published variables/styles.
- Container 1320px dan gutter desktop 60px mengikuti landing 1440px.
- Gutter layar kecil 20px, breakpoint 768px, focus/hover/disabled dan reduced motion
  adalah default implementasi; desain responsive/state belum tersedia di Figma.
- Token `--color-text-secondary` mempertahankan abu-abu desain. Halaman QC memakai
  `--color-text-muted` untuk teks penjelas yang lebih terbaca.
- Navbar membaca konten MySQL melalui `services/navigation.js` dan API landing.
  Editor tersedia di `/content.html?section=navbar`; komponen tetap memakai service.
- Chart.js, API, Express, dan MySQL belum dipasang pada tahap fondasi.

Referensi tooling: [Vite](https://vite.dev/guide/),
[vite-plugin-pug](https://github.com/SubZtep/vite-plugin-pug),
[Fontsource](https://fontsource.org/docs/getting-started/install).

## Navbar: batas scope dan asumsi

- Referensi desktop: node Figma `675:1233` (1440 × 117). Logo, caret, dan ikon akun
  adalah SVG asli yang dibundel lokal; wordmark memakai Inter Tight Regular 32px.
- Pembacaan Figma terbaru meminta autentikasi ulang. Implementasi menggunakan
  snapshot lengkap node yang sama dari analisis sebelumnya pada percakapan ini.
- Desain mobile dan dropdown terbuka tidak tersedia. Di bawah 1120px digunakan
  hamburger, submenu accordion, serta CTA dan akun di dalam menu. Breakpoint ini
  menjaga agar navigasi tidak berhimpitan pada ukuran tablet.
- Who we Serve, Product, Resources dan ikon akun membuka disclosure. Satu submenu
  terbuka setiap saat. Klik di luar, pindah fokus, Escape, dan perubahan breakpoint
  menutup menu dengan pengembalian fokus yang sesuai.
- Company dan pilihan submenu mengikuti konten CMS: tujuan terisi menjadi tautan,
  sedangkan tujuan kosong membuka preview. Menu akun membaca sesi admin aktif,
  menampilkan nama/email aktual dan tombol **Go to dashboard**; pengunjung mendapat
  **Sign in**. Sesi diperiksa kembali setiap menu akun dibuka.
- Get a Demo membuka form lokal dengan validasi native. Submit hanya menampilkan
  pengakuan simulasi; tidak mengirim request, menyimpan data, atau membuat backend.
- Dialog menggunakan native modal: fokus dibatasi oleh browser, Escape/Close/
  backdrop menutupnya. Nilai form direset ketika dialog ditutup/dibuka kembali.
- Semua tujuan menu, akun, dan alur demo masih perlu keputusan bisnis sebelum
  integrasi API.

## Hero: referensi, interaksi, dan asumsi

- Sesuai instruksi pengguna, Hero dikerjakan dari hasil analisis sebelumnya saat
  Figma MCP meminta autentikasi ulang. Headline, copy, CTA, posisi utama desktop,
  dan komposisi preview mengikuti referensi tersebut; detail preview dashboard
  direkonstruksi sebagai ilustrasi HTML/SCSS, bukan halaman dashboard fungsional.
- Avatar dan SVG grafik/ikon berasal dari URL aset yang sudah dikembalikan Figma
  pada analisis sebelumnya. Semua aset dibundel lokal; screenshot desain tidak
  digunakan sebagai aset implementasi.
- `data/hero.js` menyediakan konten awal Pug dan ilustrasi. Runtime mengambil copy,
  label CTA, serta 1–6 slide Overview dari MySQL melalui `services/landing.js`.
  Angka ilustrasi tetap contoh tampilan, bukan hasil perhitungan bisnis.
- Request a Demo menggunakan dialog yang sama dengan Navbar. Perubahan Navbar
  hanya mengekspos callback demo dan menjaga fokus kembali ke pemicu Hero;
  template serta style Navbar yang sudah lolos QC tidak diubah.
- Video overview belum disediakan. Watch Overview membuka dialog berisi
  slide dari editor dengan Previous, Next, dan Done; keterbatasan video
  disebutkan di dialog. Escape, Close, dan backdrop menutup dialog.
- Desain mobile tidak tersedia: ukuran font adaptif, CTA ditumpuk di bawah 480px,
  preview tetap proporsional sebagai ilustrasi, dan seluruh Hero bebas scroll
  horizontal. Detail preview tidak menjadi kontrol interaktif.
- Copy Hero telah terhubung ke API landing dan editor MySQL; form demo masih preview.

## Logo Partners

- Lima organisasi mengikuti analisis node `675:1258`. Karena Figma meminta
  autentikasi ulang, aset berasal dari sumber brand/arsip logo yang dicatat di
  `src/assets/partners/SOURCES.md`; varian logo perlu diperiksa saat QC.
- Section desktop 146px; mobile 128px merupakan adaptasi karena tidak ada desain
  mobile. Logo bergerak ke kiri 28px/detik, linear, dengan loop satu set penuh.
- Salinan visual ditambah sesuai lebar viewport agar tidak ada area kosong,
  termasuk pada layar lebar. Salinan tidak dibacakan ulang oleh screen reader.
- Kedua sisi menggunakan gradient fade dan backdrop blur. Hover pada track
  menjeda gerak; tombol pause/resume juga dapat dipakai lewat keyboard.
- Reduced motion mengubah carousel menjadi baris statis yang bisa digeser;
  animasi juga dijeda ketika section berada di luar viewport.
- Contoh data terpusat di `data/partners.js`, diakses melalui service async.
  Tidak ada tautan logo atau klaim bisnis baru yang diasumsikan.
- Navbar dan Hero yang sudah lolos QC tidak diubah. Logo Partners sudah lolos QC.

## Kindsight Difference

- Referensi: node `675:1351`, tepat setelah Logo Partners. Implementasi memakai
  respons Figma lengkap dan screenshot landing yang diambil pada analisis awal,
  sesuai instruksi pengguna. Pembacaan MCP terbaru masih meminta autentikasi ulang.
- Aset SVG asli (grid, fade, ikon accordion, dan ikon Insight) diunduh dari URL
  respons tersebut dan dibundel lokal. Path SVG serta dimensi aslinya dipertahankan.
- Heading, label, judul tiga accordion, paragraf pertama, dan angka Insight
  mengikuti desain. Paragraf kedua/ketiga adalah contoh karena state terbukanya
  tidak ditampilkan di Figma; perlu konten final.
- Data terpusat di `data/difference.js`; service async `getDifferenceContent()`
  memasok konten runtime. Data yang sama dipakai sebagai locals Pug saat build.
- Mixin Pug dan controller accordion dapat digunakan kembali. Satu panel dapat
  terbuka; klik ulang menutupnya. Enter/Space mengaktifkan tombol, Tab berpindah
  fokus; Arrow Up/Down, Home, dan End memberi navigasi tambahan.
- Ilustrasi Insight tetap berisi contoh 12, 19, 17, 23 pada semua panel. Tidak ada
  perhitungan, klaim data aktual, atau perubahan angka yang diasumsikan.
- Mobile merupakan adaptasi: header disusun vertikal; accordion dan ilustrasi
  ditumpuk di bawah 768px. Heading dan padding mengecil sesuai ruang.
- Section sebelumnya yang sudah lolos QC dipertahankan. Kindsight Difference
  sudah lolos QC.

## About

- Referensi: node `675:1423` (desktop 1440 × 666), setelah Kindsight Difference.
  Menggunakan respons Figma lengkap serta screenshot landing dari analisis awal;
  pembacaan ulang MCP masih meminta autentikasi.
- Header terpusat, label About, deskripsi, tiga kartu, dan SVG grid/fade mengikuti
  referensi. Aset asli dibundel lokal; sumber dan slot dicatat di
  `src/assets/about/SOURCES.md`. Token `--color-text-subtle` ditambahkan untuk
  warna label statistik `#B6B6B6` dari desain; token lama tetap sama.
- Mixin `statCard` dan style BEM `stat-card` dapat dipakai kembali. Statistik
  berupa description list, bukan tombol atau tautan. Tidak ada kontrol/animasi
  angka yang ditambahkan karena desain bersifat informatif.
- `data/about.js` menjadi sumber konten Pug dan service async `getAboutContent()`.
  Konten runtime mengisi heading, deskripsi, label, dan nilai melalui service;
  konten hasil build tetap tersedia bila service gagal.
- `3,000+`, `$8B+`, dan `20+` adalah contoh klaim pemasaran dari desain, bukan
  hasil query dashboard. Mata uang, periode/cakupan funds raised, definisi
  organisasi yang didukung, dan asal klaim pengalaman masih perlu konfirmasi
  bisnis sebelum data aktual/integrasi backend.
- Mobile belum tersedia di Figma. Adaptasi: font/padding mengecil dan kartu
  ditumpuk satu kolom di bawah 768px. Desktop/tablet memakai tiga kolom.
- Navbar, Hero, Logo Partners, dan Difference yang lolos QC dipertahankan.
  About sudah lolos QC.

## Solutions

- Referensi: node `675:1453` (desktop 1440 × 800), setelah About. Menggunakan
  respons Figma lengkap dan screenshot landing dari analisis awal. Pembacaan
  MCP terbaru masih meminta autentikasi. Semua aset asli dibundel lokal dan
  dicatat di `src/assets/solutions/SOURCES.md`.
- Layout desktop: Fundraising Platform dengan foto dan badge, diikuti kartu
  Ascend dan iWave. Typo “incredibe” pada heading diperbaiki menjadi “incredible”.
- `solutionCard` merupakan mixin reusable dengan varian featured. Tombol memakai
  komponen button yang tersedia. Hanya Fundraising Platform menampilkan foto
  dan Learn More. Ascend/iWave adalah kartu informasi tanpa state hover.
- Data terpusat di `data/solutions.js`; service async `getSolutionsContent()`
  memasok konten serta URL aset yang dibundel. Pug merender contoh awal yang sama.
- Learn More membuka native dialog berisi contoh overview lokal. Konten detail
  dan tujuan halaman produk belum ditentukan, sehingga tidak ada route, API,
  atau formulir tambahan yang diasumsikan. Badge “12 Hidden Gems / prospect”
  mengikuti ilustrasi desain; bukan jumlah prospek aktual atau hasil perhitungan.
- Dialog ditutup melalui Close, Escape, atau klik backdrop. Fokus kembali ke
  Learn More setelah ditutup; browser mengelola modal dan fokus di dalamnya.
- Responsive adalah adaptasi: di bawah 1280px featured berada di baris sendiri
  dengan dua kartu sekunder di bawah; di bawah 768px bagian
  teks/foto featured ditumpuk. Ukuran heading dan padding ikut menyesuaikan.
- Semua komponen section sebelumnya yang sudah lolos QC dipertahankan.
  Solutions versi awal telah lolos QC. Section selanjutnya menunggu QC masing-masing.

## Testimonial

- Referensi: node `675:1525` (1440 × 840). Memakai respons Figma lengkap dan
  screenshot landing dari analisis awal karena MCP terbaru meminta autentikasi.
  Section sebelumnya, termasuk Solutions versi awal, dipertahankan.
- Panel gelap, ornamen, crop foto, rating, kutipan, dan posisi desktop mengikuti
  desain. PNG/SVG asli dibundel lokal; slot dicatat di
  `src/assets/testimonial/SOURCES.md`. Jarak sebelum section mengikuti spacer
  56px; dekorasi spacer di luar node Testimonial tidak ditambahkan.
- Hanya satu cerita lengkap tersedia dalam referensi. Data contoh berisi cerita
  itu dan dua cerita tambahan berlabel “Sample story” dengan nama tim contoh.
  Foto tambahan bersifat ilustratif; bukan atribusi testimonial/endorsement nyata.
- Penghitung mengikuti jumlah data (01/03), bukan mengasumsikan sembilan cerita
  dari indikator 01/09. Rating dan periode tetap merupakan contoh desain; sumber
  ulasan serta konten final perlu persetujuan sebelum integrasi data aktual.
- Typo “Here what” dan “Realy” diperbaiki menjadi “Hear what” dan “Really”.
- Pug dan service async `getTestimonials()` memakai sumber terpusat
  `data/testimonial.js`. Prev/Next memperbarui foto, nama, rating, periode, kutipan,
  caption, penghitung, dan pengumuman screen reader. Tidak ada autoplay.
- Tombol berhenti pada batas pertama/terakhir. Enter/Space memakai perilaku
  native; Arrow Left/Right, Home/End tersedia ketika fokus berada pada kontrol.
  Ketika tombol menjadi disabled di batas, fokus pindah ke tombol yang aktif.
- Mobile/tablet merupakan adaptasi karena tidak ada desain responsive: konten
  ditumpuk, foto/teks diperkecil, dan kontrol tetap berukuran sentuh 44px.
- Pada kegagalan service, cerita awal tetap terbaca dan navigasi dinonaktifkan.
  Testimonial sudah lolos QC; Missions sampai Footer diizinkan untuk dikerjakan bersama.


## Missions, Sectors, dan Footer

- Berdasarkan konteks desain asli yang tersimpan dari analisis: Missions `675:1586`,
  Sectors `675:1639`, Footer `675:1707`. MCP masih meminta reautentikasi;
  aset asli berhasil diambil dari URL konteks sebelumnya.
- Sumber konten terpusat `src/scripts/data/landing-end.js`, dimuat Pug melalui
  Vite dan digunakan service async `getLandingEndContent()`. Backend belum dibuat.
- Missions mempertahankan foto, dua benefit, dan ilustrasi SVG 97+/54%.
  Makna bisnis, periode, serta rumus New Giving Velocity belum dikonfirmasi.
- Sectors mempertahankan tiga layout berbeda, termasuk posisi berselang Healthcare
  dan Education. Tombol membuka preview sektor, tanpa mengubah layout kartu.
  Donasi $11,400.97, 198 Volunteer, dan 52% adalah angka desain; target, mata uang,
  periode, serta hubungan antar angka belum didefinisikan. Panjang bar mengikuti
  proporsi visual desain (57.3%); label 52% tidak dianggap sebagai rumus bar.
- Newsletter memakai validasi email native dan service simulasi `previewNewsletter()`;
  tidak menyimpan email atau membuat subscription. Link footer yang belum punya
  tujuan membuka dialog preview; About dan produk yang tersedia memakai anchor lokal.
- Copy Moneed di footer disesuaikan menjadi Kindsight; ejaan Healthcare,
  Integrations, dan Permission diperbaiki. Tahun 2025 mengikuti contoh desain,
  bukan ketetapan bisnis. Label Case Sheets perlu dikonfirmasi.
- Desain mobile tidak tersedia dalam konteks tersimpan. Adaptasi: Missions
  bertumpuk; Sectors satu kolom pada mobile dan dua kartu ringkas pada tablet;
  navigasi footer dua kolom di mobile. Angka dekoratif 02/03 disembunyikan di mobile.
- Ketiga bagian menunggu QC bersama sesuai instruksi terakhir pengguna.

- Verifikasi: build Vite berhasil; pemeriksaan browser pada lebar 320, 390, 768,
  1280, dan 1440 px tanpa overflow horizontal; aset termuat. Dialog sektor/footer,
  Escape dan pengembalian fokus, anchor About, serta validasi email kosong/salah
  dan hasil simulasi newsletter sudah diperiksa. Production preview juga diuji.


## Fondasi backend lokal

Panduan: [docs/backend-foundation.md](backend-foundation.md).
Gunakan `npm run start:api` atau `npm run dev:api` untuk menjalankan Express
(default port 3101). Vite meneruskan `/api` ke backend sesuai `API_PORT` di .env.
Navbar, Footer, copy Hero dan daftar Partners kini menggunakan API/MySQL. Section landing lainnya masih
menggunakan data contoh terpusat.

Desain dashboard tetap mengacu pada hasil analisis Figma node `675:1767`.
Perubahan model data tidak mengubah acuan layout, komponen, atau gaya grafiknya.


## Login admin

Buka `/login.html`. Panduan akun lokal, endpoint, dan QC: [docs/admin-login.md](admin-login.md).
Kredensial acak berada di `.admin-credentials.local` (diabaikan Git).
`npm run admin:create` membuat akun sekali; tidak mereset akun yang sudah ada.
Uji autentikasi MySQL: `npm run test:auth`.


## CRUD admin

Setelah login, pilih **Open management** atau buka `/admin.html`.
Tiga tab tersedia untuk donor, campaign dan donasi dengan search, pagination, validasi,
arsip/pulihkan dan penyimpanan MySQL. Panduan: [docs/admin-crud.md](admin-crud.md).
Uji integrasi: `npm run test:crud`. Dashboard utama mengikuti Figma dan dikerjakan bertahap.


## API dashboard

Ringkasan periode, tren harian/bulanan, dan progres lifetime campaign tersedia melalui
`/api/v1/admin/dashboard/*` dengan sesi admin. Definisi filter/angka dan hasil verifikasi:
[docs/dashboard-api.md](dashboard-api.md). Service frontend sudah disiapkan;
tampilan dashboard Figma dikerjakan per bagian setelah tahap API.
Jalankan `npm run test:dashboard` untuk pengujian integrasi laporan.

## Dashboard

Buka `/dashboard.html` atau pilih **Open dashboard** setelah login. Header, navigasi,
toolbar, Total Raised, tren Chart.js, dan progres lifetime campaign menggunakan API
lokal. Major Gift, forecast/pending dan AI memakai state belum tersedia. Tabel
menampilkan direktori donor aktual, belum pemeringkatan prospek.
Panduan: [header/toolbar](dashboard-shell.md) dan [kartu/grafik/tabel](dashboard-overview.md).

## Editor Navbar, Footer, Hero, dan Partners

Setelah login, pilih **Edit landing content** atau buka `/content.html`.
Editor mengelola teks serta tambah/urutkan/hapus tautan, dengan validasi URL,
reset perubahan, dan pemeriksaan revisi sebelum menyimpan. **Save and publish**
langsung menerbitkan konten ke MySQL; refresh landing untuk melihat hasilnya.
Hero tersedia pada `/content.html?section=hero`: social proof, judul/highlight,
deskripsi, label tombol dan slide Overview. Newsletter/demo masih simulasi lokal;
flow donasi pengguna ditunda sesuai instruksi.
Partners tersedia pada `/content.html?section=partners`: pilih 1–5 logo dari katalog
aset lokal, edit nama/alt text dan atur urutannya. Upload logo baru belum termasuk.
Panduan endpoint, batas scope dan QC: [docs/landing-editor.md](landing-editor.md).
Uji integrasi: `npm run test:content`.
