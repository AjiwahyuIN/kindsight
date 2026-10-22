> Catatan historis fase mock. **Status aktif:** service telah diintegrasikan ke REST/MySQL; lihat [React API/database](react-api-database.md). Akun dan penyimpanan demo di bawah hanya referensi pengujian.

# CRUD dan editor section React — menunggu QC

Pengguna mengizinkan melanjutkan CRUD dan editor section sekaligus. Ini fase
frontend React; tidak mengubah backend, shared schema legacy, data MySQL, seed,
migration, upload disk lama atau menghubungkan API. Buka port 5176 setelah login
akun demo yang sama. Tampilan memakai _admin.scss/_content-editor.scss, font/token,
Button/Dialog dan adaptasi admin Pug yang tersedia, tanpa library/dependency baru.

## Rute dan scope

- /admin/donors, /admin/campaigns, /admin/donations: tambah, daftar, edit,
  arsip/pulihkan. Tidak ada penghapusan permanen. Shell admin khusus, satu main.
- /admin/content/:section: navbar, hero, partners, difference, about, solutions,
  testimonials, missions, sectors, footer. Section/entity yang tidak dikenal 404.
- Rute admin terlindungi marker sesi contoh. Alias admin.html?view=... dan
  content.html?section=... tetap menuju URL bersih, termasuk section baru.
- Link/NavLink untuk navigasi internal; halaman admin/editor lazy-loaded.
  Search, archived, status, page dan pageSize berada di URL. Search/filter/ukuran
  halaman menghapus page; empty/out-of-range menyediakan jalan kembali ke awal.
- Tidak mengembalikan panel QC ke landing. Demo/newsletter/flow donate tidak diubah.

## Penyimpanan contoh dan konsistensi

Kontrak di services/fundraising-types.ts dan content-types.ts. Service exports
fundraising/content tetap asynchronous dan dapat diganti adapter REST nanti.
Data awal dari fixture React terpusat, bukan database legacy. IndexedDB
kindsight-react-demo-v1 menyimpan satu snapshot versi data, fundraising, konten
berevisi dan katalog upload. Read/write menggunakan transaksi; setiap hasil
merupakan clone agar draft/komponen tidak memutasi snapshot tersimpan.

Persistensi berlaku per origin browser: dev 5176 dan preview 5180 berbeda.
Tidak menulis file project atau menyalin data ke MySQL. Marker sesi sessionStorage
masih per tab; logout membersihkan cache privat dan marker, bukan data contoh
tersimpan. Bila browser storage gagal, service menampilkan error dan menjaga draft,
bukan diam-diam berpindah ke storage sementara. Adapter memory hanya eksplisit
untuk unit test di luar browser.

Dashboard membaca ledger tersimpan yang sama. Ringkasan/tren mengikuti received
nonarsip dalam periode UTC; campaign lifetime dan direktori menggunakan data CRUD.
Nominal string desimal tetap dijumlahkan dengan BigInt dalam sen. Angka ilustrasi
landing dan Major Gift/forecast/pending/AI tidak dijadikan laporan keuangan.

Mutasi fundraising menginvalidasi seluruh query fundraising/referensi dan domain
dashboard (summary/tren, campaign, direktori). CMS menginvalidasi editor section
dan query publik terkait. BroadcastChannel memberi invalidasi ke tab lain;
focus refresh menjadi pelengkap. Listener/channel dibersihkan saat unmount dan
pesan dari instance sendiri diabaikan. Tidak ada websocket/API baru.

## CRUD

- Donor: nama wajib, email/telepon/organisasi opsional; email bukan kunci unik.
- Campaign: nama, deskripsi, target USD boleh nol, tanggal mulai/akhir valid
  dan berurutan, status draft/active/completed.
- Donasi: nominal >0, donor opsional Anonymous, campaign opsional General giving,
  status pending/received/cancelled, received_at wajib untuk received. Input waktu
  lokal diubah menjadi ISO UTC. Tanggal status lain dibersihkan saat save.
- Nominal maksimal 13 integer dan 2 pecahan; notasi eksponen/negatif ditolak.
  Validasi server-contoh mengembalikan error field; draft tetap ada saat gagal.
- Pencarian literal mencakup field record serta nama relasi donasi. Daftar memakai
  snapshot count/baris yang sama; sort createdAt/id menurun. Pilihan 10/25/50 baris.
- Arsip donor/campaign mempertahankan riwayat donasi; nama relasi diberi penanda
  archived. Relasi baru wajib aktif; relasi arsip saat edit historis tetap tersedia.
  Arsip donasi mengecualikannya dari laporan. Restore mempertahankan histori.
- Edit record arsip ditolak hingga restore. Revisi dicek dalam transaksi sehingga
  draft lama mendapat konflik, bukan menimpa record yang sudah berubah.
- Dialog arsip meminta tindakan Archive eksplisit; Cancel/Escape tidak mengubah data.
  Form memiliki loading, error, validation, success; daftar empty/error/retry.

## Editor konten

Schema typed dari fixture membatasi field dan jumlah item, lalu dipakai bersama
untuk renderer serta validasi save. HTML/rich text tidak dirender. ID stabil,
jumlah/layout card tetap, geometry/crop/ikon/built-in image tidak menjadi input.
Tautan hanya anchor, path lokal, http(s) tanpa kredensial; javascript/data URL,
protocol-relative, backslash/kontrol/whitespace ditolak. Tujuan kosong tetap preview.

- Navbar: wordmark, label menu/badge/demo, dropdown/Company copy dan link.
- Hero: copy, heading/highlight, CTA labels dan 1–6 Overview slides. Ilustrasi
  dashboard tetap terpisah; label CTA tidak mengubah alurnya.
- Partners: 1–20 logo unik, nama/alt, urut/tambah/hapus. Katalog bawaan + upload
  PNG/JPG/WebP maksimal 2 MB/4096 px, signature dan decode diperiksa. File disimpan
  sebagai data URL di IndexedDB. Upload belum terbit sampai dipilih dan disimpan.
  SVG bawaan dan geometry tetap, SVG upload/URL gambar bebas tidak didukung.
- Difference: label, heading dan tiga accordion panel; Insight/ikon tetap contoh.
- About: heading/deskripsi dan tiga statistik marketing, terpisah dari laporan.
- Solutions: copy tiga produk, badge dan overview; featured/urutan/ikon/foto tetap
  mengikuti versi awal. Tidak menambah hover featured yang pernah dibatalkan.
- Testimonials: heading/intro serta 1–6 cerita; foto bawaan dipakai ulang.
- Missions/Sectors: teks/manfaat dan marketing illustration copy; layout, ikon,
  foto serta struktur jumlah card tetap. Tidak menambah definisi angka bisnis.
- Footer: heading/deskripsi/copyright, tiga kolom, daftar link dan legal.

State saved/draft/revision terpisah dari query. Refetch/Broadcast tidak menimpa
draft. Save memeriksa revision secara atomik; konflik 409 menjaga input. Reset
mengembalikan draft tersimpan, Reload saved content mengambil revisi terbaru.
Publikasi lokal memperbarui landing tanpa menambah draft publishing workflow.
Navigasi dengan perubahan belum tersimpan memakai dialog Keep editing/Discard;
refresh/menutup tab memakai beforeunload. Logout dirty meminta pilihan sebelum
menghapus sesi. Array editor memberi batas item dan pengembalian fokus setelah
perubahan. Dialog CRUD yang mount dalam StrictMode tidak tertutup oleh close event
cleanup lama; fix bersama mengabaikan event close bila dialog sudah dibuka lagi.

## Verifikasi

- npm run test:frontend: 18 test lulus. CRUD/revision/archive/restore, status/tanggal/
  jumlah uang, relasi historis, pencarian/pagination, mutasi terhadap laporan dan
  campaign, validasi 10 section, href berbahaya, fixed field, duplicate/missing logo,
  konflik CMS dan penolakan akses tanpa sesi; sembilan pemeriksaan auth/report lama
  tetap lulus. Unit test memakai adapter memory eksplisit, tidak memanggil DB.
- npm run build: strict TypeScript + Vite lulus; chunk CRUD/editor/dashboard terpisah.
- npm run build:legacy lulus karena SCSS admin bersama mendapat tambahan fieldset.
- Browser desktop 1280 dan mobile 320: CRUD/editor tanpa overflow dokumen, tabel
  scroll internal, dialog mobile 282 px dan form satu kolom; satu main. Hero dan
  Footer editor mobile diperiksa, termasuk nesting fieldset Footer.
- Browser tambah/edit donor, validasi tanggal campaign, received donation tanpa
  tanggal ditolak, lalu simpan received USD 10.25 dan periksa dashboard 5260.25 serta
  campaign 10.25. Refresh donor mempertahankan nama/email dan URL search.
- Archive/restore donor, label relasi archived pada donasi, archive donation lalu
  total kembali 5250.00 diperiksa. Record QC donor/campaign/donasi diarsipkan melalui
  UI, tanpa penghapusan permanen atau perubahan seed/backend.
- Publikasi semua 10 section melalui UI berhasil. Hero/About diberi perubahan
  sementara, terlihat lintas tab tanpa reload, lalu dikembalikan. Href javascript
  ditolak; Keep editing mempertahankan draft; Reset mengembalikan isi tersimpan.
- Konflik dua tab: save kedua ditolak dengan pesan konflik; input Stale draft QC
  tetap ada. Reload dan save memulihkan konten awal; landing kembali semula.
- Upload PNG lokal contoh berhasil, item keenam terbit dan seluruh gambar termuat.
  Refresh mempertahankan item, lalu item keenam dihapus dari publikasi sehingga
  landing kembali lima logo. Katalog lokal menyimpan satu Sample community logo
  contoh (aset tim bawaan yang dipakai untuk tes), belum dipublikasikan.
- Dirty logout menampilkan dialog; Keep editing mempertahankan input. Form dan
  archive dialog mendukung Escape/fokus. Login/session masih contoh per tab.
- Production preview: direct /admin/donations?search=Anonymous&pageSize=25 → login
  → filter semula, satu donasi anonim ditemukan, refresh bertahan. Publikasi About
  berhasil, console tanpa error/warning. Tidak ada koneksi backend/API/MySQL.
- Screenshot docs/screenshots/react-crud-{desktop,mobile}.jpg dan
  react-content-editor-{desktop,mobile}.jpg.

QC: form tiga resource, filter/arsip/pulihkan, konsistensi dashboard, tiap section
editor, upload/pemilihan logo, reset/conflict dan mobile. Tunggu QC sebelum REST
atau migrasi backend TypeScript. Integrasi nanti perlu mempertahankan data legacy
serta menentukan apakah contoh browser perlu dipindahkan; tidak ada impor otomatis.
