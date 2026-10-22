> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# CRUD fundraising admin

## Akses

Buka `/login.html`, login dengan akun lokal, lalu pilih **Open management**.
Halaman `/admin.html` mengarahkan pengguna tanpa sesi ke halaman login.
URL tab: `/admin.html?view=donors`, `?view=campaigns`, dan `?view=donations`.

Halaman pengelolaan ini memakai Pug, SCSS BEM, token Kindsight dan komponen button yang tersedia.
Form CRUD tidak memiliki frame khusus dalam konteks desain yang tersimpan, sehingga memakai adaptasi UI untuk administrasi.
Dashboard fundraising utama beserta grafik belum dikerjakan pada tahap CRUD ini dan tetap wajib mengikuti Figma node `675:1767` yang sudah dianalisis.

## Fitur

- Donor: nama wajib; email, telepon dan organisasi opsional. Email bukan identitas donor unik.
- Campaign: nama, deskripsi, target USD, tanggal mulai/akhir dan status draft/active/completed.
- Donasi: nominal USD, status pending/received/cancelled, donor opsional (Anonymous), campaign opsional (General giving), tanggal dan catatan.
- Pencarian, pagination server, pilihan jumlah baris, filter arsip; filter status untuk campaign/donasi.
- Tambah, baca/edit, arsip dan pulihkan. Tidak ada penghapusan permanen dari UI.
- Daftar dan form memiliki status loading, error, hasil kosong, pesan sukses dan validasi field.
- Semua data berasal dari API/MySQL, tanpa fallback mock pada halaman pengelolaan.
- Mobile memakai form satu kolom dan tabel dengan scroll horizontal di dalam region berlabel dan dapat difokuskan.

## API

Semua endpoint berikut memakai prefix `/api/v1/admin`, requireAdmin dan proteksi origin/header untuk mutasi:

| Metode | Path (resource = donors/campaigns/donations) | Fungsi |
| --- | --- | --- |
| GET | /:resource | Daftar `{ data, meta: { page, pageSize, total, pages } }` |
| GET | /:resource/:id | Detail `{ data }`, termasuk record arsip |
| POST | /:resource | Buat, HTTP 201 |
| PATCH | /:resource/:id | Perubahan sebagian field, HTTP 200 |
| DELETE | /:resource/:id | Arsip, HTTP 204 |
| POST | /:resource/:id/restore | Pulihkan, HTTP 200 |

Query daftar: page (mulai 1), pageSize (1–100), search (maksimal 160 karakter), archived=active/archived/all, status (sesuai resource; tidak tersedia untuk donor).
Urutan tetap created_at DESC lalu id DESC. Filter/query yang tidak didukung ditolak.
SQL memakai placeholder untuk nilai; nama tabel/kolom ditentukan whitelist kode, bukan input request.

Nominal dikirim sebagai string desimal, contoh `"45.68"`, maksimal 13 digit integer dan 2 digit pecahan.
Currency hanya USD. Donasi harus lebih besar dari nol; target campaign boleh nol.
Tanggal campaign format YYYY-MM-DD, tanggal donasi ISO UTC dengan Z. Form menampilkan waktu lokal browser dan mengubahnya ke UTC sebelum dikirim.
Donasi received wajib received_at. Saat status berubah, received_at dibersihkan bila bukan received, expected_at dibersihkan bila bukan pending.

## Relasi dan arsip

- Arsip donor/campaign tidak menghapus atau mengubah donasi historis. Nama relasi tetap muncul pada daftar donasi dengan penanda archived.
- Donasi baru atau relasi baru harus memakai donor/campaign aktif; record yang sudah diarsipkan tidak muncul sebagai pilihan baru.
- Saat mengedit donasi historis, relasi arsip yang sudah ada boleh dipertahankan; dropdown menandainya sebagai archived/current.
- Record arsip harus dipulihkan sebelum diedit. Pulihkan donasi mempertahankan relasi historisnya.
- Penulisan dan pemeriksaan relasi memakai transaksi serta row lock; pengambilan daftar menghitung total dan baris dari snapshot yang sama.
- Archive dialog menjelaskan perubahan dan meminta tindakan Archive yang eksplisit. Escape/Cancel tidak mengubah data.

## Verifikasi

```sh
npm run test:api
npm run test:db
npm run test:auth
npm run test:crud
npm run build
```

Total 13 test lulus: 4 HTTP/config, 1 MySQL foundation, 4 auth, dan 4 CRUD integration dengan MySQL nyata.
Test CRUD mencakup endpoint seluruh resource, pencarian literal/SQL-safe, pagination, partial update,
arsip/pulihkan, nominal desimal/besar, anonim, tanggal, status, relasi arsip, foreign reference tidak valid,
akses tanpa sesi serta origin tidak diizinkan. Fixture test dibersihkan berdasarkan ID unik.

Browser: redirect tanpa sesi; login → Open management; tambah/edit/arsip/pulihkan donor;
validasi urutan tanggal dan pembuatan campaign; donasi anonim lalu perubahan donor/campaign,
status received, tanggal dan nominal; reload mempertahankan hasil; arsip/pulihkan dan empty state donasi.
Hasil perubahan diperiksa langsung di MySQL, lalu hanya fixture browser dibersihkan.
Desktop 1280 px dan mobile 320/390 px diperiksa tanpa overflow horizontal pada dokumen.
Dialog dapat ditutup Escape, fokus kembali ke pemicu, dan tombol Save tetap terjangkau dengan Tab pada layar kecil.

## QC berikutnya

Periksa form dan daftar tiga tab, search/filter, pergantian halaman pada dataset lebih besar,
serta arsip/pulihkan. Gunakan donasi anonim dan donasi yang terhubung donor/campaign.
Login dan CRUD telah lolos QC. API ringkasan/tren sudah ditambahkan (lihat dashboard-api.md); editor landing, newsletter/demo, serta tampilan dashboard utama masih tahap selanjutnya.
