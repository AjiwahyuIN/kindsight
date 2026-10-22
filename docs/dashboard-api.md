> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# API data dashboard

## Scope tahap ini

Tiga endpoint laporan tersedia dengan sesi admin. Tahap frontend berikut telah
menghubungkan summary, trend dan campaign ke `/dashboard.html`; lihat [panduan overview](dashboard-overview.md).
Tampilan berikutnya tetap wajib mengacu pada hasil analisis Figma node `675:1767`, file `FkXglC7ztx7bIPEcHOGSHD`.
CRUD telah lolos QC dan tidak diubah tampilannya pada tahap ini.

## Endpoint dan akses

Prefix `/api/v1/admin/dashboard`; semua endpoint GET membutuhkan cookie sesi admin aktif.
Akses melalui proxy Vite `/api`, dengan backend lokal port 3101.
Tanpa sesi mendapat 401. Campaign ID tidak ditemukan mendapat 404, bukan angka nol.
Periode/filter invalid mendapat 400. Tidak ada fallback ke mock jika MySQL/API gagal.

| Endpoint | Fungsi |
| --- | --- |
| /summary | Total received, jumlah donasi, donor dikenal unik, jumlah donasi anonim, rata-rata, total pembanding, growth |
| /trend | Total received dan jumlah donasi per hari/bulan; bucket kosong terisi nol |
| /campaigns | Progres lifetime campaign terhadap target, dengan pagination/filter |

Service frontend: `src/scripts/services/dashboard.js`, memakai `apiRequest` dan cookie yang sama dengan CRUD.
Fungsi: getDashboardSummary, getDashboardTrend, getCampaignProgress. Return berupa `{ data, meta }`.
Signal AbortController dapat digunakan saat pergantian filter.

## Filter periode

Summary/trend menerima:

- `from=YYYY-MM-DD` inklusif dan `to=YYYY-MM-DD` eksklusif, keduanya wajib diberikan bersama bila memakai periode khusus.
- Bila tidak diberikan: bulan kalender UTC saat request (awal bulan sampai awal bulan berikutnya).
- Panjang 1–366 hari. Perbandingan menggunakan periode sebelum from dengan jumlah hari yang sama.
- `campaignId=<UUID>` untuk satu campaign; campaign arsip tetap boleh dipilih untuk melihat riwayat.
- `campaignId=general` untuk donasi tanpa campaign; tanpa campaignId berarti semua campaign dan general giving.
- Khusus trend: `interval=day` (default) atau `interval=month`.

UTC adalah default teknis API awal yang dinyatakan eksplisit dalam `meta.timeZone`, bukan konfirmasi zona waktu bisnis permanen.
Client tidak boleh menganggap label tanggal laporan sebagai zona waktu lokal browser.
Timezone lain belum didukung; parameter yang tidak dikenal ditolak.
Jika UI memakai tanggal akhir inklusif, adapter harus mengirim hari berikutnya sebagai `to`.

Contoh:

```text
/api/v1/admin/dashboard/summary?from=2026-10-01&to=2026-11-01
/api/v1/admin/dashboard/trend?from=2026-10-01&to=2026-11-01&interval=day
/api/v1/admin/dashboard/campaigns?page=1&pageSize=10
```

Untuk contoh Oktober 2026, pembanding berdurasi 31 hari adalah 31 Agustus–1 Oktober (akhir eksklusif).
Ini berbeda dari membandingkan bulan kalender September yang hanya berdurasi 30 hari; aturan dicantumkan di `meta.comparison`.

## Definisi angka yang diimplementasikan

Hanya donasi berstatus **received**, tidak diarsipkan, dan received_at dalam rentang yang dihitung.
Donasi pending/cancelled diabaikan. Arsip donor/campaign tidak menghilangkan donasi historis.

| Field summary | Definisi |
| --- | --- |
| totalRaised | SUM(amount) dalam periode/filter |
| donationCount | Jumlah donasi received dalam periode/filter |
| knownDonorCount | COUNT DISTINCT donor_id non-NULL dalam periode/filter; bukan jumlah seluruh profil donor |
| anonymousDonationCount | Jumlah donasi dengan donor_id NULL; bukan estimasi jumlah individu anonim |
| averageDonation | Rata-rata nominal per donasi received, dibulatkan dua desimal |
| previousTotalRaised | Total received pada periode pembanding dengan filter campaign yang sama |
| growthPercent | (current − previous) / previous × 100, dua desimal; null bila previous nol |

Nominal dan persentase dikirim sebagai **string desimal**. Agregasi uang menggunakan DECIMAL di MySQL;
persentase menggunakan aritmetika integer BigInt dengan pembulatan half-up. Tidak memakai float untuk perhitungan uang.
Periode kosong menghasilkan total/rata-rata `"0.00"` dan count 0.
Zero baseline menghasilkan growth null, termasuk saat kedua total nol; bukan growth 0% atau infinity.

`unavailableMetrics` pada summary menandai pendingAmount, majorGifts, forecast, aiInsights dengan value null dan reason.
Pending amount menunggu penetapan tanggal acuan, major gifts menunggu threshold, dan forecast/AI memerlukan model/data sendiri.
Angka ilustrasi Figma tidak digunakan sebagai pengganti hasil perhitungan atau data yang belum tersedia.
Label/metrik bisnis final tetap perlu ditinjau ketika memasangkan API dengan desain dashboard.

## Tren

Setiap titik berisi bucket (YYYY-MM-DD), totalRaised string, donationCount integer.
Bucket bulanan diberi tanggal awal bulan. Jika from/to memotong bulan, total hanya menghitung potongan rentang tersebut;
`meta.partialBuckets = clipped_to_period` menyatakan hal ini. Tidak ada donasi di luar periode yang ikut terhitung.
Bucket kosong tetap dikirim dengan `"0.00"` dan count 0, sehingga Chart.js dapat mempertahankan sumbu waktu.

## Progres campaign

Filter: page, pageSize (1–100), search (nama campaign, maksimal 160 karakter), status,
archived=active/archived/all (default active), campaignId opsional UUID.
Endpoint ini menolak filter from/to agar progres lifetime tidak tertukar dengan ringkasan periode.
General giving tidak memiliki campaign/target, sehingga `campaignId=general` ditolak di endpoint ini.

Setiap campaign memuat target_amount, totalRaised, donationCount, progressPercent dan informasi campaign.
Total mencakup received tidak diarsipkan sepanjang umur data campaign, tanpa membatasi received_at berdasarkan tanggal campaign.
Target nol menghasilkan progressPercent null. Progress boleh melebihi 100% (contoh 250.00), tidak dipotong oleh API.
Jika desain memakai progress bar, lebar visual dapat dibatasi 100% oleh komponen sambil tetap menampilkan nilai sebenarnya.
Campaign tanpa received menghasilkan total `"0.00"`, count 0 dan progress `"0.00"` bila target positif.
Campaign yang diarsipkan dapat muncul melalui archived=archived/all.

## Konsistensi dan validasi

- Summary current/previous berasal dari snapshot MySQL yang sama.
- Progres count dan baris pagination juga memakai snapshot yang sama.
- Tiap endpoint memiliki generatedAt; request terpisah dapat melihat pembaruan yang terjadi di antaranya.
- Validasi ketat menolak tanggal kalender yang tidak valid, tipe/parameter tidak dikenal, UUID salah dan range berlebihan.
- Identitas campaign dibedakan dari hasil kosong; campaign yang ada tetapi tidak punya donasi menghasilkan nol.
- Endpoint hanya membaca data. Tidak ada perubahan schema atau seed ulang pada tahap ini.

## Hasil verifikasi

```sh
npm run test:api
npm run test:db
npm run test:auth
npm run test:crud
npm run test:dashboard
npm run build
```

21 test lulus: 7 HTTP/config/aturan laporan, 1 MySQL foundation, 4 auth, 4 CRUD, 5 dashboard MySQL integration.
Pengujian mencakup status/arsip, batas tanggal eksklusif, donasi anonim, desimal, leap day,
bucket kosong, periode kosong, zero baseline, zero target, progress >100%, filter, pagination,
akses tanpa sesi, dan perubahan CRUD yang langsung memengaruhi laporan. Fixture sementara dibersihkan berdasarkan ID.

Verifikasi HTTP nyata melalui proxy Vite → Express → MySQL untuk seed Oktober 2026:

- totalRaised USD 5250.00 (5000.00 + 250.00)
- previousTotalRaised USD 10000.00, growthPercent -47.50
- 31 titik harian, total tren sama dengan total ringkasan
- 2 campaign tersedia

Respons lengkap hasil verifikasi disimpan di `/tmp/kindsight-dashboard-api-verification.json`.
Build frontend tetap berhasil; tampilan landing, login dan CRUD tidak diubah.

## Tahap berikutnya

Pasangkan metrik yang tersedia dengan komponen dashboard dari analisis Figma.
Tetapkan cara menampilkan metrik yang belum memiliki definisi, kemudian implementasikan tampilan dashboard per bagian untuk QC.
Editor konten landing dan penyimpanan newsletter/demo melalui form tetap pekerjaan terpisah berikutnya.
