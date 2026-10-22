> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Fondasi backend lokal

## Scope tahap ini

Express + mysql2, environment, database/schema, migration, seed contoh dan endpoint diagnostik.
Dokumen ini mencatat fondasi awal. Login admin kemudian ditambahkan (lihat admin-login.md). CRUD kemudian ditambahkan (lihat admin-crud.md). Pengiriman email dan integrasi runtime konten landing belum tersedia.
Dashboard berikutnya wajib mengikuti desain Figma hasil analisis, node `675:1767` pada file `FkXglC7ztx7bIPEcHOGSHD`.

## Menjalankan pada mesin ini

1. Jalankan MySQL lokal bila belum berjalan (instalasi mesin ini: MySQL 8.4).
2. `.env` lokal sudah disiapkan dengan password acak untuk akun aplikasi dan diabaikan Git.
3. Untuk setup ulang yang aman tanpa menghapus data:

```sh
npm run db:setup
npm run db:migrate
npm run db:seed
npm run db:check
```

4. Jalankan backend dan frontend di terminal terpisah:

```sh
npm run dev:api
```

```sh
npm run dev
```

`npm run start:api` menjalankan API tanpa watch. Backend default `http://127.0.0.1:3101`.
Frontend yang sudah berjalan berada di port 5175; pada start baru ikuti URL yang dicetak Vite.
Vite menggunakan proxy `/api` menuju port `API_PORT` dari .env. Restart Vite setelah mengganti .env.
Preview production Vite tidak menyediakan proxy API; integrasi deployment belum termasuk tahap ini.

## Setup pada mesin lain

Salin `.env.example` ke `.env`, pilih `DB_PASSWORD` lokal, dan pastikan MySQL berjalan.
`MYSQL_ADMIN_USER`/`MYSQL_ADMIN_PASSWORD` hanya diperlukan oleh `db:setup` untuk provisioning.
Runtime dan migration memakai `DB_USER`, tidak memakai akun administrator MySQL.
Akun aplikasi dibuat untuk koneksi MySQL lokal (`localhost`) dan mendapat hak hanya pada `DB_NAME`.
Perubahan password akun yang sudah ada tidak dilakukan otomatis oleh `db:setup`.

Database `kindsight_local` sengaja terpisah dari database `kindsight` yang sebelumnya sudah ada.
Tidak ada perintah DROP/TRUNCATE/reset pada script setup, migration, atau seed.
Migration awal menggunakan CREATE TABLE IF NOT EXISTS karena DDL MySQL tidak transactional.
Checksum mencegah pengeditan migration yang sudah diterapkan; tambahkan migration baru untuk perubahan schema.
Seed dicatat sekali dalam transaksi dengan lock; menjalankan ulang tidak menimpa konten atau menggandakan record.
Jangan mengganti DB_NAME ke database lain yang berisi tabel dengan nama sama.

## Endpoint yang tersedia

| URL | Hasil |
| --- | --- |
| GET /api/v1/health | HTTP 200, proses API hidup; tidak mengklaim database siap |
| GET /api/v1/ready | HTTP 200 setelah koneksi MySQL dan migration awal terkonfirmasi; HTTP 503 bila belum siap |
| Route lain | JSON 404; route bisnis belum tersedia |

Readiness melewati mysql2 ke tabel schema_migrations. Respons publik tidak memuat kredensial, detail SQL, atau stack trace.

## Schema dan seed

- Tabel: admins, sessions, donors, campaigns, donations, landing_sections,
  newsletter_subscriptions, demo_requests; ditambah schema_migrations dan seed_runs.
- Nominal DECIMAL(15,2), USD, dikembalikan mysql2 sebagai string; tanggal disimpan UTC.
- Donor dan campaign donasi boleh NULL untuk anonim/donasi umum (campaign opsional masih pilihan implementasi yang dapat direvisi).
- Foreign key menjaga relasi; CHECK membatasi USD, nominal positif dan received_at untuk status received.
- Seed: 2 donor fiktif, 2 campaign, 5 donasi. Total received USD 15,250.00;
  pending USD 750.00 dan cancelled USD 100.00 tidak termasuk total received.
- Sepuluh bagian konten landing disalin dari data frontend terpusat. Field/ref aset masih mengikuti bentuk data frontend;
  adapter URL aset dan render dinamis diintegrasikan pada tahap API landing.
- Seed umum tidak membuat admin. Akun admin kini diprovision melalui `npm run admin:create` pada tahap login. Tabel newsletter/demo tersedia, tetapi form belum dihubungkan ke penyimpanan.

## Verifikasi

```sh
npm run test:api
npm run test:db
npm run build
```

- Empat test HTTP/config: health, readiness sukses/gagal, JSON 404, body salah/terlalu besar, konfigurasi tidak valid.
- Satu test integrasi MySQL: 0.10 + 0.20 = 0.30, donasi anonim, filter status,
  foreign key, constraint nominal/mata uang/tanggal. Fixture di-rollback setelah test; data contoh tidak diubah.
- Migration dan seed dijalankan dua kali; penerapan kedua tidak membuat record tambahan.
- HTTP nyata ke API dan melalui proxy Vite berhasil mengembalikan readiness connected/ready.
- Build frontend berhasil; komponen/style landing tidak diubah.
