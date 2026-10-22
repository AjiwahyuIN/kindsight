> Catatan transisi: dokumen ini merekam implementasi Pug/backend JavaScript sebelumnya. Keputusan frontend aktif adalah React SPA; lihat [rencana migrasi](react-spa-migration.md). Instruksi frontend lama bukan pedoman kode baru. Backend TypeScript/integrasi API dikerjakan pada fase terpisah.

# Editor landing: Navbar, Footer, Hero, Partners, dan Difference

## Penggunaan

1. Login admin lalu buka `/content.html` dan pilih Navbar, Footer, Hero, Logo Partners atau Difference.
   Link tersedia di login, pengelolaan fundraising, dan menu akun dashboard.
2. Edit teks, tujuan tautan, dan susunan item. Gunakan anchor seperti `#about`,
   path lokal seperti `/dashboard.html`, atau URL lengkap http(s). Kosongkan tujuan
   untuk mempertahankan dialog preview. Path tidak otomatis membuat halaman baru.
3. Klik **Save and publish** lalu refresh landing. Tidak perlu build/seed ulang.
   Reset mengembalikan draft ke salinan tersimpan; Reload mengambil revisi terbaru.

Perubahan terbit langsung, tanpa draft terpisah. Menutup halaman dengan perubahan
belum disimpan memunculkan peringatan native browser. Konten teks dipasang dengan
textContent; HTML/rich text tidak dirender. Susunan desain dan file aset asli tetap;
Partners menyediakan pilihan logo dari katalog lokal.

## Scope

- Navbar: brand wordmark, label empat menu, badge Product, label tombol demo,
  isi dropdown (label/deskripsi/tujuan), serta judul/deskripsi/tujuan Company.
  Tiga dropdown masing-masing 1–8 item; ID item stabil dan unik, dibuat otomatis.
  Tujuan terisi dirender sebagai anchor asli; yang kosong tetap preview.
- Footer: heading/deskripsi newsletter, copyright, tiga judul kolom, tautan kolom
  (1–10 per kolom), serta legal (1–6). Item dapat ditambah, diurutkan dan dihapus.
  Jumlah kolom tetap tiga agar mengikuti desain utama.
- Hero: social proof, judul utama (maksimal 120), kata penghubung opsional (30),
  highlight (120), deskripsi (600), label dua CTA (40), serta Overview 1–6 slide
  dengan judul (120) dan deskripsi (600). Slide mendukung tambah/urutkan/hapus/reset.
  Label CTA tidak mengubah aksinya: demo tetap dialog simulasi, Overview tetap
  perkenalan berupa slide; video belum tersedia. Flow donasi pengguna ditunda.
  Ilustrasi dashboard dan angka contoh bukan field editor. API hanya memaparkan
  copy/slide, dan update mempertahankan `preview` lama di MySQL tanpa mengubahnya.
- Partners: `/content.html?section=partners`, 1–20 logo unik dari katalog lokal.
  Nama/alt text wajib 1–100 karakter. Tambah/pilih/urutkan/hapus/reset tersedia;
  satu logo tidak boleh dipakai dua kali. Upload raster tersedia melalui formulir
  khusus. URL gambar eksternal, crop dan ukuran SVG tidak bisa diubah melalui editor. Service menggabungkan ID dari API
  dengan aset dan geometri lokal yang telah disetujui; file SVG tidak diubah.
  Infinity loop, blur/gradient kedua sisi, pause/resume dan dukungan reduced motion
  tetap memakai komponen sebelumnya. Jumlah salinan menyesuaikan lebar viewport,
  termasuk saat sumber hanya berisi satu logo. Salinan memiliki aria-hidden/inert.
- Menu akun Navbar membaca sesi admin melalui `/auth/me`, terpisah dari konten CMS.
  Nama/email aktual dan **Go to dashboard** tampil untuk sesi aktif. Tanpa sesi,
  tersedia **Sign in**; kegagalan jaringan menampilkan pesan dan **Try again**.
  Setiap pembukaan menu memeriksa sesi kembali, termasuk setelah login/logout di
  tab lain. Ikon akun tetap memakai aset generik karena belum ada foto profil.
  Demo/newsletter masih simulasi. Upload saat ini tersedia untuk logo Partners.
- Konten dan metadata logo tersimpan di MySQL lokal; file upload ada di disk lokal.
  Migrasi 002 hanya menambahkan tabel partner_logos, tanpa reseed atau perubahan data fundraising.

## Endpoint dan penyimpanan

| Endpoint | Akses | Perilaku |
| --- | --- | --- |
| GET /api/v1/landing/navbar | Publik | Konten Navbar untuk landing |
| GET /api/v1/landing/footer | Publik | Konten Footer untuk landing |
| GET /api/v1/landing/hero | Publik | Copy, label CTA dan slide Hero, tanpa angka ilustrasi |
| GET /api/v1/landing/partners | Publik | Daftar `{logo, name}` dalam urutan terbit |
| GET /api/v1/landing/difference | Publik | Label, heading dan tiga panel accordion dalam urutan terbit |
| GET /api/v1/admin/landing/:section | Admin | Konten dan revision |
| PUT /api/v1/admin/landing/:section | Admin + proteksi mutasi | Body `{ content, revision }`, validasi penuh, langsung terbit |

Hanya `navbar`, `footer`, `hero`, `partners` dan `difference` didukung. Kunci tabel `landing_sections` adalah
`navigation`, `footer`, `hero`, `partners` dan `difference`. Adapter kompatibel dengan seed awal (array label footer
dan destinations) tanpa menimpa data saat startup. Schema form/validasi ada di
`shared/landing-content.js`; service browser di `src/scripts/services/content.js`.
Partner seed awal berbentuk array metadata aset; adapter membacanya menjadi
`{items:[{logo,name}]}`. Setelah disimpan, MySQL memuat bentuk ringkas ini sementara
geometri/aset tetap berasal dari katalog lokal. Upload memakai migrasi tambahan 002; tidak perlu reseed.

Revision SHA-256 dihitung dari JSON tersimpan. Penyimpanan mengunci baris dalam
transaksi dan membandingkan revision; editor lama menerima 409 dan mempertahankan
draft, sehingga tidak diam-diam menimpa perubahan editor lain. Revision bukan
riwayat revisi/fitur undo. updatedAt menggunakan UTC.

Mutasi memakai sesi admin, Origin yang diizinkan dan X-Kindsight-Request seperti
CRUD. Query diparameterisasi. Field asing, panjang/count invalid, ID duplikat,
javascript/data URLs, URL protocol-relative, backslash, kontrol/whitespace dalam
URL dan kredensial URL ditolak. Link mailto/tel belum didukung dalam editor ini.
Public endpoint tidak mengembalikan sample akun Navbar maupun identitas admin.

## Landing ketika API gagal

Navbar menampilkan pemberitahuan gagal dan dropdown tetap disabled. Footer tetap
menampilkan konten default hasil build, dengan pemberitahuan eksplisit bahwa
konten tersimpan tidak berhasil dimuat. Partners mempertahankan logo default hasil
build dan menampilkan pemberitahuan eksplisit. Hero mempertahankan copy awal hasil build
dengan pemberitahuan eksplisit dan menonaktifkan Overview. Section lain tetap memakai sumber contoh
terpusat. Ini bukan fallback ke angka fundraising atau pemeringkatan palsu.

## Verifikasi dan QC

- Browser: ubah label demo, tautan dropdown/Company, heading/copyright Footer,
  label/tujuan grup dan legal; simpan melalui UI lalu baca hasilnya di landing.
  Semua nilai uji dikembalikan ke isi semula. Refresh editor memuat hasil MySQL.
- UI: tambah/urutkan/hapus item, reset, validasi URL berbahaya, fokus input/Tab,
  serta editor desktop 1440 dan Footer mobile 390/320 tanpa overflow halaman.
  Tata letak editor mobile merupakan adaptasi sesuai kebutuhan admin.
- Tahap Navbar/Footer sebelumnya: 25 test lulus. Tahap Hero menjalankan 12 test
  terarah (11 API/validasi dan 1 integrasi konten MySQL). Test konten mencakup
  Navbar/Footer/Hero, menggunakan baris/admin sementara terpisah
  dan membersihkannya; menguji baca publik, persistensi MySQL, 401/403, validasi,
  revision conflict 409, penolakan section di luar scope, penolakan edit angka
  ilustrasi Hero, serta preservasi preview pada penyimpanan copy.
- Hero browser: publikasi social proof, judul/highlight/deskripsi, label dua CTA
  dan isi Overview; mode satu slide/Done, tiga slide/Previous/Next, batas enam slide,
  tambah/urutkan/hapus/reset, judul whitespace ditolak, serta reload dari MySQL.
  Konten uji dikembalikan. Desktop editor 1440 dan mobile editor/landing 320
  diperiksa tanpa overflow halaman; Tab/Escape dan pengembalian fokus berfungsi.
- Tahap Partners: 13 test terarah lulus (12 API/validasi dan 1 integrasi konten).
  Fixture mencakup keempat section CMS, kompatibilitas seed Partners, nama wajib,
  batas 1–5 item, ID logo duplikat/tidak dikenal, dan penolakan path/field file.
  Browser memeriksa publikasi nama, pemilihan logo, urutan, min satu/max lima,
  duplicate validation dan reset; perubahan uji dikembalikan. Satu logo di desktop
  tetap memenuhi lebar carousel melalui salinan. Pause/resume dan Space diperiksa.
  Editor desktop 1440 dan editor/landing mobile 320 tidak overflow; aset logo
  termuat dan blur 5px/gradient kiri-kanan tetap tersedia. Reduced motion memakai
  perilaku sebelumnya; preferensi OS tidak diubah dalam pengujian ini.
- Build Vite berhasil. Tahap Partners menunggu QC sebelum section berikutnya.

QC yang disarankan: simpan perubahan kecil Navbar/Footer lalu refresh landing;
periksa tujuan tautan, urutan item, reset draft dan susunan mobile. Logo serta
susunan desain awal tetap sama.

Perbaikan menu akun telah diperiksa di browser pada desktop 1440 dan mobile 320:
identitas sesi aktual, tautan dashboard, state pengunjung setelah logout,
login kembali di tab lain tanpa reload landing, ArrowDown, Escape/pengembalian
fokus, serta tidak ada overflow horizontal. Build Vite berhasil. Tidak ada
perubahan backend/database pada perbaikan menu akun ini.

## Upload logo Partners

1. Buka `/content.html?section=partners` setelah login admin.
2. Isi **Organization name**, pilih **Logo file**, lalu **Upload logo**.
3. Logo muncul di katalog beserta preview. Klik **Add item** jika menambah partner,
   pilih logo baru, isi nama/alt text, lalu **Save and publish**. Upload saja tidak
   mengubah landing; draft yang sedang diedit tetap dipertahankan.

PNG, JPG, dan WebP statis diterima, maksimal 2 MB dan 16 megapiksel. PNG transparan
lebih sesuai untuk logo. Server memeriksa isi gambar, menormalkan menjadi PNG
maksimal 1600 × 1600 tanpa memperbesar, dan membuang metadata. SVG/animasi tidak
diterima. Katalog bawaan tetap memakai SVG asli yang sudah disetujui.

- `GET /api/v1/partner-logos`: katalog publik, tanpa path disk.
- `GET /api/v1/partner-logos/:id/file`: file PNG lokal berdasarkan ID yang valid.
- `POST /api/v1/admin/partner-logos`: multipart `name` dan `logo`, sesi admin,
  Origin dan header `X-Kindsight-Request` wajib. Endpoint lain tetap memakai JSON.
- Metadata ada di tabel `partner_logos`; file di `server/storage/partner-logos/`
  yang diabaikan Git. Backup database **dan** folder ini bersama-sama. Tidak ada
  penyimpanan cloud atau penghapusan aset melalui UI pada tahap ini.
- Validasi konten hanya menerima ID katalog yang benar-benar tersimpan. Batas
  partner aktif 20, masing-masing unik. Logo upload menyesuaikan kotak carousel
  maksimal lebar 120 px / tinggi 26 px tanpa mengubah rasio.

Verifikasi upload: `npm run test:uploads` memakai admin/baris/file sementara;
memeriksa PNG/JPG/WebP, normalisasi, persistensi, publikasi ID baru, 401/403,
file palsu/SVG, ukuran berlebih dan dimensi berlebih. Browser menguji upload,
pilih/publikasi, gambar pada carousel dan pause; daftar awal dipulihkan sesudahnya.

Pemeriksaan akhir upload: 18 test lulus (12 API, 4 auth, 1 integrasi konten,
1 integrasi upload). Editor diperiksa pada desktop 1440 dan mobile 320, tanpa
horizontal overflow; Tab dari nama organisasi berpindah ke pemilih file.
Build Vite berhasil. Menunggu QC upload sebelum melanjutkan bagian berikutnya.

Referensi implementasi: [Multer](https://expressjs.com/en/resources/middleware/multer/)
dan [Sharp](https://sharp.pixelplumbing.com/api-constructor/).

## Editor Kindsight Difference

Buka `/content.html?section=difference`. Label (80 karakter), dua baris heading
(masing-masing 120), judul panel (120) dan deskripsi (800) dapat diedit.
Jumlah panel tetap tiga agar mengikuti desain yang disetujui. Tombol Move up/down
mengubah urutan; identitas panel tetap community/service/support dan harus unik.
Panel pertama pada urutan tersimpan terbuka saat landing dimuat. Accordion tetap
mendukung Enter/Space, ArrowUp/Down serta Home/End sesuai komponen sebelumnya.

Service Difference membaca copy dari API. Adapter kompatibel dengan seed lama
(heading array), sedangkan API/editor memakai objek heading `{line1,line2}`.
Penyimpanan memakai revision dan transaksi yang sama dengan editor lain, serta
mempertahankan metadata ikon dan Insight lama. Angka/label ilustrasi Insight dan
ikon tidak termasuk field editor; landing tetap memakai ilustrasi lokal yang
sudah disetujui. Tidak ada migrasi atau reseed untuk section ini. Jika API gagal,
copy awal dari Pug tetap terlihat dengan pesan eksplisit agar pengguna reload.

Verifikasi: 14 test terarah lulus (13 API/schema dan 1 integrasi konten MySQL).
Integrasi mencakup lima section CMS, termasuk 401/403, validasi, konflik revision,
penyimpanan/publikasi urutan, preservasi Insight/ikon, dan penolakan edit ilustrasi.
Browser menguji ubah label/heading/judul/deskripsi, Move up/down, Save, Reload,
Reset, penolakan label whitespace, serta navigasi keyboard sesuai urutan baru.
Konten uji dikembalikan ke semula. Editor desktop 1440 dan editor/landing mobile
320 tidak overflow. Tata letak editor mobile memakai adaptasi satu kolom.
Build Vite berhasil. Menunggu QC Difference sebelum section berikutnya.
