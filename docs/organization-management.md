# Pengelolaan organisasi — tugas 5a

Pengguna mengizinkan kelanjutan pengelolaan akses. Bagian ini menangani organisasi terlebih dahulu, mengikuti workflow satu bagian → QC. Pengelolaan akun pengguna/invitation/password belum ditambahkan.

## Kemampuan aktif

- `/admin/organizations`: direktori organisasi dengan nama/ID, jumlah akun organization_user (aktif maupun nonaktif), status dan tombol aktif/nonaktif. Tidak menampilkan ledger atau isi fundraising pelanggan.
- Tambah organisasi dengan nama 1–160 karakter. Organisasi baru aktif dengan nol akun; tidak membuat kredensial, mengundang pengguna, mengirim email atau menghubungkan permintaan demo secara otomatis. Nama boleh sama; ID membedakan organisasi, karena belum ada ketentuan keunikan nama bisnis.
- Cari nama, filter all/active/inactive, pagination 10/25/50. Nilai tervalidasi/canonical berada pada URL, filter/search/pageSize mengulang page 1; refresh dan riwayat browser tetap bekerja.
- Aktif/nonaktif memakai dialog konfirmasi yang menjelaskan dampak. Nonaktif mengubah akses dan mencabut seluruh sesi organisasi dalam transaksi yang sama. Akun dan histori donor/campaign/donasi tetap disimpan. Aktivasi tidak memulihkan sesi yang telah dicabut; pengguna login ulang.
- Tidak ada delete, rename, pemindahan ledger, perubahan role/org akun atau fitur pengelolaan akun pada bagian ini.

## Backend dan konsistensi

GET list/detail, POST create dan PATCH status `/api/v1/admin/organizations` hanya untuk platform_admin. Role/session/Origin/header/JSON tetap diperiksa; payload status wajib boolean dan hanya field yang didukung. Guest 401, organisasi 403; admin tetap tidak memiliki akses ledger organisasi.

Migrasi tambahan `006-organization-revisions` menambah revision default 1; tidak mengubah migrasi 001–005 atau reset/reseed/password/ID lama. Readiness dan db:check memerlukan schema terbaru. PATCH wajib If-Match; konflik 409 menjaga pilihan aksi sampai admin memuat detail terbaru. Jika organisasi sudah berada pada status tujuan setelah reload, aksi simpan dinonaktifkan dan admin bisa menutup konfirmasi.

UUID submission untuk create menjaga retry ID+nama sama tidak membuat duplikat. ID sama dengan nama berbeda ditolak 409; tutup/buka form untuk permintaan baru. Ini bukan aturan nama organisasi unik.

Penyimpanan sesi login memeriksa ulang status akun/organisasi dengan lock organisasi lebih dahulu sebelum lock akun dan INSERT. Urutan lock cocok dengan penonaktifan sehingga login yang telah memverifikasi password tidak dapat menyisipkan sesi setelah penonaktifan berkomit. Sesi yang dicabut tetap tidak berlaku setelah reaktivasi. Request yang sudah lolos autentikasi sebelum perubahan tidak dibatalkan secara retroaktif.

React memakai service async bertipe dan TanStack Query private admin. Create/status menginvalidasi query private (termasuk overview dan referensi) dan menyiarkan perubahan lintas tab. Pemeriksaan sesi pada focus/request berikutnya menolak akun organisasi nonaktif. Shell tetap ada ketika refetch, dengan loading/empty/error/retry/success dan status mutasi. Draft create dilindungi pada Back/navigasi/unload; Close sengaja membuang draft. Konfirmasi status fokus awal Cancel, Escape mengembalikan fokus; dialog tidak ditutup selama mutasi.

## Pemeriksaan

- `test:organization-management`: MySQL terisolasi untuk hak akses CRUD/status, origin/header, input/pagination, idempotensi, If-Match/409/404, pencabutan sesi langsung (diperiksa sebelum middleware auth melakukan prune), login nonaktif, reaktivasi tidak memulihkan cookie lama, akun organisasi lain tetap aktif, metadata overview dan histori/relasi donasi tetap utuh. Login yang menunggu lock organisasi ditolak setelah nonaktif.
- `test:integration`: service React → API → MySQL create/list/detail/status/konflik, bersama CRUD/report/CMS/demo yang sudah ada.
- `test:frontend`: 22 pengujian termasuk filter organisasi dan returnTo sesuai role. `test:auth` (4), `test:organizations`, `test:admin`, `test:demo` dan `test:api` lulus.
- `npm run build`: TypeScript frontend/API dan Vite lulus. Build legacy juga lulus; tidak menambah dependency atau menghapus kompatibilitas lama.
- Browser desktop: create organisasi tanpa akun, nonaktif/aktif dengan konfirmasi, pencarian/status/refresh/empty, draft Back → Keep editing, Escape/fokus dan konflik dua tab → reload status terbaru. Pengujian mutasi browser hanya pada organisasi QC kosong, bukan organisasi showcase yang dipakai pengguna.
- Browser 390×844: menu/direktori/filter, form tambah, konfirmasi dan tabel scroll horizontal; satu main dan tanpa overflow halaman. Pengaturan viewport direset setelah pemeriksaan.
- Seluruh fixture backend dan organisasi browser QC kosong dibersihkan. Nama/akun/password/ledger pengguna tidak diubah. Screenshot mobile memakai organisasi QC kosong saat pemeriksaan; screenshot direktori desktop terakhir memakai data yang dipertahankan.

QC: `/admin/organizations`, tambah organisasi, filter/refresh, dialog aktif/nonaktif dan mobile. Setelah bagian ini diterima, lanjut pengelolaan akun pengguna yang terikat ke satu organisasi; belum siap disebut production.
