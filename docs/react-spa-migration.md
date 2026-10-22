# Migrasi React SPA — keputusan aktif

**Arah produk terbaru:** software fundraising untuk organisasi. [Rencana pemisahan flow dan hak akses](product-flow-access-plan.md) membedakan temuan runtime dari usulan route/role/organisasi; fondasi akses telah diimplementasikan pada [status role/organisasi](role-organization-foundation.md); [portal /app/* sudah tersedia](organization-portal.md); admin internal lengkap menyusul.

**Status terbaru:** seluruh landing, login, dashboard, CRUD dan editor telah dimigrasikan. Service aktif sudah REST/MySQL lokal; [cakupan API/database dan QC](react-api-database.md). Catatan fondasi/mock di bawah merekam urutan migrasi sebelumnya dan bukan konfigurasi runtime saat ini.

Disetujui pengguna 20 Oktober 2026. Keputusan ini menggantikan frontend Pug dan
Vanilla JavaScript untuk pekerjaan baru. Workflow tetap satu section per tugas,
verifikasi desktop/mobile/interaksi/build, lalu tunggu QC.

## Batas fase fondasi

React + Vite + TypeScript, React Router (createBrowserRouter), QueryClient,
font/token/global style, Container, Button/LinkButton, StatusMessage, route 404,
error boundary dan halaman QC fondasi. Tidak memigrasikan section landing,
login, dashboard, CRUD atau editor dalam tugas fondasi. Tidak mengubah backend,
memulai/mengubah koneksi MySQL, migration, seed atau file upload lama.

React port 5176 dan Pug port 5175 dipisahkan agar versi yang sudah di-QC tetap
tersedia. Pada fase fondasi dahulu `/api` dibatasi JSON 503. Setelah fase API diizinkan, dev/preview mem-proxy `/api` ke Express 3101; kegagalan koneksi tetap JSON 503.
Entry utama index.html sekarang React. Konfigurasi Pug tersimpan di
vite.legacy.config.js, memakai legacy.html dan output dist-legacy agar build
React tidak menimpa acuan Pug. Setelah seluruh pengganti lolos QC, jalur Pug
beserta dependency-nya dapat dihapus, dengan tetap menjaga impor backend lama.

## Baseline dan status sebelumnya

Arsip lokal sebelum perubahan: migration-baselines.local/pug-before-react-2026-10-20.tar.gz.
Mencakup kode frontend, shared, token, aset, dependency/config dan dokumen QC.
Tidak berisi node_modules, dist, .env, kredensial, database atau upload pengguna.

- Landing: fondasi, Navbar, Hero, Partners, Difference, About, Solutions versi
  awal yang dipulihkan, dan Testimonials sudah lolos QC. Missions/Sectors/Footer
  telah dibangun; catatan lama masih menyebut QC gabungan belum ditutup eksplisit.
- Login dan CRUD donor/campaign/donasi sudah lolos QC. Dashboard header/filter,
  summary/tren/campaign/direktori donor sudah dibangun; revisi lanjutan ditunda.
- CMS Navbar/Footer/Hero/Partners/upload/Difference sudah tersedia dan diterima
  dalam kelanjutan percakapan. Editor About belum dibangun.
- Referensi visual ada di docs/pug-reference.md, docs/screenshots dan SOURCES.md
  tiap folder aset. Desain mobile sebagian besar adaptasi; pertahankan hasilnya.

## Routing

| Route | Status aktif |
| --- | --- |
| / | Seluruh section landing React (Navbar sampai Footer), tanpa area QC |
| /foundation | QC font, token, button, async query dan state |
| /login | Form dan sesi admin contoh lokal |
| /dashboard | Dashboard React dengan data contoh; memerlukan sesi contoh |
| /admin/donors | CRUD donor lokal, terlindungi sesi contoh |
| /admin/campaigns | CRUD campaign lokal, terlindungi sesi contoh |
| /admin/donations | CRUD donasi lokal, terlindungi sesi contoh |
| /admin/content/:section | Editor seluruh section landing Navbar–Footer |
| * | 404; section editor tidak dikenal juga 404 |

URL lama foundation.html/login.html/dashboard.html diarahkan tanpa reload ke
route bersih. admin.html?view=donations menjadi /admin/donations; content.html?section=hero
menjadi /admin/content/hero. Query lain dan hash tetap dibawa. Alias tetap ditangani SPA tanpa reload; section/entity tidak dikenal menampilkan 404.
Navigasi internal memakai Link/NavLink/Navigate. Shell tetap terpasang saat route
berubah. Fokus konten dan anchor ditangani setelah navigasi; perubahan search
params tidak memindahkan fokus input. Judul dokumen mengikuti halaman.

## Data dan state

- QueryClient dibuat sekali, staleTime awal 60 detik. Data contoh melalui service
  async bertipe, query key mencakup domain/parameter. Tidak ada request API fase ini.
- Contoh kontrak berada di services/types.ts; nominal uang tetap string desimal.
  Implementasi service contoh dapat diganti REST tanpa mengubah kontrak komponen.
- QC palette memakai URL ?scenario=empty atau ?scenario=error. Refresh/Back/Forward
  mempertahankan skenario; Data tersedia memulihkan state normal. Coba lagi
  mengulang service yang sama (skenario error tetap gagal secara sengaja).
- Penghitung tombol memakai React state lokal, bukan Query. Tidak disimpan setelah
  unmount/refresh. Loading/empty/error/success diperlihatkan juga sebagai contoh UI.
- Tahap tabel nanti memakai URL untuk search/filter/page/pageSize; perubahan filter
  reset page. Summary/tren memakai filter konsisten; campaign progress tetap lifetime.
- Mutasi donasi menginvalidasi daftar/detail, summary, tren dan campaign; perubahan
  donor/campaign juga pilihan relasi serta laporan terkait. CMS memperbarui editor
  dan query section publik; upload menginvalidasi katalog; logout membersihkan cache privat.
- Cache bukan salinan draft editor. Draft form tetap lokal; revisi konflik server
  dipertahankan ketika REST diintegrasikan nanti. Jangan fallback diam-diam ke mock.

## Reuse dan dependency

Pertahankan Inter Tight lokal, token CSS variables, SCSS BEM, aset dan crop desain.
Pug mixin menjadi komponen props; controller DOM lama ditulis ulang sebagai
handler/state React. Chart.js memakai ref/effect dan destroy saat unmount;
observer/listener juga wajib cleanup. Tidak menjalankan script DOM lama di React.

Ditambah: react/react-dom/react-router/@tanstack/react-query; development:
typescript, @types/react, @types/react-dom, @types/node, @vitejs/plugin-react.
Sass, Fontsource dan Chart.js tetap. Pug/plugin Pug hanya untuk jalur referensi.
Backend JS dan file src/scripts/data/shared tetap karena diimpor server/seeds/test.
Tidak menambahkan Redux/PWA/SSR/library komponen/ORM/form framework.

## Urutan setelah QC fondasi

1. Urutan terbaru: Navbar (sudah QC), Footer (sudah QC), Hero (sudah QC), Partners (sudah QC), lalu Difference,
   About, Solutions, Testimonials, Missions, Sectors: satu tugas per section, tunggu QC masing-masing.
2. Login contoh dan shell admin. Selanjutnya dashboard per bagian: header/filter,
   summary/tren, campaign, tabel.
3. CRUD donor, campaign, donasi; kemudian CMS satu section per tugas beserta upload.
4. Uji route/refresh/Back/Forward dan visual keseluruhan; bersihkan frontend lama
   setelah penggantinya lolos QC.
5. Fase backend terpisah: Express TypeScript dan integrasi REST/MySQL lokal,
   mempertahankan aturan USD, anonim, arsip dan definisi angka yang disetujui.

Flow donate tetap ditunda. Angka marketing/ilustrasi dan scoring/AI/Major Gift
belum otomatis menjadi angka keuangan aktual.

## Hasil verifikasi fondasi

- `npm run build` lulus: strict TypeScript dan build Vite satu entry React.
- `npm run build:legacy` lulus; dev Pug port 5175 dan preview Pug 5181 dapat
  menampilkan landing yang sama (bukan markup <pug> mentah).
- Browser React desktop 1440 dan mobile 320: Inter Tight 400/500/600, token,
  button variants/disabled, Tab/focus, penghitung lokal, tanpa horizontal overflow.
- Skenario success/empty/error, retry dan pemulihan diperiksa. Query URL bertahan
  setelah refresh dan dipulihkan Back/Forward. State tombol tetap saat query
  berubah tanpa reload dokumen. Link progres/fondasi dan anchor fokus berfungsi.
- 404 umum serta section editor tidak dikenal diperiksa. Alias admin.html dengan
  view=donations&page=2#records menjadi /admin/donations?page=2#records.
- Production preview React 5180: direct URL foundation?scenario=empty dan refresh
  tetap menampilkan empty state. Route admin bertingkat mengembalikan entry SPA.
- Dev dan preview: /api/v1/health menghasilkan JSON 503 API_NOT_CONNECTED;
  /assets/missing-logo.svg menghasilkan 404, keduanya bukan HTML SPA.
- Tidak menambah/mengubah backend, migrasi, seed, koneksi atau data MySQL. Tidak
  menjalankan ulang test integrasi database dalam fase frontend ini.
- Screenshot: docs/screenshots/react-foundation-desktop.jpg dan
  react-foundation-mobile.jpg. Desktop/mobile memakai adaptasi fondasi sebelumnya.
- Tinjauan React Best Practices: hooks tidak kondisional, query key memuat
  parameter, client dibuat sekali, state lokal tidak diduplikasi dalam Query,
  navigasi memakai Link/NavLink, label field/disabled/fokus native dipertahankan,
  effect frame dibersihkan. Tidak menambahkan memo/context global yang belum perlu.

SHA-256 baseline lokal:
61b9dd3060b998dd07d0b08541c2cbed1dd49cf3018b71db6c1d9ce887b82d05.

**Fondasi, Navbar, Footer, Hero dan Partners React telah diterima pengguna.
Difference diizinkan lanjut. Atas instruksi terbaru, About, Solutions,
Testimonials, Missions dan Sectors diselesaikan bersama dan telah diterima pengguna;
lihat [Landing tersisa](react-landing-remaining.md). Seluruh section landing
tersedia. Login/dashboard telah dimigrasikan pada tugas berikutnya; CRUD dan CMS kemudian dimigrasikan dengan persistensi contoh lokal.**

Instruksi tugas terbaru mengizinkan seluruh section landing tersisa diselesaikan tanpa jeda QC per section. Pekerjaan berikutnya kembali mengikuti scope/QC yang ditentukan pengguna.

## Pembersihan setelah QC landing

Seluruh section diterima pengguna. Area QC, kontrol skenario, progres migrasi,
link fondasi serta catatan mode data contoh di landing dihapus. LandingPage
menggantikan MigrationPage; komponen PreviewControls yang tidak dipakai dihapus.
Sectors sekarang langsung diikuti Footer. /foundation tetap utilitas terpisah;
state loading/empty/error dan service contoh tetap tersedia di komponen.
Browser desktop/mobile 320: tidak ada QC/spa-shell di landing, tidak ada overflow,
Footer tepat setelah main. npm run build lulus. Screenshot react-landing-clean-
desktop.jpg dan react-landing-clean-mobile.jpg.

## Migrasi login/dashboard

Pengguna mengizinkan login dan dashboard sekaligus. Keduanya selesai dan
menunggu QC; lihat [scope dan pemeriksaan](react-login-dashboard.md).
Chart.js dan style dashboard dimuat lewat lazy route agar landing tidak
mengunduh bundle grafik di awal. Startup lazy route memiliki fallback loading.
Root layout menghindari shell fondasi pada login/dashboard, dengan satu main.
Backend, MySQL, Pug dan service JS lama tetap dipertahankan tanpa integrasi baru.

## CRUD dan editor section

Pengguna mengizinkan kedua bagian diselesaikan bersama. CRUD donor/campaign/
donasi dan editor 10 section telah tersedia; lihat [hasil/verifikasi](react-crud-editor.md).
Persistensi memakai IndexedDB demo per origin; service async dan kontrak tetap
dapat diganti REST. Tidak menambah backend, dependency, koneksi atau migrasi DB.
Rute admin memakai shell sendiri, satu main, Link/NavLink dan guard sesi contoh.
Halaman CRUD/editor lazy-loaded. Menunggu QC sebelum fase integrasi backend.

## Admin internal dengan API aktif

Tugas 3 memisahkan /admin/login dan /admin/overview dari portal organisasi, dengan navigasi CMS dan metadata operasional MySQL. Lihat [status dan QC](internal-admin.md); keputusan ini menggantikan tujuan login admin lama pada catatan migrasi historis di atas.
