> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Header dan toolbar dashboard

Header/toolbar diizinkan untuk dilanjutkan; revisi menyusul. Buka `/dashboard.html`
dengan sesi admin lokal. Link tersedia pada halaman login dan pengelolaan CRUD.
Tahap berikut telah menambahkan [kartu/grafik/tabel](dashboard-overview.md).

## Acuan desain

- Figma `FkXglC7ztx7bIPEcHOGSHD`, dashboard `675:1767`; header `675:1769`,
  toolbar `675:1809`. MCP saat ini meminta autentikasi ulang; implementasi memakai
  konteks asli dan screenshot yang tersimpan dari analisis sebelumnya.
- Navigasi berbentuk pill di atas, bukan sidebar. Ukuran frame 2070 dinormalisasi
  ke 1440 dengan rasio 16/23, sejalan dengan skala implementasi landing.
- Menggunakan font, token, dan button bersama. Ikon asli dipertahankan tanpa
  mengubah path/root SVG; wrapper melakukan scaling. Sumber aset dicatat dalam
  `src/assets/dashboard/SOURCES.md`.
- Foto akun dan grup Share adalah gambar contoh dari desain, bukan pengguna atau
  kolaborator aktual. Titik merah notifikasi juga elemen contoh desain.
- Desain mobile tidak tersedia dalam konteks analisis. Adaptasi: navigasi pindah
  ke baris berikut dan dapat digeser pada ponsel; profil menjadi avatar; toolbar
  bertumpuk dan kontrol periode tetap dapat digunakan pada layar kecil.

## Perilaku

- Sesi admin dibaca dari API; nama/email aktual, link CRUD, dan sign out tersedia.
  Sesi tidak valid diarahkan ke login; kegagalan koneksi menampilkan opsi reload.
- Periode menggunakan UTC, awal/akhir inklusif pada form. Service mengubah akhir
  menjadi eksklusif sesuai kontrak API; maksimum 366 hari. URL menyimpan filter
  dan mempertahankannya saat reload. Default mengikuti bulan berjalan dari API.
- Ekspor mengunduh JSON ringkasan API dalam USD beserta metadata periode, bukan
  angka contoh Figma. Tombol dinonaktifkan ketika data belum tersedia.
- Share menyalin URL dengan filter. Jika clipboard tidak tersedia, dialog
  menyediakan link yang dapat disalin. Akses link tetap memerlukan sesi admin.
- Print memakai dialog cetak browser dan stylesheet cetak. Kartu laporan telah
  ditambahkan pada tahap overview; pengujian cetak fisik belum dilakukan.
- Edit judul dan favorit hanya berlaku sampai reload. Keduanya belum dianggap
  sebagai preferensi tersimpan. Lima ikon navigasi tanpa label bisnis, settings,
  dan notifications membuka dialog preview; tujuan/fungsinya perlu dipastikan.
- Native dialog mendukung Escape dan mengembalikan fokus ke pemicu. Menu akun
  ditutup dengan Escape atau klik di luar. Status/error memakai pengumuman aksesibel.

## Verifikasi dan QC

- Build Vite berhasil, termasuk entry `dashboard.html`.
- Browser diperiksa pada lebar 320, 390, 768, 1280, dan 1440 px tanpa overflow
  horizontal halaman; aset termuat. Navigasi mobile memiliki scroll internal.
- Filter valid, akhir sebelum awal, cancel, filter setelah reload, ekspor JSON,
  salin link, edit judul, favorit, preview, Escape/pengembalian fokus, navigasi
  CRUD, sign out, proteksi sesi, dan masuk kembali telah diperiksa.
- QC: posisi/ukuran header dan toolbar terhadap Figma, susunan mobile, menu akun,
  filter tanggal, dan isi ekspor. Kartu/grafik/tabel dicatat pada panduan overview.
