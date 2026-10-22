> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Login admin lokal

## Akses dan akun QC

- Halaman: `http://127.0.0.1:5175/login.html` pada dev server yang sedang berjalan.
- API: `npm run start:api` atau `npm run dev:api`, port 3101.
- Akun dibuat dengan `npm run admin:create`. Email default `admin@kindsight.local`.
- Password acak tersimpan di `.admin-credentials.local`, hanya dapat dibaca/ditulis pemilik file dan diabaikan Git. Tidak ditulis ke source atau console.
- Alternatif provisioning: set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD di environment/.env sebelum menjalankan admin:create. Password minimal 12 dan maksimal 128 karakter.
- Menjalankan perintah lagi untuk email yang sudah ada tidak mereset password atau mengubah profil.
- Form login mengarah ke panel konfirmasi sesi pada halaman yang sama. Tombol Open management kini membuka CRUD di /admin.html; dashboard utama masih tahap berikutnya.

## Endpoint

| Endpoint | Perilaku |
| --- | --- |
| POST /api/v1/auth/login | Validasi input, verifikasi admin aktif, buat sesi baru, cookie HttpOnly |
| GET /api/v1/auth/me | Profil admin dari sesi aktif; tanpa sesi, expired, atau akun nonaktif mendapat 401 |
| POST /api/v1/auth/logout | Hapus sesi di MySQL, hapus cookie, HTTP 204; aman diulang |
| /api/v1/admin/* | Middleware sesi sebelum handler admin; request tanpa sesi mendapat 401 |

Login/logout membutuhkan Origin yang tercantum dalam APP_ORIGINS, Content-Type application/json, dan header X-Kindsight-Request: 1.
Service frontend sudah mengirim header tersebut. Tidak ada CORS lintas origin; frontend mengakses API melalui proxy Vite.
Route CRUD kini tersedia di /api/v1/admin; semuanya memakai requireAdmin dan proteksi mutasi yang sama.

## Implementasi sesi

- Password memakai scrypt-v1 (N=32768, r=8, p=3), salt acak, dan perbandingan timing-safe.
- Token sesi acak 256 bit dikirim sebagai cookie `kindsight_session`; database hanya menyimpan SHA-256 token.
- Cookie HttpOnly, SameSite=Strict, path `/`, masa berlaku absolut 8 jam; Secure saat NODE_ENV=production dengan HTTPS.
- Sesi tidak disimpan di localStorage/sessionStorage dan tidak dimasukkan ke respons JSON.
- Login baru mengganti sesi dari cookie sebelumnya; sesi expired ditolak server dan dibersihkan saat login berhasil.
- Akun yang dinonaktifkan langsung kehilangan akses melalui sesi lama.
- Login salah dibatasi 10 percobaan per IP selama 15 menit; penyimpanan limiter masih di memori satu proses, sehingga reset setelah restart. Ini sesuai backend lokal satu proses saat ini.
- Tidak ada signup publik, reset password, email otomatis, atau remember-me dalam scope login ini.

## Tampilan

Tidak ada frame login khusus dalam hasil analisis yang tersimpan. Halaman baru memakai font, token warna/spacing, logo, dan button Kindsight yang tersedia, dengan SCSS BEM dan Pug.
Adaptasi mobile memakai satu kolom. Layout dashboard nantinya tetap mengikuti node Figma `675:1767`; halaman login ini bukan pengganti desain dashboard.
Landing yang telah di-QC tidak diubah.

## Verifikasi

```sh
npm run test:api
npm run test:db
npm run test:auth
npm run build
```

Empat test autentikasi mencakup salt/hash password, login, profil sesi, hashing token tersimpan, rotasi token, logout, akun nonaktif, expiry, token palsu, input invalid, origin/header yang ditolak, dan rate limit.
Fixture admin/sesi test dibuat dengan ID unik lalu dihapus; akun QC tidak diubah.

Browser sudah diuji: form kosong, password salah, login via keyboard, Show/Hide password via Space,
reload, logout, sesi tetap aktif setelah restart backend, desktop 1280 px dan mobile 320/390 px tanpa overflow horizontal.
401 pada pengecekan `/auth/me` saat belum login adalah respons normal, bukan error koneksi.

## QC pengguna

1. Buka login.html dan gunakan kredensial pada file lokal.
2. Coba email/password salah, kemudian login benar.
3. Reload untuk memastikan sesi aktif, lalu Sign out.
4. Periksa desktop/mobile, fokus keyboard, dan toggle password.

Preview desktop: `/tmp/kindsight-admin-login-desktop.jpg`.
Preview mobile: `/tmp/kindsight-admin-login-mobile.jpg`.
