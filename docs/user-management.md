# Pengelolaan akun pengguna — tugas 5b

Pengguna mengizinkan kelola akun setelah pengelolaan organisasi. Bagian ini menunggu QC, bukan pernyataan siap production.

## Flow aktif

- `/admin/users`: akun role organization_user saja; akun platform_admin tidak ditampilkan dan tidak dapat diubah melalui API ini.
- Tambah: nama, email unik seluruh akun dan satu organisasi aktif. Role tetap organization_user; organisasi/role/nama/email/password tidak dapat diubah setelah pembuatan melalui bagian ini. Tidak ada public signup atau hubungan otomatis dari demo request.
- Password awal acak dihasilkan saat submit dengan Web Crypto (24 byte, dikodekan menjadi 48 karakter hex). Server hanya menyimpan scrypt hash. Setelah akun tersimpan, dialog hasil menyediakan password tersamarkan dengan Show/Hide; simpan secara aman sebelum ditutup. Tidak mengirim email atau undangan.
- Password awal bukan token berjangka waktu; versi ini belum memiliki reset/recovery atau kewajiban mengganti password pada login pertama. Menutup/refresh meninggalkan dialog menghilangkan akses ke password awal melalui UI ini. Kebutuhan aktivasi/reset/delivery production tetap tahap berikut.
- Daftar menampilkan nama/email, organisasi, status akun dan keterangan organisasi nonaktif. Filter status adalah status akun, bukan akses efektif: akun aktif tetap diblokir bila organisasinya nonaktif.
- Search nama/email, filter organisasi/status, page/pageSize pada URL tervalidasi; reset halaman saat filter berubah. Pilihan organisasi memuat seluruh halaman metadata melalui service async, termasuk organisasi nonaktif untuk filter; pilihan nonaktif tidak bisa dipakai untuk create.
- Konfirmasi aktif/nonaktif. Nonaktif mencabut seluruh sesi akun dalam transaksi yang sama. Akun lain dan ledger organisasi dipertahankan. Aktivasi membutuhkan organisasi aktif, tidak memulihkan sesi lama, dan tidak mengubah password.
- Tidak ada delete, pindah organisasi, ganti role, edit profil, reset password atau manajemen admin internal dalam scope ini.

## Kontrak dan proteksi

GET list/detail, POST create dan PATCH status `/api/v1/admin/users` hanya platform_admin. Guest 401; organization_user 403; target platform_admin pada detail/PATCH diperlakukan 404. Origin/header/JSON, parameter SQL terikat, validasi email/panjang/field/status dan If-Match tetap wajib. Role/org/perubahan password lewat payload status ditolak.

Migrasi tambahan `007-account-revisions` menambah revision default 1 pada tabel kompatibilitas `admins`. Migrasi 001–006, akun lama, password hash, ID dan ledger tidak diubah/reset/reseed. Readiness/db:check memerlukan schema terbaru. PATCH memakai revisi numerik; 409 mempertahankan aksi, reload mengambil detail terbaru. Perubahan akun dan pembuatan memegang lock organisasi lebih dahulu lalu akun agar konsisten dengan deactivation/login.

Create menggunakan UUID submission yang tetap pada retry. Retry ID, field dan password sama mengakui akun yang telah dibuat tanpa menimpa password/status; payload berbeda ditolak 409. Email duplikat (termasuk beda kapital) ditolak tanpa overwrite. Response API/list/detail tidak mengandung plaintext atau hash password.

Password awal hanya pada ref dialog dan payload POST; bukan di localStorage/sessionStorage/IndexedDB, URL, query results, mutation variables atau BroadcastChannel. Mutation menerima field publik dan membaca password dari ref ketika dipanggil. Ref dibersihkan saat dialog tutup/unmount. Form mempertahankan draft/password di memori saat gagal agar retry aman. Tidak mencetak rahasia ke log/screenshot; screenshot panel hasil memakai password tersamarkan.

TanStack Query private admin menyertakan parameter daftar; mutasi menginvalidasi seluruh query private termasuk overview, direktori organisasi dan pilihan referensi, serta menyiarkan perubahan lintas tab. Sesi tetap dibersihkan saat logout/nonaktif. Loading/empty/error/retry/success dan pending tersedia; shell dipertahankan saat refetch. Draft create memakai guard; meninggalkan panel password menampilkan peringatan bahwa akun sudah tersimpan namun password tidak bisa diperoleh ulang di sini.

## Verifikasi

- `test:users`: fixture MySQL terisolasi mencakup provisioning/login, password hash/projection tanpa rahasia, idempotensi, email duplikat, input/role/org injection, inactive/missing organization, akses guest/org, larangan target admin, list/search/organization/status/pagination, Origin/header, If-Match/revisi, semua sesi dicabut langsung, akun lain tetap login, reaktivasi tidak memulihkan cookie/password lama tidak berubah, race login/nonaktif, serta larangan DELETE.
- `test:integration`: service React → API → MySQL untuk create/list/detail/status/revisi dan opsi organisasi. CRUD/report/CMS/demo tetap lulus.
- `test:frontend`: 23 pengujian, termasuk filter/UUID/returnTo dan generator password. `test:auth`, `test:organization-management`, `test:organizations`, `test:admin`, `test:demo`, `test:api` lulus.
- Build React memeriksa TypeScript frontend/API dan Vite. Build legacy juga lulus, tanpa dependency baru.
- Browser desktop: create akun hanya dalam organisasi QC kosong, panel hasil/password tersamarkan, nonaktif/aktif, filter/status/search/refresh/empty dan error email duplikat mempertahankan draft. Konflik dua tab → 409 → reload mempertahankan tujuan dan menonaktifkan tombol bila status sudah sesuai.
- Mobile 390×844: form, menu/filter/tabel scroll horizontal, konfirmasi/fokus/Escape, satu main dan tanpa overflow halaman. Draft Back → Keep editing mempertahankan isian. Viewport direset.
- Akun/organisasi browser QC dan semua fixture test dibersihkan. Akun team/admin lokal serta password/ledger pengguna dipertahankan. Screenshot mobile/panel hasil menunjukkan fixture saat pengujian; direktori desktop akhir memakai akun lama yang dipertahankan.

QC: admin Users → Add user (pilih organisasi aktif) → simpan password awal sebelum Close → login melalui `/login`; cek filter/refresh dan aktif/nonaktif. Untuk peran bersamaan gunakan profil browser terpisah karena cookie sesi bersama. Setelah QC, lanjut perencanaan aktivasi/reset password dan kesiapan rilis sesuai keputusan produk.
