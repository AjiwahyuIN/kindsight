> Status lanjutan: [fondasi role/organisasi](role-organization-foundation.md) mengganti sesi `data.admin` menjadi `data.user`, ledger API ke `/api/v1/app/*`, dan migrasi 004. Detail integrasi awal di bawah merupakan riwayat sebelum pemisahan role.

# Integrasi API dan MySQL React — menunggu QC

Keputusan pengguna: lanjutkan API/database setelah login, dashboard, CRUD dan seluruh editor React. Frontend aktif kini membaca/menulis REST; IndexedDB dan marker sessionStorage demo tidak digunakan sebagai sumber data aktif dan tidak diimpor ke database.

## Menjalankan

MySQL lokal harus aktif. Gunakan `.env` lokal yang sudah tersedia; jangan menyalin kredensial ke frontend atau Git.

```sh
npm ci
npm run db:migrate
npm run db:check
npm run dev:api
# Terminal kedua
npm run dev
```

React: http://127.0.0.1:5176, API: http://127.0.0.1:3101/api/v1/ready. Preview build memakai 5180 dan proxy API yang sama. Gunakan akun admin lokal lama, bukan akun fixture React. Provisioning `npm run admin:create` tidak mengubah password akun yang sudah ada. Password yang dahulu dihasilkan tersimpan di `.admin-credentials.local`, diabaikan Git; tidak ditampilkan dalam halaman login.

Untuk instalasi database kosong saja: isi `.env` sesuai `.env.example`, jalankan `db:setup`, `db:migrate`, opsional `db:seed`, lalu `admin:create`. Seed berisi contoh fiktif dan tidak dijalankan ulang pada database pengguna dalam integrasi ini.

## API dan kontrak

- Auth: POST `/api/v1/auth/login`, GET `/auth/me`, POST `/auth/logout`. Sesi 8 jam pada MySQL, cookie HttpOnly/SameSite Strict; password di-hash. Mutasi memerlukan Origin yang diizinkan dan `X-Kindsight-Request: 1`. Cookie Secure aktif pada NODE_ENV=production; deployment perlu HTTPS dan APP_ORIGINS yang tepat.
- CRUD: `/api/v1/admin/donors`, `/campaigns`, `/donations` (GET/POST, GET/PATCH/DELETE `/:id`, POST `/:id/restore`). DELETE mengarsipkan. React mengirim If-Match berupa revision numerik untuk edit/arsip/pulihkan. Konflik 409 mempertahankan draft. Klien Pug lama tetap didukung tanpa header revisi.
- Laporan: GET `/api/v1/admin/dashboard/summary`, `/trend`, `/campaigns`. Periode UTC `[from,to)`, hanya received dan donasi nonarsip. DECIMAL tetap string; perhitungan persentase memakai aritmetika eksak. Campaign memakai scope lifetime, bukan periode summary. Zero baseline/target menghasilkan null, bukan pertumbuhan palsu. Major Gift, forecast, pending ask, scoring dan AI belum memiliki definisi/sumber bisnis.
- CMS React: GET `/api/v1/content/:section`; GET/PUT `/api/v1/admin/content/:section`. Mendukung 10 section. Revision SHA256 adalah token opaque. Endpoint legacy `/landing/:section` tetap tersedia untuk lima editor Pug lama.
- Logo: GET `/api/v1/partner-logos`, POST `/api/v1/admin/partner-logos`, GET `/api/v1/partner-logos/:id/file`. PNG/JPG/WebP maksimum 2 MB / 16 megapiksel, disanitasi menjadi PNG maksimal 1600 px; metadata MySQL dan file disk lokal.
- Kegagalan API tidak beralih diam-diam ke fixture. 401 mengembalikan pengguna ke login; field errors, 409, jaringan dan retry diteruskan ke UI.

## Penyimpanan dan kompatibilitas

Migrasi tambahan **003-record-revisions** menambahkan revision ke donor/campaign/donasi dengan default 1. Migrasi 001/002 tidak diubah; tidak ada reset/reseed. Database awal berisi 2 donor, 2 campaign, 5 donasi dan 10 section. Konten serta upload lama dipertahankan.

Backend baru memakai `server/index.ts` dan router/repository CMS TypeScript di `server/react/content.ts`; `tsconfig.server.json` memeriksa file TypeScript secara strict. Modul autentikasi, fundraising, laporan, migrasi dan upload JavaScript lama digunakan kembali melalui batas kompatibilitas bertipe (`server/types.ts`). Ini migrasi backend bertahap, bukan konversi seluruh modul legacy ke TypeScript; checkJs tetap false untuk modul lama.

`shared/react-content.json` adalah kontrak copy yang dihasilkan dari schema editor React melalui `npm run content:contract`. Regenerasi hanya ketika field desain yang disetujui berubah, kemudian restart API. Database menyimpan copy; React memasangkan kembali aset/geometri bawaan sesuai bundle dev/production. CMS tidak menerima URL aset arbitrer. Pembacaan format lama dan penyimpanan baru mempertahankan ilustrasi/preview lama. Tidak menyamakan angka marketing dengan ledger.

TanStack Query menginvalidasi resource fundraising, referensi, statistik/tren/campaign/direktori setelah mutasi. Publikasi menginvalidasi editor dan landing terkait; BroadcastChannel/fokus menyegarkan tab lain. Tidak ada full-page reload untuk navigasi internal. Referensi relasi mengambil semua halaman, bukan memotong di 100 record. Untuk data lokal ini masih sederhana; tidak ada ORM atau lapisan tambahan.

## Verifikasi

- Build React + typecheck API dan build Pug berhasil.
- 13 unit backend, 18 regresi mock frontend, 16 integrasi backend MySQL, serta 1 integrasi service React REST/MySQL (48 pengujian) lulus.
- `npm run test:integration` memakai service React aktif, admin sementara dan record CMS terisolasi; menguji login/401/logout/CSRF, create/edit/konflik/arsip/pulihkan, summary/tren/campaign, seluruh 10 CMS, tautan tidak aman, upload/katalog/file/publikasi logo. Fixture dibersihkan; tidak mengganti section live.
- Browser: login/logout nyata, CRUD donor bertahan setelah refresh, arsip, dashboard USD 5,250 pada Oktober 2026, publikasi Hero terlihat di landing lalu dikembalikan. Donor uji browser dibersihkan. Desktop 1280 px tidak overflow dan tidak ada gambar rusak.
- Override viewport mobile pada alat browser tetap terbaca 1280 px meskipun diminta 390 px. Verifikasi mobile aktual belum dapat dinyatakan lulus; adaptasi SCSS yang sudah diterima dipertahankan. Jadikan mobile bagian QC pengguna.
- Routing direct/refresh serta pemisahan respons API/aset diperiksa pada dev dan preview; contoh deployment di `spa-deployment.md` belum diterapkan ke hosting.

## QC pengguna

Login akun lokal → tambah/edit/arsip/pulihkan fundraising → pastikan dashboard mengikuti ledger → edit/publish landing dan upload Partners → refresh/direct URL serta ukuran mobile. Donate, pembayaran, newsletter/demo sungguhan, AI dan scoring tetap di luar scope. Tunggu QC sebelum fitur berikutnya.

## Permintaan demo React aktif

Migrasi tambahan 005 dan endpoint publik/admin demo kini tersedia; lihat [kontrak, proteksi, batasan dan pengujian](demo-requests.md). Catatan preview demo pada fase integrasi awal di atas sudah digantikan untuk React; newsletter/Pug tetap preview.

## Pengelolaan organisasi

Migrasi tambahan 006, API/status organisasi dan pencabutan sesi tersedia; [detail kontrak dan QC](organization-management.md). Password/provisioning akun lama tetap; UI pengelolaan akun belum dibuat.

## Pengelolaan akun organisasi

Migrasi tambahan 007 dan API Users tersedia; lihat [provisioning/password awal, proteksi dan QC](user-management.md). Tidak mengganti kredensial akun lama dan tidak mengaktifkan reset/email/registrasi publik.
