> Catatan historis fase mock. **Status aktif:** service telah diintegrasikan ke REST/MySQL; lihat [React API/database](react-api-database.md). Akun dan penyimpanan demo di bawah hanya referensi pengujian.

# Login dan dashboard React — diizinkan lanjut

Scope yang diizinkan: migrasi login admin dan dashboard sekaligus. CRUD, editor
konten, backend TypeScript/REST dan MySQL belum menjadi tugas ini. Acuan visual:
Pug yang sudah tersedia, docs/dashboard-shell.md dan dashboard-overview.md.
Tidak mengubah aset asli, SCSS Pug, data/backend atau koneksi database.

## Login dan sesi contoh

- Route /login memakai kembali _login.scss, logo, font, token dan Button/LinkButton.
  Desktop dua kolom; mobile mengikuti adaptasi Pug, tanpa shell QC fondasi.
- Akun demo publik: admin@example.test / KindsightDemo1!. Ini kredensial fixture,
  bukan akun/password backend. Validasi HTML required/email/maxlength ditambah
  validasi service; salah login menampilkan error dan menghapus password.
- Show/Hide, status sesi/loading/error/retry dan akun yang sudah login tersedia.
  Login berhasil menuju /dashboard atau returnTo internal dashboard/admin.
  Target eksternal/URL lain ditolak; dinormalisasi dan diperiksa ulang.
- sessionStorage menyimpan marker versi/id/expiry selama 8 jam, per tab. Tidak
  menyimpan password atau token. Refresh mempertahankan marker; tab baru masuk
  sendiri. Belum ada autentikasi server atau enforcement otorisasi backend.
- RequireAdmin melindungi dashboard/admin termasuk route penanda CRUD/CMS.
  Guest diarahkan ke login sambil mempertahankan tujuan/filter. Sign out
  menghapus marker, membatalkan/membersihkan query privat dan menuju login
  dengan status berhasil. Login juga membersihkan data privat sebelum sesi baru.
- Navbar landing memakai query sesi yang sama pada mode default, menampilkan
  identitas contoh yang login dan tautan dashboard. Skenario QC URL lama tetap
  merupakan simulasi identitas saja dan tidak memberikan akses dashboard.

## Dashboard dan interaksi

- Layout pill navigation, toolbar, Total Raised/campaign di kiri, Major Gift/AI
  dan direktori di kanan mengikuti Pug. SVG/foto/crop, token dan SCSS dipakai ulang.
  Foto profil/tim/campaign dekoratif, bukan foto akun/donor sebenarnya.
- Query/service async bertipe terpisah untuk report, campaign dan donor. Report
  mengembalikan summary/trend dari snapshot fixture yang sama. Query key privat
  memuat semua parameter terkait. AbortSignal diteruskan. Tidak ada request API.
- Default showcase Oktober 2026, USD/UTC. from inklusif/to eksklusif; form Through
  inklusif diubah menjadi hari berikutnya. Tanggal kalender valid, urutan benar
  dan maksimum 366 hari. Periode pembanding berdurasi sama tepat sebelum From.
- Parameter URL: from/to, interval=day/month, campaign (picker lifetime), search,
  page. Search baru menghapus page; parameter lain dipertahankan. Back/Forward
  dan refresh memulihkan pilihan. Filter invalid menghasilkan error laporan.
  Page tidak sah menjadi 1; page melampaui hasil menyediakan First page.
- Edit judul/favorit adalah state UI lokal, reset saat meninggalkan route/reload.
  Periode, interval, picker, pencarian dan pagination fungsional. Share menyalin
  URL; fallback menyediakan input readonly bila clipboard gagal. Export JSON
  membawa summary/trend/meta source=sample. Print memakai stylesheet lama;
  cetak fisik tidak diuji. Workspace/settings/notifikasi tetap dialog preview.
- Chart.js mixed bar/line mengikuti tren; tabel alternatif berisi data yang sama.
  Gauge campaign membatasi visual 0–100, label mempertahankan nilai sebenarnya.
  Gauge Major Gift netral. Instance chart dihancurkan pada perubahan/unmount.
  Route dashboard lazy-loaded, sehingga grafik tidak masuk bundle awal landing.
- Menu akun memakai state React; outside/Escape menutup dan listener dibersihkan.
  Dialog reusable memberi initial focus, Escape/backdrop/Close serta return focus.
- Shell tetap tersedia saat query berubah; loading/error/retry ditampilkan per
  bagian. dashboardState=error/empty hanya skenario URL pengujian, tanpa panel QC.

## Definisi fixture dan angka

Fixture terpusat di src/data/dashboard.ts. Hanya received yang tidak diarsipkan
ikut total; pending/cancelled/arsip dikecualikan. Rentang diterapkan pada tanggal
received UTC. Agregasi uang memakai integer sen BigInt, output string desimal;
Number hanya untuk format/grafik. Pembulatan half-up untuk rasio/rata-rata.

- Oktober: total 5250.00, 2 received, 1 donor dikenal unik, 1 donasi anonim,
  rata-rata 2625.00; pembanding 10000.00, growth -47.50%.
- Bucket harian/bulanan kosong berisi nol; bucket bulanan dibatasi rentang.
  Zero baseline menghasilkan growth null, bukan infinity atau growth palsu.
- Campaign lifetime: Education 5000/50000=10%, Community 250/625=40%,
  A New Mission tidak bertarget sehingga persentase null. Periode toolbar tidak
  mengubah lifetime. Query campaign terpisah dari laporan.
- Direktori 12 donor aktif contoh (5 per halaman), bukan ranking prospek.
  Capacity, last gift, engagement belum tersedia. Nama/angka ini bukan data DB.
- Major Gift/forecast/pending ask/AI tetap — dengan dialog alasan. Tidak memakai
  angka ilustrasi Figma sebagai laporan, tidak menghasilkan insight AI palsu.

## Pemeriksaan

- npm run test:frontend: 9 test lulus. Meliputi rekonsiliasi total/tren, status dan
  arsip, batas eksklusif/bucket, zero baseline/target, tanggal/leap day, pagination,
  cancellation/error, marker sesi/expiry/logout dan safe return URL.
- npm run build: strict TS + Vite lulus; bundle awal sekitar 437 kB, dashboard
  terpisah sekitar 206 kB. Tidak menambah dependency atau mengubah backend/DB.
- Browser desktop 1440 (juga pemeriksaan awal 1280), mobile 320: tanpa overflow
  halaman; tabel dan navigasi scroll internal, gambar termuat dan 3 canvas.
- Login salah, password reset, Show/Hide, login sukses, redirect tujuan dengan
  interval/page, refresh sesi/filter, logout/proteksi ulang dan status diuji.
- Campaign 40% dan zero target, interval, page 2/3, search/reset page, periode
  terbalik ditolak, periode November kosong dan lifetime tetap diperiksa.
- Error/retry ketiga resource dan empty state diperiksa. Major Gift/AI dialog,
  Escape/return focus, menu akun Escape, Share dan JSON download diuji.
- Ekspor diperiksa: total 5250.00, USD, 31 titik, source=sample.
- Navigasi SPA landing → akun → dashboard memulihkan 3 canvas tanpa duplikasi.
  Akun navbar mengikuti sesi. Login/dashboard tidak memiliki area QC tambahan.
- Production preview: direct dashboard?interval=month&page=2 → login → tujuan
  semula, refresh berhasil; semua aset dan grafik termuat, satu main, judul benar,
  console tanpa warning/error. Startup lazy-route loading tersedia.
- Screenshot: docs/screenshots/react-login-{desktop,mobile}.jpg dan
  react-dashboard-{desktop,mobile}.jpg.
- Review React Best Practices: hooks tidak kondisional, query/state UI terpisah,
  effect/Chart/listener cleanup, Link/NavLink dan redirect internal, input/label,
  canvas aksesibel dengan tabel, cache privat dibersihkan pada pergantian sesi.

QC: tampilan login, proporsi header/kartu/grafik terhadap acuan, filter dan tabel,
menu akun/logout, serta susunan mobile. Tunggu QC sebelum CRUD/editor.

## Kelanjutan CRUD/CMS

Dashboard sekarang membaca ledger IndexedDB contoh yang sama dengan CRUD, bukan
fixture laporan yang terpisah. Sesi tetap marker per tab; mutasi service memeriksa
sesi. Detail persistensi, invalidasi dan pengujian ada di react-crud-editor.md.
Tidak ada integrasi API/MySQL pada kelanjutan ini.
