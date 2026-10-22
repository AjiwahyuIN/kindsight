# Admin internal — tugas 3

Implementasi aktif setelah pengguna mengizinkan kelanjutan portal organisasi. Tugas ini telah diterima pengguna. Flow permintaan demo berikutnya tercatat di demo-requests.md; pengelolaan akses masih tugas berikutnya.

## Route dan sesi

- `/login`: masuk portal organisasi; `/admin/login`: masuk admin internal. Form dan endpoint autentikasi tetap satu implementasi, dengan label/tujuan sesuai pintu masuk.
- `/admin` mengarah ke `/admin/overview`. CMS tetap `/admin/content/:section`, dengan navigasi Overview/Landing content, identitas admin, View website dan Sign out.
- Guest pada area admin diarahkan ke login admin dengan returnTo. ReturnTo hanya menerima route workspace sesuai role, termasuk overview; alias lama/filter/hash dipertahankan.
- Akun yang berhasil login lewat pintu masuk yang salah tetap memiliki sesi role aslinya, disertai penjelasan, link workspace yang benar dan pilihan sign out untuk berganti akun. Tidak ada pemberian role atau penghapusan sesi otomatis.
- Cookie tunggal tetap berlaku per browser/profil. Untuk dua role bersamaan gunakan profil terpisah. Login/logout membuang query privat lintas tab seperti sebelumnya.
- Guard draft CMS melindungi navigasi Overview/View website dan logout. Tidak ada perubahan kontrak publish/revisi atau data pengguna.

## Angka overview

GET `/api/v1/admin/overview` hanya untuk platform_admin, `Cache-Control: no-store`. Satu query MySQL mengambil metadata operasional, tanpa membaca ledger organisasi:

| Angka | Definisi |
| --- | --- |
| Organizations | Seluruh baris organisasi; active hanya `active=TRUE` |
| Organization accounts | Akun role organization_user; enabled hanya akun aktif yang organisasinya juga aktif; akun platform admin tidak dihitung |
| Published landing sections | Baris konten terbit yang cocok dengan 10 section desain yang didukung; key navbar/testimonials memakai navigation/testimonial di database |

Service async TypeScript dan TanStack Query memakai scope private admin. Loading/error/retry, empty organisasi dan waktu pembaruan ditampilkan; shell tetap ada saat refetch. Invalidation CMS yang mencakup query private juga menyegarkan overview. Tidak ada angka marketing/donasi digabung ke overview, tidak ada mutasi organisasi/akun baru.

## Verifikasi

- `npm run test:frontend`: 20 lulus, termasuk admin home, alias dan returnTo lintas role.
- `npm run test:admin`: fixture MySQL terisolasi, guest 401, organisasi 403, hasil sesuai SQL aktual, hitungan enabled berubah saat organisasi dinonaktifkan, no-store dan JSON 404.
- `npm run test:integration`: service React overview menolak organisasi dan berhasil untuk admin; CRUD/report/CMS tetap round-trip MySQL.
- `npm run test:organizations` dan `npm run test:api` lulus. Tidak menjalankan migrasi, seed, reset atau mengganti kredensial.
- Browser: login admin, penjelasan kedua arah untuk role yang salah, login organisasi tetap terpisah, refresh overview, navigasi CMS, Back/Forward, active menu, satu main dan tanpa overflow; keyboard Enter membuka CMS. Draft Keep editing mempertahankan teks; Discard and sign out tidak menerbitkan draft, lalu kembali ke login admin dengan returnTo.
- Viewport kali ini **berhasil** melaporkan 390×844: overview satu kolom, login dan navigasi CMS tanpa overflow; login/logout mobile diperiksa. Batasan override pada tugas sebelumnya tetap merupakan catatan historis, bukan hasil pengujian tugas ini.
- Build React/TypeScript/API dan build legacy diperiksa; SCSS login dipakai bersama legacy sehingga ikut dibangun. Screenshot: `screenshots/admin-overview-desktop.png`, `screenshots/admin-overview-mobile.png`.

QC: `/admin/login` → overview → CMS, identitas/menu, pesan salah role, perlindungan draft/logout, serta desktop/mobile. Belum siap disebut production; flow demo, provisioning/aktivasi/reset akun dan kesiapan rilis tetap mengikuti rencana.
