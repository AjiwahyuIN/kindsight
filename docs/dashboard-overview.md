> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Dashboard overview

Melanjutkan header/toolbar sesuai instruksi pengguna, dengan revisi/tambahan fitur
ditunda. Buka `/dashboard.html` setelah login. Tidak mengubah backend/schema/seed.

## Desain dan data

- Acuan: konteks high-fidelity dan screenshot asli Figma `675:1767`, panel utama
  `675:1841`. MCP dicoba kembali dan masih meminta autentikasi. Aset asli dari
  konteks tersimpan berhasil diunduh; ikon identik dari Hero digunakan ulang
  setelah pemeriksaan SHA-256. Tidak menggunakan screenshot sebagai elemen UI.
- Struktur: Total Raised dan kartu campaign dalam panel kiri; Major Gift dan
  AI Insight di kanan atas; tabel di kanan bawah. Ukuran dinormalisasi 16/23
  seperti header. Reuse font, token, button, mixin ikon, dan service API.
- Total Raised, growth, hitungan received/known donor/anonymous donation mengikuti
  summary API. Angka Figma tidak dipakai sebagai fallback saat API gagal.
- Tren campuran bar/line Chart.js memakai bucket harian atau bulanan, USD/UTC.
  Tooltip menampilkan tanggal, nominal dan jumlah donasi. Tabel alternatif
  menyediakan data yang sama untuk keyboard/screen reader. Nilai uang dikonversi
  ke Number hanya untuk tampilan/grafik, bukan agregasi keuangan di backend.
- Perubahan periode toolbar memperbarui summary dan tren; request lama dibatalkan.
  Growth null disembunyikan. Periode kosong menampilkan total nol dan pesan kosong.
- Kartu campaign memakai target, received total, donation count dan progressPercent
  dari endpoint campaign. Picker menampilkan hingga 100 campaign nonarsip terbaru;
  seluruh campaign dapat dikelola lewat CRUD. Scope **lifetime**, tidak mengikuti
  periode toolbar. Gauge dibatasi visual 100%, label mempertahankan persentase API
  sebenarnya. Target nol diberi label tidak tersedia.
- Foto campaign, foto dekoratif tim dan foto AI memakai aset asli. Mereka bukan
  foto campaign/donor aktual. Donor aktual menggunakan inisial karena belum ada
  field foto profil. Label New Giving Velocity diganti menjadi Target reached;
  ini progres target campaign, bukan metrik velocity yang belum didefinisikan.
- Major Gift/forecast/pending/AI menampilkan `—` dan penjelasan belum tersedia;
  tidak menjalankan generator AI. Tombol membuka alasan dari unavailableMetrics
  pada API. Gauge Major Gift netral, tidak menunjukkan hitungan/ranking palsu.
- Area Top Prospects sementara berisi direktori donor dari CRUD dengan keterangan
  scoring belum terhubung. Capacity/last gift/engagement `—`; Profile = aktif,
  bukan tahap prospek. Search dan pagination melalui service; tidak menghitung
  last gift atau kemampuan donasi berdasarkan asumsi.

## Responsive dan verifikasi

- Mobile merupakan adaptasi: kartu satu kolom, tabel memiliki scroll internal.
  Tablet menempatkan Total Raised dan campaign berdampingan, lalu insight/table.
- Diperiksa di browser pada 320, 390, 768, 1280, 1440 px: tanpa overflow horizontal
  halaman, seluruh gambar termuat, ukuran canvas responsif.
- Diperiksa: summary/tren Oktober 2026 USD 5250, growth -47.50%; interval bulanan
  menghasilkan satu bucket USD 5250/2 donasi; campaign 10% dan 40%; periode kosong
  menampilkan USD 0 dan growth hilang; pencarian donor cocok/kosong; dialog metrik,
  Escape dan pengembalian fokus. Dua donor seed hanya satu halaman; navigasi
  pagination aktif belum diuji dengan fixture lebih dari lima donor.
- `npm run build` berhasil; tujuh test `npm run test:api` lulus. Tidak menjalankan
  ulang test mutasi database karena perubahan hanya frontend.
- Revisi visual dan definisi bisnis lanjutan mengikuti instruksi pengguna berikutnya.

Dokumentasi Chart.js: [mixed charts](https://www.chartjs.org/docs/latest/charts/mixed.html)
dan [doughnut charts](https://www.chartjs.org/docs/latest/charts/doughnut.html).
