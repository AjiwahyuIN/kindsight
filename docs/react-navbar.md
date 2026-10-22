# Navbar React — diterima pengguna

Fondasi React telah diterima pengguna. Migrasi Navbar memakai acuan Pug yang
sudah lolos QC, token/SCSS BEM dan SVG asli yang sama. React dapat diperiksa di
http://127.0.0.1:5176/; Pug referensi tetap di port 5175.

## Scope dan data

- Logo/wordmark, Who we Serve, Product/New, Company, Resources, Get a Demo dan
  avatar memakai layout semula. Tinggi desktop 117 px; mobile 88 px.
- Fixture React bertipe di src/data/navigation.ts. Kode JS lama tetap untuk
  kompatibilitas Pug/backend. Service async di src/services/navigation.ts dan
  adapter mock memakai TanStack Query; tidak memanggil API/sesi MySQL.
- Default akun adalah pengunjung. Kontrol QC di bawah header dapat memilih admin
  contoh (Sample Admin/admin@example.test) atau error. Ini bukan admin yang sedang
  login pada aplikasi Pug. Panel menjelaskan Sample session — API not connected.
- Login dan dashboard masih route penanda, sesuai batas fase sebelumnya.
  Tombol Sign in/Go to dashboard memakai Link dan mengarah ke route SPA tersebut.
- Skenario konten menggunakan ?navState=empty/error; akun ?account=admin/error.
  Default success/guest dihilangkan dari URL. Query keys memuat skenario; refresh
  mempertahankan pilihan. Kontrol tersebut khusus QC dan terpisah dari header produk.

## Interaksi

Satu dropdown aktif. ArrowDown/Up memindah fokus ke pilihan pertama/terakhir,
Escape menutup dropdown dan mengembalikan fokus ke pemicu. Klik/fokus di luar
menutup dropdown/menu mobile. Perubahan breakpoint menutup menu dan mengembalikan
fokus dari pilihan yang disembunyikan. Listener/matchMedia dibersihkan saat unmount.

Tujuan menu yang belum ditetapkan tetap membuka dialog preview; tidak dibuat
halaman bisnis baru. Company juga preview sesuai contoh sebelumnya. Dialog memakai
native dialog melalui komponen UI React, mendukung Escape/Close/backdrop dan
mengembalikan fokus ke disclosure atau hamburger pada mobile.

Get a Demo membuka form preview lokal dengan validasi native, termasuk nama
whitespace. Service preview tidak mengirim/menyimpan permintaan. Submit memakai
mutation state (pending/error/success); close/reopen mereset form/hasil. Tidak ada
perubahan newsletter/donate atau backend. Flow donate tetap ditunda.

Akun diperiksa dari service contoh saat panel dibuka; guest menampilkan Sign in,
admin contoh menampilkan identitas dan Go to dashboard, error menampilkan Try again.
Retry mempertahankan fokus pada kontrol yang tersedia. Loading/error/empty konten
memberi pesan eksplisit; menu terkait disabled ketika konten tidak tersedia.

## Style dan adaptasi

src/styles/components/_navbar.scss digunakan tanpa perubahan. Main SCSS wajib
diimpor sebelum App/section supaya padding/background button tidak menimpa style
Navbar. Button React diperluas dengan icon dan ref native; Container/token/font
sebelumnya tetap. Mobile memakai adaptasi legacy: breakpoint 70rem/1120px,
hamburger, dropdown bertumpuk, akun di baris penuh dan scroll internal menu.
Tidak ada desain mobile baru yang diasumsikan.

## Pemeriksaan

- npm run build lulus: TypeScript strict + Vite. Tidak ada perubahan dependency,
  backend, schema, seed, file upload, kode Pug atau SCSS bersama.
- Browser desktop 1440 dan mobile 320: aset termuat, ikon akun 20px/padding 12px,
  tinggi header 117/88px, tanpa overflow horizontal. Screenshot disimpan di
  docs/screenshots/react-navbar-desktop.jpg dan react-navbar-mobile.jpg.
- Dropdown/satu panel aktif, ArrowDown, Escape berlapis, preview item, modal Close,
  native Escape, fokus input dan pengembalian fokus, serta form demo hingga hasil
  lokal diperiksa. Company/tujuan belum final tetap preview.
- Akun guest/admin contoh/error, Try again dan fokus setelah retry, konten
  error/retry/empty/pemulihan, Sign in dan Go to dashboard melalui routing SPA
  diperiksa. Console desktop tidak melaporkan error/warning.
- Production preview: ikon/aset/style benar dan akun contoh berfungsi; refresh URL
  ?account=admin mempertahankan skenario. Tidak menjalankan integrasi database.

QC pengguna: posisi/ukuran Navbar, dropdown dan keyboard, hamburger mobile,
Get a Demo beserta close/reopen, serta avatar guest/admin contoh. Navbar telah lolos QC. Urutan terbaru dari pengguna adalah Footer dahulu, kemudian Hero. Belum mengimplementasikan section lain.
