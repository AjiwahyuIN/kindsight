> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Phase 3 — Rancangan backend dan integrasi

Status: kebutuhan utama dikonfirmasi pengguna; rincian model/API di bawah tetap usulan implementasi. Fondasi Express, MySQL lokal, migration/seed, dan health/readiness sudah diimplementasikan. Login admin telah lolos QC. CRUD donor/campaign/donasi telah lolos QC. API dashboard sudah tersedia; tampilan dashboard utama masih tahap berikutnya.

## Keputusan pengguna dan kondisi project

- Frontend landing dihentikan pada kondisi saat ini. Interaksi disempurnakan setelah backend terhubung.
- Stack: Node.js + Express, JavaScript, MySQL lokal melalui mysql2.
- Scope backend pertama mencakup login admin dan CRUD.
- Editor landing mengikuti konten dan struktur desain utama. Pengelolaan bagian lainnya boleh disesuaikan dengan kebutuhan.
- Mata uang utama USD.
- Donasi anonim diperbolehkan: donor_id boleh NULL; tidak membuat donor fiktif bernama Anonymous.
- Semua penyimpanan menggunakan MySQL lokal, termasuk newsletter dan permintaan demo. Tidak ada pengiriman email atau langganan eksternal otomatis.
- Landing sudah memiliki konten contoh terpusat serta modul service async.
- Dashboard penuh belum diimplementasikan. Dashboard di Hero adalah ilustrasi, bukan spesifikasi angka bisnis.
- Angka marketing About/Missions/Sectors tidak otomatis menjadi agregasi dashboard.

## Usulan scope versi pertama

1. Login/logout satu peran admin; semua data fundraising dan operasi pengelolaan memerlukan sesi admin.
2. CRUD donor, campaign, dan donasi. Ini usulan entitas minimum, belum keputusan final pengguna.
3. Dashboard ringkasan, tren donasi, progres campaign, dan daftar donasi; filter periode, campaign, pencarian dan pagination.
4. Konten landing tersedia melalui API publik. Pengelolaan copy melalui editor konten terstruktur sesuai desain utama, termasuk daftar, angka marketing, CTA, dan referensi aset yang tersedia. Editor tidak mengubah struktur/layout secara bebas.
5. Newsletter dan permintaan demo dicatat ke MySQL lokal; pengiriman email, payment gateway, dan langganan eksternal di luar rancangan versi pertama.
6. Dataset seed fiktif untuk showcase, tanpa data donor nyata.

Prospect scoring, AI insights, major gifts, forecast, dan integrasi CRM tidak dihitung dari angka desain secara sembarang. Perlu aturan dan data tersendiri sebelum diaktifkan.

## Usulan model data

| Tabel | Field utama | Relasi / aturan |
| --- | --- | --- |
| admins | id, email unik, password_hash, name, active, created_at | Seed akun melalui environment; tanpa password bawaan di repository |
| sessions | session_id, admin_id, expires_at, data | Sesi server untuk login; berakhir saat logout/kedaluwarsa |
| donors | id, name, email opsional, phone opsional, organization opsional, archived_at, timestamps | Satu donor memiliki banyak donasi; email bukan identitas unik wajib |
| campaigns | id, name, description, target_amount, currency, starts_on, ends_on, status, archived_at, timestamps | Status usulan draft/active/completed; satu campaign memiliki banyak donasi |
| donations | id, donor_id nullable, campaign_id nullable, amount, currency, status, received_at, note, archived_at, timestamps | Donor boleh anonim; campaign opsional adalah usulan untuk donasi umum; status pending/received/cancelled; pembayaran dicatat manual |
| landing_sections | section_key unik, content_json, updated_at | JSON mengikuti bentuk data frontend; divalidasi berdasarkan section, bukan HTML bebas |

Nominal menggunakan DECIMAL(15,2) dan dikirim sebagai string desimal di API. Perhitungan uang dilakukan dengan aritmetika desimal, bukan penjumlahan float JavaScript. Tanggal waktu disimpan UTC; filter memakai zona waktu pelaporan yang dipilih. Tanggal campaign memakai DATE.

Usulan hapus pada UI adalah arsip (soft delete), bukan penghapusan permanen. Arsip donor/campaign tidak menghapus donasi historis; donasi historis tetap ikut laporan selama donasinya tidak diarsipkan. Perubahan status/arsip donasi memengaruhi ringkasan. Pilihan ini harus dijelaskan pada form dan dikonfirmasi sebelum CRUD dibangun.

Tabel tambahan yang diperlukan:

| Tabel | Field utama | Aturan |
| --- | --- | --- |
| newsletter_subscriptions | id, email unik, status, created_at, updated_at | Pencatatan minat newsletter lokal; pengiriman email belum tersedia; submit ulang tidak menduplikasi baris |
| demo_requests | id, name, email, organization opsional, message opsional, status, created_at, updated_at | Permintaan demo lokal; admin dapat melihat dan memperbarui status new/contacted/closed |

Keduanya tidak otomatis membuat donor. Pesan sukses menyatakan data tersimpan lokal, bukan bahwa email terkirim atau demo telah terjadwal.

## Definisi angka dashboard yang diusulkan

Semua agregasi tunduk pada filter yang sama dan hanya memakai donasi tidak diarsipkan.

| Angka | Usulan definisi | Belum dipastikan |
| --- | --- | --- |
| Total raised | SUM(amount) dengan status received dan received_at dalam periode | Mata uang dan cakupan organisasi |
| Donation count | COUNT donasi received dalam periode | Apakah pending perlu kartu terpisah |
| Active donors | COUNT DISTINCT donor_id dari donasi received dalam periode | Nama label final |
| Pending amount | SUM(amount) berstatus pending; tanggal acuan harus ditetapkan dahulu | received_at belum cocok untuk pending; perlu expected_at atau pakai created_at |
| Growth | (raised periode ini − pembanding) / pembanding × 100 | Pembanding: periode sebelumnya dengan durasi sama; bila pembanding 0 tampil null/N/A |
| Campaign progress | Total received sepanjang umur campaign / target × 100 | Tidak mengikuti filter periode; label harus menyatakan lifetime; target 0 menghasilkan null |
| Donation trend | Total received per bucket tanggal; bucket kosong bernilai 0 | Harian/bulanan, zona waktu pelaporan |
| Major gifts / forecast / AI metrics | Tidak tersedia sampai aturan disetujui | Ambang nominal, pipeline, probabilitas, sumber dan metode |

Tidak menjumlahkan beberapa mata uang. USD telah dipilih pengguna untuk versi pertama. API menolak currency selain USD. Dashboard memakai tanggal rentang mulai inklusif dan akhir eksklusif setelah konversi zona waktu; UI tetap bisa menampilkan tanggal akhir inklusif kepada pengguna.

## Usulan kontrak API

Prefix `/api/v1`. Respons object `{ data, meta? }`; error `{ error: { code, message, fields? } }`. Endpoint daftar menerima page, pageSize (dibatasi), search, dan sort yang diizinkan. Semua ID, filter dan body divalidasi server.

| Metode / endpoint | Akses | Kegunaan |
| --- | --- | --- |
| GET /health | Publik | Status aplikasi; readiness database diperiksa terpisah tanpa membocorkan konfigurasi |
| POST /newsletter-subscriptions | Publik, validasi dan pembatasan submit | Mencatat minat newsletter lokal tanpa pengiriman email |
| POST /demo-requests | Publik, validasi dan pembatasan submit | Menyimpan permintaan demo lokal |
| GET/PATCH /admin/newsletter-subscriptions[/:id] | Admin | Daftar dan pembaruan status melalui endpoint koleksi/detail terpisah |
| GET/PATCH /admin/demo-requests[/:id] | Admin | Daftar dan pembaruan status melalui endpoint koleksi/detail terpisah |
| POST /auth/login | Publik, dibatasi percobaan | Membuat sesi dari email/password |
| GET /auth/me | Admin | Profil sesi aktif |
| POST /auth/logout | Admin | Menghapus sesi |
| GET /landing | Publik | Seluruh konten landing yang telah diterbitkan |
| PATCH /admin/landing/:section | Admin | Memperbarui field copy terstruktur, sesuai struktur desain utama |
| GET/POST /donors | Admin | Daftar/pembuatan donor |
| GET/PATCH/DELETE /donors/:id | Admin | Detail, perubahan, arsip donor |
| GET/POST /campaigns | Admin | Daftar/pembuatan campaign |
| GET/PATCH/DELETE /campaigns/:id | Admin | Detail, perubahan, arsip campaign |
| GET/POST /donations | Admin | Daftar/pencatatan donasi manual |
| GET/PATCH/DELETE /donations/:id | Admin | Detail, perubahan, arsip donasi |
| GET /dashboard/summary | Admin | Agregasi dengan from, to, campaignId |
| GET /dashboard/trend | Admin | Agregasi bucket dengan filter periode/campaign yang sama |
| GET /dashboard/campaigns | Admin | Progres lifetime per campaign, definisi terpisah dari summary |

Autentikasi usulan: cookie HttpOnly dengan sesi di server, SameSite dan pemeriksaan origin/CSRF untuk mutasi; cookie Secure saat HTTPS. Development memakai proxy Vite `/api` ke Express agar frontend tetap satu origin. Password di-hash, query SQL memakai parameter, akun MySQL hanya mendapat hak aplikasi yang diperlukan. Detail paket dan konfigurasi dipilih saat implementasi berdasarkan dokumentasi resmi.

Kode respons utama: 200/201 berhasil, 204 arsip/logout bila tanpa body, 400 validasi, 401 belum login, 403 akses/CSRF ditolak, 404 tidak ditemukan, 409 konflik referensi/data, 429 percobaan berlebih, 500 error internal tanpa detail SQL/stack ke klien.

## Integrasi frontend

- Pertahankan Pug untuk markup awal, SCSS BEM dan Vanilla JavaScript.
- Service mengambil API, komponen menerima bentuk data yang konsisten. Gunakan modul request bersama untuk JSON, credentials, dan error.
- Mock tetap untuk mode contoh yang dipilih secara eksplisit; kegagalan API tidak boleh diam-diam tampil sebagai data live yang sukses.
- Landing saat ini juga diisi saat build melalui Vite/Pug. Setelah API terpasang, tentukan fallback awal dan pembaruan runtime untuk seluruh field/aset/list dinamis; perubahan MySQL harus terlihat tanpa build ulang.
- File aset tetap statis lokal untuk versi pertama; upload aset tidak termasuk scope awal.
- Bangun halaman login dan dashboard admin setelah API dasarnya tersedia. Table/form, filter, loading/error/empty, dan Chart.js dikerjakan bertahap dengan QC.

## Struktur folder usulan

server/
  app.js
  index.js
  config/          # env dan pool mysql2
  routes/
  controllers/
  services/        # aturan bisnis dan agregasi
  repositories/    # query SQL
  middleware/      # auth, validasi, error
  db/
    migrations/
    seeds/
src/scripts/services/   # adapter API frontend yang sudah ada
src/pages/              # login dan dashboard ditambahkan kemudian

Tidak perlu ORM atau lapisan tambahan untuk showcase ini. Rahasia koneksi disimpan dalam .env yang diabaikan Git; .env.example hanya berisi nama variabel/contoh nonrahasia.

## Urutan implementasi dan QC

1. Tetapkan entitas CRUD, mata uang, aturan angka dan cakupan login/konten.
2. Setup Express + MySQL, environment, migration/seed dan health/readiness.
3. Login admin: sesi, validasi, proteksi route dan pengujian login/logout/kedaluwarsa.
4. CRUD donor → campaign → donasi; uji relasi, validasi, pagination dan arsip.
5. API ringkasan/tren, diuji dengan fixture bernilai pasti untuk filter, periode kosong, pembanding nol, dan konsistensi jumlah.
6. API landing dan penggantian service; verifikasi perubahan database muncul di browser.
7. Frontend login/dashboard dan interaksi bertahap, QC per bagian.
8. Uji browser → API → MySQL, persistensi setelah restart, akses tanpa sesi, nominal/tanggal, lalu build frontend.

## Rincian implementasi yang masih berupa usulan

- CRUD utama donor/campaign/donasi; form dan halaman admin lainnya disesuaikan kebutuhan.
- Campaign opsional untuk donasi umum, sementara donor anonim sudah dikonfirmasi.
- Soft delete/arsip untuk menjaga relasi dan riwayat; belum menjadi aturan bisnis permanen.
- Definisi angka dashboard tetap mengikuti tabel usulan, bukan menganggap angka pada desain sebagai rumus. Pending amount, major gifts, forecast, dan AI scoring ditunda sampai definisinya tersedia.
- Konten landing yang diedit mencakup field desain utama; aset dipilih dari file lokal yang tersedia, upload file belum termasuk.
- Newsletter dan demo disimpan lokal serta dapat dilihat admin; pengiriman email dan jadwal demo otomatis belum termasuk.

## Langkah implementasi terdekat

Setup Express, konfigurasi environment, pool mysql2, migration/seed, serta health/readiness. Setelah fondasi terverifikasi, lanjut login admin kemudian CRUD dan integrasi secara bertahap.


## Progres fondasi

- Database terpisah `kindsight_local` digunakan karena database `kindsight` sudah ada pada mesin; data sebelumnya tidak diubah.
- API lokal memakai port 3101 karena 3001 sedang digunakan proses lain.
- Schema mencakup delapan tabel aplikasi, `schema_migrations`, dan `seed_runs`.
- Seed awal tidak membuat kredensial admin bersama; provisioning akun dilakukan pada tahap login.
- Dashboard wajib mengikuti desain yang telah dianalisis: Figma `FkXglC7ztx7bIPEcHOGSHD`, node `675:1767`. Ilustrasi Hero tidak menggantikan referensi dashboard penuh.
- Rincian setup dan hasil verifikasi dicatat di `docs/backend-foundation.md`.


## Progres login admin

Login/logout, sesi MySQL, proteksi route admin dan halaman login sudah tersedia.
Detail implementasi dan hasil verifikasi: `docs/admin-login.md`.
Tampilan login menggunakan adaptasi token Kindsight karena tidak ada desain login khusus dalam analisis.
Login sudah lolos QC; CRUD berikutnya telah dikerjakan. Lihat docs/admin-crud.md.


## Progres CRUD

CRUD donor, campaign dan donasi beserta halaman pengelolaan tersedia.
Path implementasi endpoint: `/api/v1/admin/donors`, `/api/v1/admin/campaigns`, `/api/v1/admin/donations`;
semuanya memakai middleware sesi dan proteksi mutasi. Restore memakai POST /:resource/:id/restore.
Arsip tidak menghapus riwayat relasi. CRUD telah lolos QC; API ringkasan/tren/progres kemudian diimplementasikan.


## Progres API dashboard

Endpoint aktual: GET `/api/v1/admin/dashboard/summary`, `/trend`, `/campaigns`.
Detail kontrak dan aturan teknis awal: `docs/dashboard-api.md`.
Periode memakai UTC dan akhir eksklusif; growth memakai periode sebelumnya berdurasi sama,
progres campaign lifetime. Definisi bisnis yang belum tersedia ditandai unavailable, tidak diasumsikan nol.
21 pengujian dan build lulus. Tampilan/grafik dashboard Figma belum dibangun pada tahap API ini.
