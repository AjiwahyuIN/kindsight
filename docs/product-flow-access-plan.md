# Pemisahan flow Kindsight — rencana bertahap

**Status terbaru:** pengguna mengizinkan kelola akun setelah bagian organisasi. Tugas 5b sudah diterapkan dan menunggu QC; [detail aktual](user-management.md). Aktivasi/reset/delivery production masih tahap berikut. Analisis awal di bawah bersifat historis.

## Arah produk dan batas tugas

Kindsight diposisikan sebagai **produk software fundraising untuk organisasi**. Website publik memasarkan produk dan menerima permintaan demo. Portal organisasi menyediakan pencatatan fundraising; admin internal mengelola platform dan website. Arah website donasi langsung tidak dilanjutkan pada scope ini.

Dokumen ini memetakan implementasi yang ada dan mengusulkan urutan perubahan. Analisis awal ini tidak mengubah kode; implementasi tugas 1 berikutnya tercatat pada dokumen status di atas. Status integrasi sebelumnya tidak otomatis dianggap sudah lolos QC atau siap production.

Baseline showcase: satu organisasi contoh pada UI, dua peran akun, satu akun hanya terikat ke satu organisasi. Pengujian isolasi wajib memakai organisasi kedua terisolasi. Tidak perlu registrasi mandiri, pemilih organisasi, role builder, subscription, pembayaran atau portal donor pada tahap awal. Semuanya usulan implementasi, bukan fitur yang ditemukan di desain.

## Temuan dari kode saat ini

| Temuan | Bukti kode | Implikasi |
| --- | --- | --- |
| Satu guard untuk seluruh ruang kerja | `src/app/router.tsx`, `src/components/auth/RequireAdmin.tsx` | Login yang sama membuka dashboard, CRUD dan CMS; belum ada peran pengguna organisasi |
| Menu operasional dan editorial bercampur | `src/components/admin/AdminLayout.tsx`, `src/components/dashboard/DashboardHeader.tsx` | Fundraising dan editor landing berada dalam menu akun yang sama |
| Akun publik selalu diperlakukan sebagai admin | `src/components/landing/Navbar.tsx`, `src/services/auth-types.ts` | Belum ada tujuan login/dashboard berdasarkan peran |
| Sesi hanya mengembalikan id/name/email | `server/routes/auth.js`, `server/repositories/auth.js` | Tidak ada role maupun organisasi pada principal sesi |
| Semua endpoint privat di bawah `/api/v1/admin` | `server/app.js` | Middleware hanya memeriksa admin aktif, bukan izin fitur dan pemilik data |
| Donor/campaign/donasi tidak memiliki organization_id | `server/db/migrations/001-initial.js` | Semua ledger saat ini bersifat global untuk instalasi lokal |
| Query record, relasi dan laporan belum dibatasi organisasi | `server/repositories/fundraising.js`, `server/repositories/dashboard.js` | Mengganti URL saja tidak membatasi akses data organisasi |
| `donors.organization` adalah teks profil donor | `server/db/migrations/001-initial.js` | Bukan pemilik tenant dan tidak boleh dipakai sebagai organization_id |
| Tabel demo_requests sudah tersedia | `server/db/migrations/001-initial.js` | Penyimpanan bisa dipakai; form publik saat ini tetap preview, bukan submit API |
| Model akun/sesi legacy sudah berfungsi | `admins`, `sessions`, provisioning admin lama | Password, ID dan histori harus dipertahankan; tidak perlu reset |
| Elemen dashboard tertentu masih preview | `DashboardHeader.tsx`, dokumen integrasi | Workspace, settings, notifikasi, AI/scoring belum menjadi fitur produksi |
| Fondasi/dev shell masih tersedia | `src/layouts/AppLayout.tsx` | `/foundation` bukan halaman produk untuk rilis; shell generik/404 perlu ditinjau |

Tampilan landing, termasuk Hero, Solutions versi awal, dan dashboard yang sudah QC tetap menjadi baseline. Tidak perlu mengubah brand/token/komposisi kartu agar mengikuti pembagian peran.

## Peran dan batas akses yang diusulkan

Pengunjung bukan akun. Akun memiliki dua role tetap: `organization_user` dan `platform_admin`.

| Kemampuan | Pengunjung | Pengguna organisasi | Admin internal |
| --- | --- | --- | --- |
| Membaca landing/konten terbit | Ya | Ya | Ya |
| Mengirim permintaan demo | Ya | Ya, sebagai pengunjung | Ya, sebagai pengunjung |
| Membaca dashboard fundraising | Tidak | Organisasinya sendiri | Tidak pada versi awal |
| CRUD donor/campaign/donasi, arsip/pulihkan | Tidak | Organisasinya sendiri | Tidak pada versi awal |
| Membaca referensi, hasil pencarian, ekspor laporan | Tidak | Organisasinya sendiri | Tidak pada versi awal |
| Edit/publikasi landing dan upload logo website | Tidak | Tidak | Ya |
| Membaca/memperbarui status permintaan demo | Tidak | Tidak | Ya |
| Mengelola organisasi dan akun akses | Tidak | Tidak | Ya, fitur dasar bertahap |
| Mengganti peran atau organisasi dirinya melalui form profil | Tidak | Tidak | Tidak |

Admin internal tidak otomatis mendapat akses ke ledger seluruh pelanggan. Akses dukungan/impersonasi dan dashboard agregat lintas organisasi tidak termasuk rencana awal. Jika kelak dibutuhkan, tentukan izin dan pencatatan aksesnya secara terpisah.

## Flow dan menu

### Website publik

Alur: landing → Request a Demo → form validasi → API menyimpan permintaan → konfirmasi penerimaan. Konfirmasi tidak mengklaim demo sudah dijadwalkan atau email terkirim. Status awal `new`; status admin tetap `new`, `contacted`, `closed` sesuai model yang ada.

Menu publik mempertahankan Who we Serve, Product, Company, Resources dan CTA demo. Area akun menjadi akses portal: guest melihat Sign in; pengguna organisasi melihat Open workspace; admin internal melihat Admin console. Identitas hanya ditampilkan setelah sesi diperiksa. Tidak menampilkan menu CRUD/CMS campuran. Gunakan ruang/ikon akun yang ada; label final di-QC saat implementasi navbar.

### Portal organisasi

Alur: Sign in → validasi sesi/peran/organisasi aktif → dashboard organisasi → donor/campaign/donasi → simpan → tabel, statistik, grafik dan pilihan relasi diperbarui. Donasi adalah pencatatan oleh staf, bukan pembayaran pengunjung.

Menu portal: Dashboard, Donors, Campaigns, Donations; identitas akun dan organisasi, tautan website publik, logout. Header/gaya dashboard dan form yang sudah diterima dipakai kembali. Ikon workspace lama dipetakan ke fitur nyata jika semantiknya sesuai dan diberi label aksesibel; menu preview yang belum punya fungsi ditunda atau disembunyikan, tidak diberi alur palsu.

Tidak ada Landing content, Demo requests, Organizations atau Users di portal organisasi. Identitas organisasi tidak diganti melalui URL atau body request.

### Admin internal

Alur demo: admin login → daftar permintaan → tinjau → ubah status → jika disepakati, siapkan organisasi/akun secara eksplisit. Submit demo tidak otomatis membuat akun atau memberi akses.

Menu admin: Overview, Demo requests, Landing content, Organizations, Users, logout. Overview menampilkan metrik operasional yang benar-benar tersedia, misalnya jumlah permintaan demo; tidak menyalin angka fundraising pelanggan. Menu baru hanya ditampilkan saat fiturnya sudah berfungsi.

Editor 10 section dan upload Partners tetap memakai UI yang ada. Organisasi dapat dinonaktifkan tanpa menghapus ledger; akses pengguna terkait berhenti. Akun pengguna dapat dinonaktifkan tanpa menghapus donor atau histori donasi.

### Pemberian akses awal

Showcase memakai provisioning akun lokal eksplisit terlebih dahulu; tidak perlu berpura-pura mengirim undangan email. Jangan mengirim password melalui URL, UI daftar akun atau log. Tidak ada perubahan password admin lama. Sebelum production, alur undangan/aktivasi, pengaturan password, pemulihan akun dan pengiriman email harus dirancang serta diuji; ini pekerjaan terpisah yang belum tersedia.

## Peta route target

| Route | Pemilik/fungsi |
| --- | --- |
| `/` dan anchor landing | Publik, tetap |
| `/login` | Pintu login pengguna organisasi |
| `/app` | Redirect ke `/app/dashboard` |
| `/app/dashboard` | Dashboard organisasi |
| `/app/donors`, `/app/campaigns`, `/app/donations` | CRUD organisasi |
| `/admin/login` | Pintu login admin internal |
| `/admin` | Redirect ke `/admin/overview` |
| `/admin/overview` | Ringkasan pengelolaan platform |
| `/admin/demo-requests` | Permintaan demo |
| `/admin/content/:section` | Editor website, route lama dipertahankan |
| `/admin/organizations`, `/admin/users` | Pengelolaan akses dasar, tahap berikutnya |

Satu sistem sesi, satu akun aktif per browser pada versi awal; tidak perlu dua sistem autentikasi atau subdomain. Dua halaman login membedakan tujuan/penjelasan, bukan menciptakan izin dari input pengguna. Role yang sah berasal dari server. Akun yang sudah masuk lewat pintu berbeda mendapat penjelasan dan tautan ke ruang kerjanya; tidak otomatis dinaikkan perannya.

Guest yang membuka route privat diarahkan ke pintu login sesuai area dan menyimpan `returnTo` internal. Setelah login, tujuan diperiksa lagi terhadap role; tujuan tidak diizinkan diarahkan ke home role dengan pesan. Sesi aktif tetapi role salah menghasilkan halaman akses ditolak dengan jalan kembali. Gangguan API menampilkan error/retry, tidak diperlakukan sebagai guest. Sesi kedaluwarsa menghapus data privat dan kembali ke login sesuai area.

### Alias dan transisi

| Route lama | Perlakuan setelah pengganti tersedia |
| --- | --- |
| `/dashboard`, `/dashboard.html` | Redirect ke `/app/dashboard`, tetap melewati izin organisasi |
| `/admin/donors`, `/admin/campaigns`, `/admin/donations` | Redirect ke `/app/...`, tetap melewati izin organisasi |
| `/admin.html?view=...` | Validasi entity, teruskan filter ke `/app/...` |
| `/content.html?section=...` | Validasi section, teruskan ke `/admin/content/...` |
| `/login.html` | Redirect ke `/login`; halaman menyediakan tautan admin login |
| `/foundation`, `/foundation.html` | Utilitas development; tidak tersedia pada build production yang akan dirilis |

Pertahankan filter/search/page/hash pada redirect yang valid. Alias bukan jalur bypass role. Route tidak dikenal tetap 404. SPA fallback tetap mengecualikan API/aset.

## API, sesi dan kepemilikan data

Namespace usulan:

| API | Otorisasi |
| --- | --- |
| `/api/v1/auth/*` | Sesi bersama; login/logout mempertahankan proteksi yang ada |
| `/api/v1/content/*`, GET katalog/file logo | Konten publik terbit, tidak mengandung data organisasi |
| POST `/api/v1/demo-requests` | Form publik, validasi/rate limit; respons minimal tanpa mengekspos daftar |
| `/api/v1/app/donors`, `/campaigns`, `/donations`, `/dashboard/*` | Role organization_user dan organisasi aktif |
| `/api/v1/admin/content/*`, upload logo | Role platform_admin |
| `/api/v1/admin/demo-requests`, `/organizations`, `/users`, `/overview` | Role platform_admin; endpoint dibuat per tahap |

`/auth/me` dan hasil login nantinya mengembalikan `user: {id,name,email,role,organization: {id,name} | null}`. Kontrak `AdminAccount` menjadi `SessionUser`. Gunakan guard sesi dan guard role terpisah; backend memeriksa status akun/organisasi pada setiap request. Jangan mempercayai role/org yang disimpan di browser atau payload mutasi.

Semua operasi organisasi harus mengambil organization_id dari principal server: list/count/pagination, detail ID, referensi relasi, create/update/archive/restore, summary/trend/campaign lifetime dan ekspor. Request tidak boleh memilih tenant melalui search param, header atau body. Referensi donor/campaign harus berada di organisasi yang sama, termasuk saat relasi historis diarsipkan. Record milik organisasi lain diperlakukan 404; role yang tidak berhak 403; tanpa sesi 401.

Endpoint CRUD/dashboard legacy harus ditutup atau dijadikan alias ke handler yang menerapkan pemeriksaan organisasi yang sama. Jangan membiarkan handler lama dengan query global tetap tersedia bagi akun organisasi. Middleware pada endpoint CMS/upload lama juga harus memeriksa role admin internal, termasuk endpoint Pug.

Cookie HttpOnly/SameSite, Origin/header mutasi, rate limit login, query parameter terikat SQL, validasi input, If-Match/revisi konflik, dan aturan uang USD/UTC tetap dipertahankan. Tidak perlu JWT/localStorage token.

Query privat nantinya menyertakan identitas dan organisasi, misalnya `['private', userId, organizationId, 'fundraising', ...]`; query admin memakai scope admin. Cache dibatalkan/dihapus saat logout, akun berubah, organisasi dinonaktifkan atau sesi berakhir, termasuk tab lain. Invalidation setelah mutasi tetap mencakup ledger, relasi, statistik dan grafik dalam scope yang sama. Draft lama tidak boleh muncul pada akun berikutnya.

## Usulan perubahan database tanpa reset

Tetap gunakan MySQL/mysql2 dan migrasi tambahan; jangan mengedit migrasi 001–003.

1. Tambahkan `organizations` dengan id, name, active dan timestamps.
2. Untuk perubahan awal yang sederhana, perluas tabel akun **legacy `admins`** dengan role tetap dan organization_id nullable. Nama tabel ini merupakan detail kompatibilitas; model/session/UI menyebut user. Akun lama tetap platform_admin dengan organization_id null, ID/password hash tidak berubah. Akun organization_user wajib punya organisasi; platform_admin tidak memiliki tenant. Gunakan constraint dan validasi server. Tidak perlu menduplikasi kredensial ke tabel users baru atau membuat dua login backend.
3. Tambahkan organization_id pada donors/campaigns/donations. Backfill data lama ke satu organisasi showcase yang ditetapkan eksplisit pada migrasi; **jangan** menebak dari teks donor.organization atau demo_requests.organization.
4. Lakukan penambahan kolom → backfill → validasi tidak ada orphan/relasi lintas organisasi → constraint NOT NULL/FK dan indeks organisasi. Tambahkan constraint relasi komposit agar donor/campaign yang ditautkan donasi berada pada organisasi yang sama; donor/campaign nullable tetap mendukung anonymous/general giving. Pertahankan ID, nominal, timestamps, archive dan revision lama.
5. CMS, logo, demo_requests dan newsletter adalah data platform, bukan ledger organisasi. Tabel sesi tetap merujuk ID akun yang sama. Periksa role/status dari database pada tiap request, bukan salinan role yang bisa usang di sesi. Saat organisasi/akun dinonaktifkan, sesi terkait dicabut.

Migrasi backfill hanya boleh dijalankan bersama penerapan pembatasan query/backend. Gunakan jendela maintenance untuk perubahan schema/backfill yang tidak atomik; aplikasi harus menolak operasi tenant jika scope belum siap, bukan memakai data global sebagai fallback. Rencana ini belum menjalankan migrasi atau membuat akun baru.

## Urutan eksekusi dan gerbang QC

| Tugas | Hasil yang dapat diuji | Gerbang QC |
| --- | --- | --- |
| 1. Fondasi role dan organisasi | Migrasi tambahan, backfill aman, principal sesi, guard backend, query/relasi tenant, penutupan bypass legacy, cache privat sesuai akun | Dua organisasi fixture tidak bisa saling membaca/mengubah data; admin lama/CMS tetap berfungsi; tanpa perubahan desain landing |
| 2. Portal organisasi | `/app/*`, login pengguna, navigasi dashboard/CRUD, alias URL lama dan returnTo sesuai role | Pengguna organisasi hanya melihat fitur dan data miliknya; dashboard/CRUD tetap sesuai desain desktop/mobile |
| 3. Admin internal | `/admin/login`, shell admin terpisah, overview operasional minimal dan editor CMS yang ada | Pengguna organisasi ditolak melalui URL/API langsung; admin tidak masuk ledger organisasi |
| 4. Flow permintaan demo | Form publik → MySQL → daftar/status admin → konfirmasi yang benar | Loading/error/success, validasi server, rate limit, data persisten; tidak otomatis membuat akun |
| 5. Pengelolaan akses dasar | Organisasi dan pengguna, aktivasi/nonaktif, provisioning awal terkendali | Nonaktif menghentikan akses/sesi tanpa menghapus histori; tidak bisa mengubah role/org lewat payload biasa |
| 6. Kesiapan rilis | Hilangkan placeholder rilis, uji mobile aktual, alur aktivasi/reset akun, email bila digunakan, audit perubahan penting, backup/restore, HTTPS/config production dan deployment | Uji terisolasi dan acceptance pengguna sebelum menyebut siap production |

Tugas 1 perlu memindahkan plumbing service fundraising ke namespace `/app` dan mengganti tipe sesi/guard minimal agar kompatibel; ini bukan kesempatan merombak shell. Tugas 2 menyelesaikan route/layout/menu, tugas 3 menyelesaikan pengalaman admin. Terapkan per tugas dalam keadaan aman; bila menu belum dipisah, role guard tetap wajib menolak akses yang salah. Jangan menampilkan fitur baru yang belum diimplementasikan.

Penetapan scope awal: perubahan struktur flow, bukan penambahan pembayaran, AI atau seluruh fitur produk komersial. Pengguna QC setiap tugas sebelum kelanjutan.

## Kriteria penerimaan penting

- User A dan B: daftar, count, detail ID, search, referensi, mutation, archive/restore, report dan ekspor semuanya terisolasi. Nilai dashboard A tidak berubah saat donasi B berubah.
- Memalsukan organization_id/role, menebak ID, atau memanggil endpoint legacy tidak memberi akses tambahan. Relasi lintas organisasi ditolak sampai level database.
- Guest tidak dapat membuka API privat; user organisasi tidak dapat memakai CMS/upload/kelola akun; admin internal tidak otomatis dapat membaca ledger.
- Menonaktifkan akun/organisasi memutus sesi dan tidak menghilangkan histori. Pergantian akun/tab tidak memperlihatkan cache atau draft akun lama.
- Data lama dan ilustrasi tetap; tidak ada reset/reseed, penggantian password diam-diam, atau pencampuran angka marketing dengan ledger.
- Link/NavLink, direct URL/refresh, Back/Forward, filter URL, loading/empty/error/retry/success/403/404, fokus keyboard dan draft guard tetap benar; verifikasi desktop dan mobile aktual serta build React/legacy yang terdampak.

## Hal yang belum menjadi keputusan bisnis

Nama organisasi showcase, pemilik email pengiriman, cara aktivasi/reset akun production, batas retensi data/prosedur penghapusan, isi persetujuan form publik, dan kebutuhan akses dukungan belum ditetapkan. Hal ini tidak menghalangi analisis atau persiapan fondasi, tetapi tidak boleh diisi dengan klaim otomatis. Tidak ada jadwal demo/email/billing yang dianggap sudah berfungsi.

## Status tugas 3

Admin internal telah diimplementasikan dan menunggu QC. Lihat [route, definisi angka dan verifikasi](internal-admin.md). Langkah berikut setelah QC adalah flow permintaan demo, kemudian pengelolaan akses; belum dikerjakan pada tugas admin internal.

## Status tugas 4

Form demo React, API publik terlindungi, MySQL, dan inbox/status admin sudah diimplementasikan. [Detail, batasan dan QC](demo-requests.md). Tunggu QC sebelum pengelolaan akses dasar.

## Status tugas 5a

Pengelolaan organisasi admin (direktori/tambah/status/pencabutan sesi) telah diimplementasikan. Lihat [kontrak dan pemeriksaan](organization-management.md). Tunggu QC bagian ini sebelum pengelolaan akun pengguna.

## Status tugas 5b

Kelola organization_user sudah tersedia dengan password awal sementara di dialog, email unik, organisasi/role tetap, status dan pencabutan sesi. [Kontrak, batasan dan QC](user-management.md). Menunggu QC sebelum kesiapan rilis.
