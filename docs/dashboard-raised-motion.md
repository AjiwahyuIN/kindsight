# Microinteraction Total Raised

Scope: kartu Total Raised dan grafik tren portal organisasi. Campaign/gauge, kartu lain, API dan database tidak diubah. Menunggu QC tempo animasi pengguna.

- Refresh/mount: setelah laporan diterima, nominal bergerak dari nol ke nilai aktual dan grafik terbuka selama 850 ms dengan ease-out. Interpolasi nominal memakai integer cents; screen reader mendapat nilai aktual, bukan hitungan sementara.
- Daily/Monthly tetap tersimpan di URL. Instance Chart.js dipertahankan dan diperbarui agar grafik bertransisi tanpa melepas canvas. Total yang sama tidak dihitung ulang; total berbeda pada periode baru bergerak dari nilai sebelumnya.
- Refetch otomatis pada tampilan yang sama memperbarui nilai tanpa replay animasi. Reduced motion melewati counter/transisi; RAF, chart dan listener dibersihkan saat unmount.
- Laporan sebelumnya tetap terlihat selama request hanya dalam akun/organisasi yang sama. Metadata interval/periode tetap mengikuti laporan yang sedang terlihat. Status updating, label laporan lama, error dan retry membedakan data lama dari hasil request baru. Snapshot lokal mempertahankan laporan terakhir ketika request gagal atau dicoba ulang.
- Ekspor tidak tersedia ketika hasil masih placeholder atau error agar data lama tidak diekspor sebagai periode baru. Tidak ada fixture sebagai fallback API.
- Digit tabular dan slot nominal cadangan menjaga ruang counter; tinggi status minimum membatasi pergeseran selama request normal.

## Verifikasi 22 Oktober 2026

- `npm run build`, `npm run build:legacy`, dan `npm run test:frontend`: lulus, 24 tes frontend. Tes tambahan membatasi retensi laporan ke scope akun/organisasi dan resource yang sama.
- Browser 1280×720 dan 390×844: refresh counter terlihat di tengah animasi ($2,059.29 menuju nilai aktual $5,250.00); Daily/Monthly mengganti grafik/URL sementara total tetap $5,250.00 tanpa recount. Mobile tidak overflow; console tidak mencatat error/warning pada pemeriksaan.
- Error jaringan, refetch otomatis dan pengaturan reduced motion tidak diinjeksi pada browser dalam tugas ini; perilakunya ditangani dalam kode, bukan diklaim telah diuji manual.
- Bukti visual: `screenshots/dashboard-raised-counting.png` dan `screenshots/dashboard-raised-monthly.png`.

## Revisi rolling digits dan line reveal

Menggantikan counter interpolasi 850ms sebelumnya: tiap digit memakai reel vertikal satu putaran menuju digit aktual, 1050ms dengan stagger35ms dan jeda awal90ms. Simbol USD/pemisah tetap diam; slot digit tetap. Web Animations hanya menggerakkan transform, tanpa render React per frame. Nilai aksesibel tetap nominal aktual integer cents. Total sama dan background refetch tidak replay; reduced motion langsung menampilkan target. Animation/RAF/listener dibatalkan saat unmount atau perubahan target.

Grafik pada refresh dibuka melalui clipping kiri→kanan selama1200ms; garis mendahului bar sedikit, sumbu/label tetap terlihat. Pergantian interval mempertahankan morph Chart.js1050ms, tanpa mereset nominal yang sama. Ini belum mengimplementasikan pengelompokan harian→bulanan khusus atau pulse/dropdown check yang sebelumnya baru berupa ide.

Browser desktop1280×720/mobile390×844: fase awal menampilkan reel nol dan grafik yang baru terbuka sebagian; akhir $5,250.00 utuh. Daily/Monthly, URL, console dan overflow diperiksa. Build React/legacy dan24 tes frontend lulus. Reduced motion/error/refetch tetap belum diuji melalui injeksi browser. Bukti hasil akhir: screenshots/dashboard-rolling-reveal.png. Tunggu QC tempo/karakter animasi.
