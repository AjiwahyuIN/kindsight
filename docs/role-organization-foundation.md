> Status lanjutan: [portal organisasi tugas 2](organization-portal.md) sudah memindahkan halaman ke `/app/*`. Bagian URL transisi di bawah merekam kondisi tugas 1. Role/API/database tetap berlaku.

# Fondasi role dan organisasi — menunggu QC

Implementasi tugas 1 dari `product-flow-access-plan.md`, diizinkan pengguna setelah analisis. Ini fondasi akses data, bukan penyelesaian seluruh portal atau pernyataan siap production.

## Yang sudah diterapkan

- Role `platform_admin` dan `organization_user`, organisasi aktif, principal sesi `{id,name,email,role,organization}`. Hasil `/auth/login` dan `/auth/me` kini memakai `data.user`, bukan `data.admin`.
- Admin lama tetap admin internal, organization null, ID/password tidak berubah. Admin bisa CMS/upload, tidak bisa ledger. Pengguna organisasi hanya bisa ledger organisasinya, tidak bisa CMS/upload atau fungsi admin internal.
- Ledger berada pada `/api/v1/app/{donors,campaigns,donations,dashboard/...}`. Scope berasal dari sesi server, bukan parameter/header/body. Get/count/search/pagination/reference/write/archive/restore/summary/trend/campaign lifetime semuanya dibatasi organization_id. Record lintas organisasi menghasilkan 404; relasi tidak tersedia 409; role salah 403; tanpa sesi 401.
- Endpoint ledger global `/api/v1/admin/{donors,campaigns,donations,dashboard/...}` tidak lagi dimount. Org user ditolak guard 403, platform admin menerima 404. Tidak ada bypass melalui Pug. Endpoint CMS React dan legacy tetap ada dan memerlukan platform_admin. Adapter auth Pug mempertahankan kontrak `admin` hanya untuk admin internal; Pug bukan portal organisasi baru.
- Akun/organisasi yang nonaktif tidak bisa login/akses API. Validasi sesi membaca status terbaru; permintaan autentikasi membersihkan sesi akun/organisasi nonaktif. Token yang telah dicabut tidak kembali valid ketika organisasi diaktifkan ulang. Kelak endpoint nonaktif harus mencabut sesi pada saat perubahan status juga; UI pengelolaan akun belum dibuat.
- Cookie/Origin/header mutasi/rate limit/password hash tetap. Uang USD string, periode UTC, histori/arsip/revisi dan ilustrasi desain dipertahankan.

## Migrasi dan data

Migrasi **004-organizations** sudah diterapkan saat API dihentikan untuk maintenance. Migrasi 001–003 tidak diubah. Tabel organizations ditambahkan; tabel akun legacy admins diperluas role/organization_id; donor/campaign/donasi memiliki organization_id wajib, FK dan indeks scoped. Relasi donor/campaign donasi juga dibatasi FK komposit agar tidak bisa silang tenant melalui SQL.

Data ledger lama dipindahkan kepemilikannya secara eksplisit ke **Kindsight Showcase**, ID `40000000-0000-4000-8000-000000000001`. Bukan berdasarkan teks profil donor.organization. Kolom bisnis, ID dan password tidak di-reset/reseed. Data tambahan yang dibuat pengguna ketika QC juga ikut dipertahankan; jangan memakai jumlah seed awal sebagai asumsi jumlah record saat ini. Konten website tetap global untuk platform.

Migrasi dapat diulang; `db:migrate` berikutnya menghasilkan applied 0. `db:check`/readiness mensyaratkan 004. Seed instalasi kosong disesuaikan mengisi organization_id, tetapi seed tidak dijalankan ulang pada database pengguna.

## React dan route pada tahap ini

**URL halaman belum dipindahkan ke `/app/*`.** Ini sengaja menunggu tugas portal berikutnya. Sementara:

| Akun | Route aktif |
| --- | --- |
| Publik | `/` |
| Keduanya | `/login`, satu sesi aktif per browser |
| Pengguna organisasi | `/dashboard`, `/admin/donors`, `/admin/campaigns`, `/admin/donations` (URL transisi) |
| Admin internal | `/admin` → `/admin/content/navbar`, `/admin/content/:section` |

Guard role frontend sudah terpisah; salah role menampilkan akses ditolak dan tautan ke workspace yang benar. Login dan returnTo hanya menuju ruang yang sesuai role. Login pengguna/CMS tetap memakai desain yang ada; navbar/akun dan header hanya menawarkan menu yang berhak diakses. Admin tidak diarahkan ke fundraising. Dashboard/user CRUD tidak menampilkan tautan editor.

Query privat berawalan `['private',userId,organizationId|'platform',...]`. Pergantian identitas menghapus cache privat; guard mengunci subtree dengan identitas sehingga draft tidak berpindah akun. Login/logout lintas tab memakai event sesi terpisah dari event perubahan data. 401 menghapus data privat dan memeriksa ulang sesi. Invalidation mutasi mencakup referensi, ledger dan dashboard.

Layout khusus `/app`, login admin terpisah, overview admin, permintaan demo nyata, pengelolaan organisasi/user melalui UI serta penggantian menu workspace preview belum masuk tugas ini. Tidak ada role switcher atau registrasi publik. `/foundation` masih utilitas development sampai tahap rilis.

## Akun QC lokal

Admin internal: gunakan akun/password lokal lama. Pengguna organisasi: **team@kindsight.local**, password yang dihasilkan tersedia di `.organization-credentials.local` (file 0600, diabaikan Git). Tidak ditampilkan di UI/log/dokumen. File `.admin-credentials.local` tetap untuk akun admin lama bila dahulu dibuat oleh provisioning.

```sh
npm run db:migrate
npm run db:check
npm run dev:api
# Terminal lain
npm run dev
# Hanya jika akun organisasi lokal belum tersedia:
npm run organization:create-user
```

CLI organisasi hanya menambahkan akun ke organisasi aktif yang sudah ada. Menjalankan ulang tidak mengubah password/role akun yang sudah ada. Opsional env `ORGANIZATION_ID`, `ORGANIZATION_USER_EMAIL`, `ORGANIZATION_USER_NAME`, `ORGANIZATION_USER_PASSWORD`; tidak membuat organisasi baru atau mengirim email. Akun QC diberi akses ke data showcase lokal untuk menguji fungsi yang sama, bukan akun publik produksi.

## Verifikasi

- Total **50 pengujian**: 13 unit backend, 19 frontend/mock+returnTo, 16 integrasi backend, 1 isolasi organisasi, 1 service React REST/MySQL.
- Isolasi dua organisasi sementara: daftar/count/pagination/search/detail/CRUD/arsip/pulihkan/report, pemalsuan scope, referensi lintas tenant, constraint database, role admin/org, endpoint legacy, deactivation dan token revoke. Semua fixture dibersihkan.
- Integrasi React dipisahkan memakai akun organisasi untuk ledger dan akun platform untuk CMS/upload. Tidak memberi satu akun kedua jenis akses agar test lolos.
- Browser desktop: login org menampilkan ledger lama; editor ditolak juga setelah refresh; logout membersihkan tab CRUD lain; login admin lama menuju CMS tanpa menu fundraising; draft CMS yang belum disimpan hilang saat logout dari tab lain; login org dengan returnTo CMS kembali ke dashboard.
- Build React/TypeScript dan Pug diperiksa. Override mobile masih terbaca 1280 px saat diminta 390 px; mobile aktual belum dapat dinyatakan lulus, perlu QC manual.

## QC dan tugas berikutnya

Uji login kedua akun bergantian, akses URL area yang salah, CRUD/report organisasi, CMS admin, refresh/filter dan logout lintas tab. Gunakan browser/profile berbeda bila ingin dua akun aktif bersamaan; satu browser sengaja hanya memiliki satu sesi.

Setelah QC: tugas 2 menyelesaikan route `/app/*`, alias URL lama dan navigasi portal organisasi. Tugas 3 memisahkan pengalaman admin internal. Jangan sekaligus mengimplementasikan demo/payment/billing/AI. Belum siap production: aktivasi/reset akun, pengelolaan akses UI, audit, mobile aktual, backup/restore dan deployment tetap tahapan berikutnya.
