# Permintaan demo — tugas 4

Pengguna menerima admin internal dan mengizinkan flow demo. Implementasi ini menunggu QC sebelum pengelolaan akses organisasi/akun.

## Flow aktif

1. Get a Demo pada Navbar atau Request a Demo pada Hero membuka dialog yang sama, memakai tampilan/token yang sudah diterima.
2. Nama dan email wajib; organisasi dan pesan opsional. Form menjelaskan penyimpanan untuk review tim. Tidak menambahkan persetujuan legal atau janji waktu follow-up yang belum diputuskan.
3. POST `/api/v1/demo-requests` menyimpan ke MySQL dan mengembalikan acknowledgment minimal `{id, received:true}`. Tidak perlu login; tidak ada endpoint GET publik untuk daftar/detail.
4. Konfirmasi hanya menyatakan permintaan diterima. Tidak ada email, jadwal, organisasi atau akun yang dibuat otomatis.
5. Admin internal membuka `/admin/demo-requests`, mencari nama/email/organisasi, memfilter status dan melakukan pagination. Search/status/page/pageSize divalidasi dan disimpan di URL; filter mengulang dari halaman 1. Waktu ditampilkan UTC, urutan terbaru dahulu lalu ID.
6. Review membuka detail kontak/pesan dan pilihan status: new (belum ditinjau), contacted (tim mencatat follow-up), closed (tidak ada aksi lanjut). Status dapat dikoreksi ke pilihan lain; perubahan status tidak mengirim pesan keluar.

## API, database dan privasi

- Endpoint daftar/detail GET dan PATCH status di `/api/v1/admin/demo-requests` hanya platform_admin. Guest ditolak 401, organization_user 403. Admin tidak mendapat akses ledger.
- Semua mutasi mempertahankan Origin yang diizinkan, JSON dan `X-Kindsight-Request`. Submission publik dibatasi 5 request per IP per 15 menit, termasuk percobaan tidak valid/pengiriman ulang. Respons 429 JSON dan Retry-After. Limiter in-memory per proses, memadai untuk showcase lokal; deployment multi-instance perlu kebijakan penyimpanan rate-limit tersendiri.
- Validasi server membatasi panjang, email, field yang didukung dan status. Teks pesan dirender sebagai teks React, tanpa HTML. Tidak mencetak isi form/kredensial di log.
- ID submission UUID dibuat saat form dibuka. Retry payload sama dengan ID sama tidak menyisipkan dua record; payload berbeda dengan ID yang sudah dipakai ditolak 409. Tutup/buka kembali untuk permintaan baru. Tidak menganggap email yang sama selalu duplikat bisnis.
- Migrasi tambahan `005-demo-request-revisions` menambah revision default 1 dan indeks status/created_at/id. Migrasi 001–004, data historis, akun/password, ledger dan konten tidak diubah/reset/reseed. Readiness/check memerlukan schema terbaru.
- PATCH wajib If-Match revisi numerik. Konflik 409 mempertahankan draft. Reload latest membaca detail terkini meskipun record keluar dari filter tabel, mempertahankan pilihan status dan meminta admin menyimpan kembali. Tidak ada delete pada UI/API.
- Service TypeScript async/TanStack Query memakai scope private admin. Mutasi menginvalidasi query private dan menyiarkan perubahan ke tab lain. Session/logout tetap membersihkan data privat. Shell tetap tampil saat loading/refetch; ada empty/error/retry/success dan status mutasi. Dialog tidak dapat ditutup saat submit/save sedang berlangsung.
- Form publik baru aktif hanya di React. Form Pug lama dan fixture mock tetap referensi/preview. Newsletter masih preview. Jangan mengklaim seluruh CTA sudah terhubung atau siap production.

## Pemeriksaan

- `npm run test:demo`: 2 integrasi MySQL. Penyimpanan/idempotensi, validasi, larangan field role/status/orgId, Origin/header, rate limit, guest/role, daftar/paging/search/status, detail/no-store, If-Match/konflik/404, tidak membuat akun. Fixture dibuat terisolasi dan dibersihkan.
- `npm run test:integration`: service React publik → API → MySQL → daftar admin → update status → detail/konflik. CRUD/report/CMS juga tetap lulus.
- `npm run test:frontend`: 21 pengujian, termasuk normalisasi URL inbox dan returnTo lintas role. `test:admin`, `test:organizations`, `test:api` lulus.
- Build React memeriksa TypeScript frontend/API; build legacy juga lulus. Tidak menambah dependency.
- Browser desktop: form submit → konfirmasi → inbox → perubahan status, fokus Close dan kembali ke CTA/Review, status empty/filter/search dan refresh. Dua tab admin memicu konflik nyata; reload mempertahankan draft dan save berhasil. Navigasi internal mempertahankan shell.
- Mobile 390×844: form wajib/scroll dialog, menu mobile, inbox/filter tanpa overflow halaman, tabel scroll horizontal, detail/status dan Escape/fokus diperiksa. Tidak mengganti komposisi landing.
- Fixture browser QC lokal dibersihkan setelah pemeriksaan. Screenshot inbox/detail menunjukkan fixture sementara saat pengujian; bukan data pelanggan. Screenshot form/success dan inbox ada di `docs/screenshots/demo-request*`.

QC: kirim permintaan dari landing, buka menu Demo requests admin, cari/filter/refresh, Review → Save status, lalu cek desktop/mobile. Email, consent/privacy production, retensi data, booking dan provisioning akun tetap belum diimplementasikan. Setelah QC, tugas berikut sesuai rencana adalah pengelolaan akses dasar.
