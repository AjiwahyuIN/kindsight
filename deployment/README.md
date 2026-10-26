# Kindsight — paket persiapan VPS aaPanel

Paket ini adalah snapshot kode lokal terbaru, termasuk perubahan yang belum di-commit, dan build frontend. Belum merupakan deployment/sertifikasi siap production. Tidak ada akses atau perubahan VPS/database pada tahap pembuatan paket.

## Isi dan batas

- `dist/`: build React siap dilayani sebagai static files.
- `server/`, `shared/`, `src/`: API TypeScript/JS serta sumber/aset/berkas kompatibilitas yang masih diimpor backend. Jangan menghapus `src/scripts/data/` atau `shared/react-content.json`.
- `package.json`, `package-lock.json`, konfigurasi build, scripts dan tests: lockfile/sumber yang sama dengan lokal. Tidak ada konversi backend atau perubahan migrasi.
- `deployment/vps.env.example`: placeholder konfigurasi VPS, bukan kredensial.
- `PACKAGE-MANIFEST.json`: SHA256 setiap file, commit asal serta daftar path perubahan lokal; tidak memuat diff/kredensial. Checksum ZIP ada di samping arsip.
- Tidak berisi `.env`, SSH key, kredensial akun lokal, `.git`, `node_modules`, backup SQL, upload pengguna, screenshot QC atau database. Logo/aset bundel desain tetap disertakan.

Root ZIP adalah folder `kindsight/`. Ekstrak di `/www/wwwroot` untuk menghasilkan `/www/wwwroot/kindsight/package.json`, bukan folder bertingkat `kindsight/kindsight`.

## Yang disiapkan nanti melalui panel

1. Upload/ekstrak ke direktori baru khusus Kindsight. Jangan ekstrak ke web root aplikasi lain atau menimpa deployment lama. Pastikan file dapat dibaca user proses dan `server/storage/partner-logos/` dapat ditulis user proses; jangan menggunakan chmod777.
2. Buat database dan akun khusus, lalu tentukan pemindahan database lokal serta upload pengguna secara terpisah dan privat. CMS/akun/ledger tidak terkandung dalam bundle. Jangan mengandalkan fixture atau menjalankan seed/reset pada database berisi data.
3. Salin `deployment/vps.env.example` menjadi `.env` di root project, isi kredensial VPS dan domain HTTPS yang tepat. Jangan meletakkan `.env` di `dist/` atau memasukkannya ke Git. Jangan gunakan password database/root lokal.
4. Instal dependency **di VPS Linux**, dari root project dengan Node22 yang tersedia: `npm ci --include=dev`. `tsx` saat ini berada di devDependencies dan dibutuhkan `start:api`; jangan pakai `--omit=dev`/production-only install. Build frontend sudah dibuat di Mac sehingga tidak perlu menjalankan build berat di VPS. Jangan upload `node_modules` dari Mac; `sharp` mempunyai binary sesuai platform.
5. Jika menyalin database lengkap, cek checksum/status migrasi; jika memulai kosong, jalankan migrasi tambahan hanya setelah konfigurasi/database tujuan dipastikan. Jangan jalankan `db:setup`, `db:seed`, atau pembuatan akun otomatis untuk mengganti data/kredensial yang sudah ada. Provisioning akun/data adalah tahap berikutnya, bukan bagian paket kode.
6. aaPanel Node Project: Path `/www/wwwroot/kindsight`, name `kindsight-api`, user `www` (atau user khusus dengan izin yang sesuai), Node22, manager npm, custom start `npm run start:api`, port3101 **jika tersedia**. Pastikan install terkelola panel tidak memangkas devDependencies; instalasi otomatis yang tidak jelas opsinya sebaiknya dimatikan dan perintah eksplisit di atas digunakan. Proses harus berjalan dalam mode production dan auto-start/restart disiapkan/diperiksa melalui pengelola proses panel.
7. Nginx/domain: web root **`/www/wwwroot/kindsight/dist`**, bukan root source. `/api` dan `/api/` diteruskan tanpa menghapus prefix ke `http://127.0.0.1:3101`. Aset hilang harus404; route SPA mengembalikan `dist/index.html`. Jangan meneruskan seluruh domain hanya ke Express karena Express saat ini hanya melayani API. Jangan membuka3101/MySQL ke internet.
8. Tambahkan HTTPS dan `APP_ORIGINS` sesuai origin final. Pertahankan Origin/header proteksi mutasi, cookie Secure dan batas upload. Contoh fallback proyek ada di docs/spa-deployment.md; sesuaikan dengan vhost aaPanel yang dihasilkan, jangan mengganti konfigurasi website lain.

## Pemeriksaan sebelum akses publik

- API saat ini belum mengatur `trust proxy`. Di balik Nginx, limiter berbasis `request.ip` dapat mengelompokkan pengunjung sebagai loopback. Konfigurasi kepercayaan proxy/IP harus diperiksa dan ditetapkan secara sempit pada tahap deployment; jangan memakai trust proxy global secara sembarang. Paket ini belum mengubah perilaku backend itu.
- Port3101 belum diperiksa di VPS. RAM tersisa dan beban aplikasi lain juga perlu diukur saat runtime. Paket ini tidak menjamin kapasitas/zero downtime.
- Pastikan health200 dan ready200 melalui domain. Health saja tidak membuktikan database siap. Uji konten publik, upload, login/logout, scope role/org, CRUD, demo request, konflik, direct URL/refresh dan aset/API404.
- Uji restart proses/server, HTTPS/cookie, backup/restore terpisah, izin upload dan log tanpa rahasia. Backup data/upload wajib sebelum perubahan di server yang berisi data.
- Upload/database bukan bagian arsip ini: landing yang datanya dari CMS belum akan lengkap sampai database dan upload dipindahkan dengan benar.

## Membuat ulang paket di Mac

Dari root source, jalankan `npm run package:vps`. Perintah membangun frontend dan membuat ZIP allowlist tanpa mengambil rahasia/data lokal. Output di `deploy-artifacts/` (diabaikan Git). Paket bukan Git archive sehingga revisi lokal yang belum di-commit ikut terbawa. Tidak melakukan push, deploy, install atau mutasi database.

## Hasil verifikasi paket — 26 Oktober 2026

- Build TypeScript frontend/API + Vite lulus. Tes frontend24 dan unit API13 lulus.
- ZIP diekstrak terpisah, seluruh SHA256 manifest diperiksa, dan dependency diinstal bersih dengan `npm ci --include=dev`.
- Dari salinan bersih tanpa `.env` pengguna: `npm run start:api` berhasil, health200, API tidak dikenal404 JSON, ready503 ketika sengaja diarahkan ke port database tidak tersedia. Tidak mengakses/mengubah database lokal pengguna. Ini verifikasi runtime macOS, bukan bukti install Linux/CentOS berhasil.
- `npm audit --omit=dev` pada lockfile paket menemukan **2 high**: `body-parser` (GHSA-27r3-jxmh-p828) dan `multer` (GHSA-q7qp-rjg7-q26m). Audit melaporkan fix tersedia. Dependency belum diubah; evaluasi update dan regresi upload/API diperlukan sebelum akses publik. Tidak menjalankan `npm audit fix` otomatis.
- Backend belum diuji melalui Nginx/HTTPS aaPanel dan belum terhubung MySQL VPS. Pengujian database/restore/login di VPS menunggu tahap berikutnya.
