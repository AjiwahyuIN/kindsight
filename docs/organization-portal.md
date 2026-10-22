# Portal organisasi — tugas 2, menunggu QC

Pengguna mengizinkan kelanjutan implementasi setelah fondasi role/organisasi. Scope ini memindahkan halaman dan navigasi portal; tidak mengubah schema, data, peran atau izin API dan tidak memulai pengalaman admin internal yang baru.

## Route aktif

| Route | Fungsi |
| --- | --- |
| `/login` | Login bersama sementara; tujuan sesudah login sesuai role |
| `/app` | Redirect ke `/app/dashboard` |
| `/app/dashboard` | Laporan fundraising organisasi |
| `/app/donors` | CRUD donor |
| `/app/campaigns` | CRUD campaign |
| `/app/donations` | CRUD donasi |
| `/admin/content/:section` | CMS khusus admin internal, tetap |

Pengguna organisasi tidak dapat membuka CMS; admin internal tidak otomatis mendapat akses portal. Guard dan API scoped dari tugas 1 dipertahankan. Login mengembalikan pengguna ke route/filter yang diizinkan; returnTo lintas peran atau tujuan tidak dikenal kembali ke home role.

## Navigasi dan tampilan

- OrganizationLayout mempertahankan header saat berganti halaman. Header memakai font, logo, token dan bentuk pill dashboard yang sudah diterima.
- Menu nyata: Dashboard, Donors, Campaigns, Donations, dengan NavLink/aria-current. Identitas organisasi terlihat di header dan menu akun; tersedia tautan website publik dan logout.
- Workspace, settings dan notifikasi preview di header disembunyikan karena belum mempunyai fungsi. Tidak menambahkan sidebar/fitur baru. Kartu dashboard dan formulir/tabel tetap memakai aset/style yang ada.
- CRUD terlepas dari AdminLayout, menggunakan main portal sendiri. Tab CRUD duplikat dihapus karena fungsi yang sama tersedia pada navigasi portal. CMS tetap menggunakan AdminLayout dan draft/logout guard yang ada.
- Menu akun mendukung Escape, fokus kembali ke trigger, klik/fokus di luar, dan cleanup listener. Chart.js tetap dibersihkan saat keluar dashboard.
- Draft form record dilindungi saat navigasi/Back dan unload melalui komponen UnsavedChanges yang tersedia. Keep editing mempertahankan isian; Discard and leave membuang draft. Cancel/Close form tetap berarti membatalkan edit. Tidak ada penyimpanan draft publik/permanen baru.
- Halaman portal tidak menampilkan shell QC fondasi. Route portal tidak dikenal menampilkan 404 di dalam shell dengan satu main dan navigasi yang tetap tersedia.
- Adaptasi mobile menggunakan navigasi horizontal yang dapat digulir dan tabel yang scroll di dalam panel; memakai breakpoint yang sudah ada. Ini adaptasi desain, bukan temuan frame Figma mobile baru.

## Alias lama

`canonicalPath` menjadi satu pemetaan untuk redirect dan returnTo, tanpa memberikan izin tambahan.

| URL lama | Tujuan |
| --- | --- |
| `/dashboard`, `/dashboard.html` | `/app/dashboard` |
| `/admin/donors`, `/admin/campaigns`, `/admin/donations` | `/app/{entity}` |
| `/admin.html?view={entity}` | `/app/{entity}`; parameter view dihapus |
| `/content.html?section={section}` | `/admin/content/{section}`; parameter section dihapus |
| `/login.html` | `/login` |

Filter/search/page/pageSize/interval serta fragment diteruskan. Selector entity/section tidak valid atau ambigu ditolak menjadi 404. Variasi trailing slash yang valid dinormalisasi. Redirect memakai replace, sehingga Back tidak terjebak pada alias. Role tetap diperiksa pada tujuan canonical. Share dashboard menghasilkan `/app/dashboard` dengan query yang sama.

## Verifikasi

- 20 pengujian frontend lulus, termasuk pemetaan alias, filter/fragment, trailing slash dan returnTo sesuai role.
- Integrasi service React→API→MySQL dan isolasi dua organisasi lulus kembali, dengan fixture terisolasi dan cleanup. Tidak mengubah ledger pengguna atau menjalankan migrasi/seed.
- Build React memeriksa TS frontend/backend dan Vite. Tidak ada perubahan source Pug/aset/SCSS bersama yang membutuhkan perubahan build legacy pada tugas ini.
- Browser desktop: Dashboard–Donors–Campaigns melalui menu, active state, satu main, tidak overflow; form donor Back → Keep editing mempertahankan draft → Discard and leave kembali ke dashboard tanpa menyimpan fixture.
- Alias admin.html ke donasi mempertahankan status pending, archived all dan pageSize 25. Refresh, pencarian kosong, Back/Forward, Escape/fokus menu diperiksa. Organisasi tetap ditolak pada URL CMS; 404 portal mempertahankan header.
- Logout pada route donasi menyimpan returnTo dengan filter dan login kembali menuju route yang sama. Pemeriksaan direct URL/fallback pada dev/preview mengikuti pemisahan API/aset.
- Alat viewport tetap melaporkan 1280 px saat diminta 390 px. Verifikasi mobile aktual belum dinyatakan lulus; perlu QC manual.

## Menjalankan dan QC

React 5176 dan API 3101 tetap seperti sebelumnya. Gunakan akun organisasi lokal yang sudah disiapkan; password tetap di file lokal ignored, tidak diubah. Akun admin lama tetap hanya untuk CMS.

QC: navigasi empat menu, filter/search/pagination setelah refresh dan Back/Forward, alias URL lama, draft form, logout/login, serta mobile. Setelah tugas ini, rencana berikutnya adalah pengalaman admin internal (login/admin shell/overview), bukan flow donate atau pembayaran. Tunggu hasil QC sebelum tugas berikutnya.
