# Arah produk dan pemisahan flow terbaru

- Arah yang disetujui pengguna: Kindsight sebagai produk software fundraising untuk organisasi. Website publik untuk pemasaran/permintaan demo; portal organisasi untuk dashboard dan pencatatan fundraising; admin internal untuk CMS, permintaan demo dan akses akun. Website donasi langsung/payment tetap ditunda.
- Analisis pemisahan ada di docs/product-flow-access-plan.md. Rencana ini menjadi acuan bertahap. Fondasi role/organisasi, portal organisasi dan admin internal sudah diterapkan; flow demo terbaru tercatat pada status tugas 4 di bawah. Jangan menyebut sudah siap production.
- Usulan baseline: organization_user dan platform_admin, satu organisasi per akun pengguna; admin internal tidak otomatis mendapat akses ledger. Pemisahan harus mencakup otorisasi API dan scope query/database, bukan hanya menu/route. Model akun mempertahankan ID/password lama melalui migrasi tambahan.
- Pertahankan desain yang sudah QC. Jangan menambah flow donate atau mengubah CTA menjadi Donate berdasarkan percakapan arah alternatif yang sudah ditinggalkan.
- Pengguna mengizinkan implementasi tugas 1: fondasi role/organisasi, migrasi tambahan dan backfill aman, guard API/frontend dan cache scoped. Pengguna telah mengizinkan kelanjutan tugas 2: route/layout portal organisasi.

# Keputusan teknologi aktif — React SPA

- Frontend aktif: React + Vite + TypeScript, React Router, TanStack Query, SCSS dengan BEM dan CSS variables. Chart.js digunakan bila diperlukan. Keputusan ini menggantikan Pug/Vanilla JavaScript untuk kode frontend baru.
- Gunakan `Link`/`NavLink` untuk navigasi internal dan `navigate` untuk pengalihan programatik. Pertahankan anchor section, URL langsung, refresh, Back/Forward, dan halaman 404.
- Filter, pencarian, pagination, interval grafik dan pilihan laporan yang perlu bertahan setelah refresh memakai URL search params. Validasi parameter, dan reset pagination saat filter berubah.
- Akses data melalui service asynchronous bertipe jelas. Pada fase migrasi frontend gunakan data contoh terpusat; jangan menyambungkan API/MySQL atau mengubah backend tanpa tugas fase backend yang eksplisit.
- Gunakan TanStack Query untuk data yang berasal/kelak berasal dari API. Query key mencakup resource dan parameter; setelah mutasi sukses perbarui/invalidate seluruh query terkait agar tabel, statistik, grafik dan pilihan relasi konsisten. React state dipakai untuk state UI lokal/draft.
- Sertakan loading, empty, error/retry, success dan status mutasi. Pertahankan shell saat navigasi/refetch; jangan menutup seluruh halaman dengan loading setiap berpindah route. Jangan menyamarkan data contoh atau kegagalan API sebagai data aktual.
- Jangan menambahkan PWA, Redux, SSR, ORM, library komponen atau abstraksi berlapis yang belum diperlukan.
- Backend target fase berikutnya: Node.js + Express + TypeScript, MySQL lokal dengan mysql2. Backend JavaScript, data dan file upload lama tetap dipertahankan selama migrasi frontend.
- SPA fallback harus mengecualikan `/api` serta file aset. Aset/API yang hilang tidak boleh berubah menjadi HTML SPA. Konfigurasi hosting ditentukan saat deployment; gunakan docs/spa-deployment.md sebagai acuan.

# Workflow implementasi per section

- Urutan landing terbaru atas instruksi pengguna: Navbar (sudah QC) → Footer (sudah QC) → Hero (sudah QC) → Partners (sudah QC) → Difference (diizinkan lanjut) → About → Solutions → Testimonials → Missions → Sectors. Footer harus lolos QC sebelum Hero.
- Instruksi terbaru pengguna: selesaikan seluruh section landing yang tersisa (About, Solutions, Testimonials, Missions, Sectors) dalam satu tugas, lalu QC gabungan. Aturan per section tetap berlaku untuk pekerjaan berikutnya kecuali pengguna menentukan scope lain.
- Migrasikan fondasi terlebih dahulu. Kerjakan hanya satu section/bagian yang diizinkan pada setiap tugas; jangan melanjutkan ke section lain atau implementasi backend di luar scope.
- Gunakan kembali token, font, aset dan komponen yang tersedia. Versi Pug dan screenshot yang sudah lolos QC adalah acuan visual; migrasi bukan kesempatan merombak desain atau menambah definisi bisnis.
- Pertahankan Solutions versi awal yang telah dipulihkan. Angka ilustrasi/marketing, Major Gift, AI, dan scoring tidak otomatis menjadi hasil perhitungan fundraising. Flow donate tetap ditunda.
- Dukung desktop/mobile. Jika desain mobile tidak tersedia, gunakan adaptasi yang masuk akal dan jelaskan asumsi singkat.
- Porting perilaku DOM ke state/handler React. Chart.js, observer dan event listener dalam effect wajib dibersihkan saat unmount; jangan menjalankan controller DOM lama pada subtree React.
- Periksa hasil di browser: desktop/mobile, interaksi, fokus keyboard, overflow, navigasi tanpa reload, direct URL/refresh, dan state data yang relevan.
- Jalankan `npm run build` (TypeScript + Vite) sebelum penyerahan kode. Selama transisi, periksa `npm run build:legacy` jika perubahan memengaruhi jalur Pug bersama.
- Laporkan hasil, pemeriksaan, asumsi/keterbatasan dan apa yang perlu di-QC secara singkat. Tunggu QC pengguna sebelum section berikutnya; tangani revisi terlebih dahulu.
- Jangan hapus Pug/plugin/controller/aset lama sebelum penggantinya lolos QC. Backend mengimpor `shared/landing-content.js` dan `src/scripts/data/*`; jangan pindah/hapus file kompatibilitas tersebut dalam fase frontend.

# Jalur transisi

- React: `npm run dev`, http://127.0.0.1:5176, build `dist/`.
- Pug referensi: `npm run dev:legacy`, http://127.0.0.1:5175, build `dist-legacy/`.
- Perubahan dokumentasi saja tidak memerlukan browser/build.
- Status dan urutan migrasi: docs/react-spa-migration.md. Dokumen lama yang bertanda arsip bukan pedoman teknologi aktif.

# Status landing terbaru

- Seluruh section landing React sampai Footer telah diterima pengguna. Area QC/kontrol preview dan catatan migrasi di landing telah dihapus atas instruksi pengguna; jangan menambahkannya kembali ke halaman publik. Halaman /foundation tetap menjadi utilitas terpisah.

# Status API/database terbaru

- Pengguna telah mengizinkan fase API/MySQL. Frontend aktif memakai service REST untuk login/logout/sesi, dashboard, CRUD dan 10 section CMS. Data IndexedDB/akun demo hanya fixture; jangan mengimpornya ke MySQL atau menjadikannya fallback kegagalan API.
- API aktif: npm run dev:api / start:api memakai server/index.ts; CMS React baru TypeScript strict. Modul JS autentikasi/fundraising/dashboard/upload lama tetap digunakan melalui batas kompatibilitas bertipe. Jangan mengklaim seluruh legacy sudah TypeScript; jangan hapus impor/aset/endpoint Pug yang masih digunakan.
- Migrasi 003-record-revisions bersifat tambahan. Jangan ubah migrasi 001/002 yang telah diterapkan, reset/reseed database pengguna, atau mengganti password admin yang sudah ada. Kredensial tetap lokal/diabaikan Git, tidak masuk UI atau log.
- Cookie sesi server 8 jam, HttpOnly/SameSite Strict. Mutasi memerlukan Origin diizinkan dan header X-Kindsight-Request; jangan melemahkan proteksi untuk mengatasi error proxy. Dev/preview mem-proxy API 3101 dengan Origin asli; API/aset tidak boleh masuk fallback HTML.
- Pertahankan arsip/pulihkan dan relasi historis; CRUD If-Match revisi numerik, CMS token SHA256 opaque. Konflik 409 menjaga draft. Nominal USD string; summary hanya received/nonarsip dalam periode UTC end-exclusive; campaign lifetime. Marketing/ilustrasi/AI bukan ledger.
- Seluruh query fundraising/referensi/report/campaign/direktori harus diperbarui setelah mutasi; CMS menginvalidasi editor/publik dan tab lain. Login/logout membersihkan query private, 401 memicu cek sesi.
- Kontrak copy CMS di shared/react-content.json dihasilkan lewat npm run content:contract dari schema React yang disetujui. Aset/geometri bundel tidak boleh diganti melalui URL konten. Simpan format lama/ilustrasi ketika memperbarui copy. Endpoint legacy tetap tersedia.
- Build memeriksa TS frontend dan API. Uji nyata: npm run test:integration (service React → API → MySQL, fixture terisolasi), di samping test backend dan mock. Detail di docs/react-api-database.md. Verifikasi mobile tool terkendala override yang tetap 1280 px; jangan klaim mobile sudah diuji pada fase ini.
- Integrasi telah dilanjutkan atas instruksi pengguna. Demo React kini aktif sesuai status tugas 4 di bawah; donate/payment, newsletter sungguhan dan model AI/scoring tetap ditunda. Tunggu QC sebelum fitur berikutnya.

# Status fondasi role/organisasi terbaru

- Migrasi 004-organizations sudah diterapkan, tanpa mengubah migrasi 001–003, password/ID akun atau reset/reseed ledger. Ledger lama dimiliki Kindsight Showcase; akun lama tetap platform_admin. Akun organization_user QC terpisah disiapkan lewat organization:create-user, kredensial file .organization-credentials.local (ignored), jangan dicetak.
- Sesi memakai data.user/SessionUser dengan role dan organisasi. Ledger API hanya /api/v1/app/* untuk organisasi aktif, CMS/upload /api/v1/admin/* hanya platform_admin. Repo tidak boleh dibuat tanpa organizationId; semua query, count, relasi dan laporan wajib scoped. Endpoint ledger admin lama sengaja ditutup, jangan diaktifkan kembali sebagai query global.
- URL aktif organisasi sekarang /app/dashboard dan /app/{donors,campaigns,donations}; URL dashboard/admin ledger lama adalah redirect yang mempertahankan filter. /admin/content/* tetap untuk platform. Lihat docs/organization-portal.md. Jangan mengembalikan link menu portal ke URL admin lama.
- Query privat menyertakan user/org, pergantian sesi membuang cache/draft lintas tab. Token/akun/organisasi nonaktif tidak boleh mendapat akses; validasi status server wajib tiap request.
- Detail aktual, CLI, 50 pengujian dan QC: docs/role-organization-foundation.md. Mobile tool tetap 1280 px, jangan klaim mobile sudah lolos. Tugas 2 telah diizinkan lanjut oleh pengguna; statusnya di bawah.

# Status portal organisasi — tugas 2

- OrganizationLayout/header persisten dengan menu Dashboard/Donors/Campaigns/Donations di /app/*. CRUD tidak lagi memakai AdminLayout. Pertahankan komposisi dashboard dan komponen/style yang sudah QC; header preview workspace/settings/notifikasi disembunyikan.
- Alias dan returnTo memakai src/services/route-paths.ts; preserve search/page/filter/hash, validasi selector, redirect replace dan guard role pada tujuan. Share dashboard harus menghasilkan /app/dashboard. Jangan merusak URL lama atau melemahkan API scoped.
- RecordEditor memakai UnsavedChanges untuk Back/navigasi/unload; Keep editing menjaga draft. CMS tetap memiliki guard/draft/logout sendiri.
- Detail aktual dan QC: docs/organization-portal.md. 20 frontend tests, integrasi REST/MySQL dan isolasi organisasi lulus. Mobile tool masih tidak mengubah lebar dari 1280 px; perlu QC manual.
- Pengguna telah mengizinkan tugas 3 setelah portal organisasi. Detail tugas 3 di bawah; pengelolaan akun tetap belum dibuat.

# Status admin internal — tugas 3

- Login organisasi /login dan admin /admin/login berbeda entry/copy; autentikasi/cookie tetap satu. Salah role menampilkan penjelasan dan link workspace asli, tidak mengubah role atau mencabut sesi yang valid. Home platform_admin sekarang /admin/overview; /admin redirect ke sana.
- AdminLayout mempertahankan CMS/draft/logout guard, dengan Overview/Landing content, identitas dan View website. Akun organisasi tidak boleh mengakses CMS/overview; platform admin tetap tidak boleh mengakses ledger.
- GET /api/v1/admin/overview mengambil metadata organisasi, akun organisasi (enabled mensyaratkan akun dan organisasi aktif), serta konten 10 section desain. Jangan mengganti dengan angka ledger atau marketing. Query private admin ikut invalidasi CMS. Tidak ada migrasi/seed/reset atau perubahan password pada tugas ini.
- Detail dan pengujian: docs/internal-admin.md. Build React/API dan legacy, 20 frontend tests, test:admin, integrasi REST/MySQL, isolasi organisasi dan unit API diperiksa. Viewport tugas ini berhasil 390x844; overview/login/menu CMS diperiksa tanpa overflow. Catatan kegagalan viewport lama bersifat historis.
- Tugas 3 telah diterima pengguna dan tugas 4 (flow demo) diizinkan. Pengelolaan akses tetap tugas berikutnya; tidak mengklaim siap production.

# Status permintaan demo — tugas 4

- Form React Navbar/Hero sekarang POST /api/v1/demo-requests ke MySQL. Nama/email wajib, organisasi/pesan opsional. Konfirmasi hanya permintaan tersimpan; jangan mengklaim email/jadwal/akun dibuat. Newsletter dan Pug demo lama tetap preview.
- Admin /admin/demo-requests mendukung daftar/detail/search/filter/paging URL dan perubahan status new/contacted/closed. GET/PATCH admin hanya platform_admin; guest/org tidak dapat membaca. Tidak menghubungkan demo ke ledger atau memberi akses akun otomatis.
- Migrasi 005-demo-request-revisions telah diterapkan secara tambahan; jangan mengedit migrasi 001–005 atau reset/reseed. If-Match revisi mencegah overwrite, 409 menjaga draft; reload detail menjaga pilihan status meskipun record keluar filter.
- POST publik tetap melindungi Origin/header/JSON dan limiter 5 request/IP/15 menit. Retry ID+payload sama tidak menggandakan entri; tidak ada daftar/detail publik. Query private diinvalidasi dan tab lain disinkronkan setelah perubahan.
- Detail/status/verifikasi: docs/demo-requests.md. test:demo (2), test:frontend (21), integrasi React/API/MySQL, test:admin, test:organizations, test:api dan build React/legacy diperiksa. Browser desktop dan 390x844, submit/inbox/status, konflik dua tab, refresh/filter/fokus diperiksa; fixture browser dibersihkan.
- Pengguna telah mengizinkan kelanjutan pengelolaan akses. Bagian organisasi (tugas 5a) di bawah menunggu QC; akun pengguna belum diimplementasikan. Tidak mengklaim siap production.

# Status pengelolaan organisasi — tugas 5a

- /admin/organizations dan API /api/v1/admin/organizations hanya platform_admin: list/detail, tambah dan aktif/nonaktif. Tidak ada delete/rename/user provisioning/impersonasi atau akses ledger admin. Organisasi baru aktif tanpa akun; nama tidak otomatis unik.
- Migrasi tambahan 006-organization-revisions telah diterapkan. Jangan edit migrasi 001–006, reset/reseed atau mengganti kredensial lama. PATCH boolean active wajib If-Match; 409 menjaga aksi dan meminta reload. POST memakai UUID submission untuk retry aman.
- Nonaktif dan DELETE sesi organisasi dilakukan dalam satu transaksi tanpa menghapus histori. Penyimpanan sesi login memeriksa ulang status dengan lock organisasi → akun, sehingga tidak bisa menyimpan sesi baru sesudah nonaktif. Reaktivasi tidak menghidupkan sesi yang dicabut.
- Mutasi menginvalidasi seluruh query private/overview dan sinkronisasi tab. Filter/search/page/pageSize pada URL. Draft create memakai guard dan seluruh konfirmasi/status tetap memiliki loading/error/retry/success.
- docs/organization-management.md mencatat kontrak dan QC. test:organization-management, integrasi React/API/MySQL, frontend 22, auth 4, isolasi organisasi, admin/demo/API, build React/API dan legacy lulus. Browser desktop/390x844, create/status/filter/refresh/draft dan konflik dua tab diperiksa; fixture QC dibersihkan.
- Pengguna mengizinkan lanjut kelola akun. Status tugas 5b di bawah; tidak mengklaim siap production.

# Status pengelolaan akun — tugas 5b

- /admin/users dan API /api/v1/admin/users untuk platform_admin saja: daftar/detail, buat organization_user pada satu organisasi aktif, aktif/nonaktif. Akun platform_admin tidak ditampilkan/diubah. Tidak ada delete/edit profil/pindah role atau organisasi/reset password.
- Migrasi tambahan 007-account-revisions telah diterapkan. Jangan edit migrasi 001–007, reset/reseed atau mengubah password/ID akun lama. Status wajib If-Match; 409 menjaga tujuan dan meminta reload. Create UUID idempotent dengan email unik global tanpa overwrite.
- Password awal Web Crypto disimpan sementara dalam ref dialog, server hanya hash scrypt. Jangan masukkan rahasia ke URL/storage/query atau mutation variables/log/broadcast/screenshot terbuka. Dialog menyediakan password tersamarkan; setelah Close/unmount tidak dapat diperoleh ulang. Belum ada recovery/reset, email, expiry password awal atau mandatory first-login change; jangan klaim siap production.
- Akun aktif tetap tidak bisa masuk jika organisasi nonaktif. Aktivasi mensyaratkan organisasi aktif; nonaktif mencabut semua sesi akun dalam transaksi, dengan lock organisasi → akun seperti login/deactivation organisasi. Akun lain dan histori tidak diubah; reaktivasi tidak mengembalikan sesi yang dicabut.
- Mutasi menginvalidasi query private termasuk overview, metadata organisasi dan relasi; filter/search/org/page/pageSize ada di URL. Guard draft/password, loading/empty/error/retry/success, konflik dan sinkronisasi tab dipertahankan.
- docs/user-management.md memuat kontrak/QC. test:users, integrasi REST/MySQL, frontend 23, auth, organization-management/isolasi/admin/demo/API dan build React/legacy lulus. Browser desktop/390x844, create/password tersamarkan, duplicate email, status/filter/refresh, draft dan konflik dua tab diperiksa. Fixture QC dibersihkan.
- Menunggu QC tugas 5b sebelum aktivasi/reset akun atau kesiapan rilis lebih lanjut.

# Fokus tampilan terbaru — dropdown custom

- Pengguna menunda fitur ganti/reset password, wajib mengganti password awal, email undangan/pemulihan dan kesiapan production. Jangan melanjutkan fitur tersebut tanpa instruksi baru; fokus saat ini tampilan admin/portal.
- Seluruh select yang terlihat di area admin dan portal React memakai Select di src/components/ui/Select.tsx dan SCSS BEM _select.scss. 16 lokasi deklarasi mencakup filter/pagination, CRUD/referensi, CMS/logo, organisasi akun, interval/campaign. Gunakan komponen ini untuk dropdown baru, dengan onValueChange; jangan menambah native select yang terlihat ke produk aktif.
- Native select tersembunyi hanya untuk kontrak name/value/required. Trigger/ref adalah HTMLButtonElement. Pertahankan aria/label, fokus validasi, disabled, keyboard/Escape/Tab/typeahead, top-layer di dialog, viewport dan reduced motion. Bersihkan listener/observer/timer saat unmount.
- Tidak ada perubahan API/database/permission atau nilai bisnis pada tugas ini. Utilitas /foundation serta Pug tetap referensi terpisah. Detail cakupan dan hasil: docs/custom-dropdowns.md. Build TS frontend/API/Vite dan 23 tes frontend lulus; browser desktop/390x844, dialog/CMS/form/grafik/filter URL diperiksa tanpa menyimpan perubahan data.
- Menunggu QC dropdown sebelum tampilan berikutnya.

# Fondasi interaksi landing

- Lenis + GSAP ScrollTrigger terpasang melalui src/hooks/useLandingScroll.ts, aktif hanya pada route `/`. Router tetap mengelola anchor; reduced motion dan touch native dipertahankan. Ticker, observer dan instance harus dibersihkan saat unmount; jangan menambah RAF Lenis kedua atau controller DOM legacy.
- Tahap ini hanya fondasi smooth scroll/sinkronisasi ScrollTrigger. Reveal/hover/transisi/sticky/parallax/preloader berikutnya menunggu QC dan instruksi. Detail: docs/landing-motion.md.

# Prototipe intro orange aperture — revisi storyboard

- Pengguna meminta putih + logo asli di tengah → logo membesar hingga celah bintang memenuhi layar → Hero terbuka melalui celah itu → terus zoom sampai Hero penuh. Tidak memakai bidang persegi/dua panel terpisah. SVG inline memakai path aset logo asli dan token brand; animasikan atribut transform vektor agar zoom ekstrem tetap tajam.
- Timeline sekitar 7,1 detik ditambah readiness maksimal 800 ms; ada jeda saat close-up bintang sebelum reveal Hero. Tempo tenang, reveal elemen overlap. Hanya intro/Hero, section berikutnya menunggu QC.
- Instruksi QC terbaru: intro muncul SETIAP refresh/mount landing, termasuk URL fragment. Tidak ada sessionStorage seen flag atau syarat query replay. Reduced motion tetap melewati intro. AppLayout menunggu event kindsight:intro-complete dan konten siap sebelum memposisikan anchor.
- Pertahankan Skip/Escape, timeout readiness/error, cleanup timeline/listener/timer, serta pemulihan ketika viewport berubah. Revisi QC terbaru: zoom close-up ditambah 18%; scroll wheel/touch/keyboard dikunci selama intro (bukan mempercepat/melewati intro). Lenis menolak input saat class has-landing-intro aktif; kunci dilepas saat selesai/Skip/error/unmount. Lihat docs/landing-motion.md.

# QC motion landing terbaru

- Pengguna menerima sementara interaksi preloader/Hero. Atas instruksi berikutnya, tombol pause/resume pada logo loop Partners React dihapus beserta state manualnya. Loop, gradient, hover pause lama dan reduced motion tetap tersedia; jangan menambahkan motion/transisi Partners baru sebelum arahan pengguna.

# Reveal Partners — menunggu QC

- Pengguna mengizinkan reveal logo section. Partners React memakai ScrollTrigger scrub dengan selisih fase logo dan parallax kecil dashboard Hero, tanpa mengubah komposisi yang sudah QC. Setup menunggu intro selesai; transform dashboard berada pada viewport dalam, tidak menimpa figure intro.
- Loop/gradient tetap, tombol pause tidak dikembalikan. Reduced motion melewati reveal/parallax. Cleanup context/trigger/listener/frame wajib. Velocity loop dan transisi menuju Difference belum termasuk tugas ini. Detail: docs/landing-motion.md.

# Difference motion — menunggu QC

- Pengguna mengizinkan prototipe storyboard Difference: panel/gradient → accordion/Insight → headline/label. Desktop yang muat memakai pin singkat; header menyimpan ruang sejak awal. Mobile/viewport pendek tanpa pin dan header tampil dalam alur agar tetap terbaca.
- useDifferenceMotion membersihkan matchMedia/ScrollTrigger/frame/event saat unmount. Reduced motion dan direct #difference/#difference-title menampilkan konten tanpa storyboard. Accordion tetap klik/keyboard, tanpa auto-switch. Jangan lanjut About sebelum QC; detail docs/landing-motion.md.

- Revisi Difference terbaru: panel memakai mask vertikal 0→penuh + scale 0,96→1; accordion mask kiri→kanan satu per satu, deskripsi pertama menyusul, Insight saat baris kedua, headline terakhir. Mobile memakai mask per baris dalam scroll alami. Tidak mengubah lebar teks/layout aktual. Menunggu QC revisi.

- Revisi Difference posisi panel: selama fase awal desktop pinned, panel berpusat vertikal di viewport; kemudian transform y kembali 0 sedikit sebelum headline terbuka. Layout asli tidak digeser; mobile/viewport pendek tetap alur alami. Menunggu QC posisi/tempo terbaru.

# Smooth accordion Difference — menunggu QC

- Pengguna mengizinkan transisi plus/minus dan isi accordion tanpa lompatan layout. Accordion React memakai modifier accordion--smooth: ikon dua garis CSS, vertikal scale/fade380ms; tinggi/padding tombol tetap, ruang ikon tidak hilang saat collapse.
- Ukur/reserve deskripsi terpanjang + heading melalui ResizeObserver sebelum paint. Flex-grow membagi ruang tetap dan spacer menampung ruang saat semua tutup. Wrapper deskripsi fade/translate terpisah dari paragraf target GSAP reveal. Pertahankan inert/aria, keyboard, reduced motion dan cleanup. Jangan mengembalikan hidden/display:none untuk toggle React.
- Desktop/mobile, klik cepat/tutup semua/keyboard dan kestabilan tinggi body/posisi About diperiksa; build lulus. Detail docs/accordion-interactions.md. Tunggu QC sebelum bagian berikutnya.

- Revisi ikon accordion aktif: tiap item Difference memakai aset komunitas yang tersedia sebagai fallback. Ikon samping judul hanya terlihat ketika aktif, fade/scale380ms saat toggle dengan ruang tetap agar judul tidak bergeser. Reduced motion tetap dipertahankan. Desktop/mobile dan build diperiksa; menunggu QC.

- Arahan ikon accordion terbaru menggantikan ruang tetap: item nonaktif tanpa indentasi, wrapper ikon width0; saat aktif wrapper melebar dan menggeser judul secara smooth380ms bersama fade/scale ikon. Pertahankan desktop/mobile dan reduced motion. Menunggu QC.

# About motion — menunggu QC

- Pengguna mengizinkan storyboard About overlapping Difference: Difference tertahan, About naik menutupinya; garis memanjang → panel putih membuka ke bawah → statistik/label muncul → panel menjadi tiga kartu. Seluruh timeline scrub dua arah, tanpa autoplay/count-up.
- useAboutMotion memakai pin About hanya saat desktop muat, durasi scroll1.65 viewport; mobile/viewport pendek tanpa pin panjang, kartu stacked dan overlap singkat. Direct #about/#about-title serta reduced motion menampilkan konten lengkap. Cleanup matchMedia/trigger/frame/listener wajib. Tidak menambah RAF Lenis atau mengubah data/API/Pug. Detail docs/landing-motion.md. Desktop/mobile/build diperiksa; tunggu QC sebelum motion berikutnya.

- Perbaikan handoff terbaru menggantikan pin ganda Difference/About: wrapper .landing-story; Difference satu CSS sticky + margin95vh untuk reveal, trigger pada wrapper stabil; About tidak boleh mem-pin Difference/ancestor dan hanya mem-pin dirinya. About min-height100vh saat pinned menutup lapisan bawah. Breakpoint tinggi pendek memakai alur alami; mobile overlap32px tanpa sticky panjang. Scroll turun/balik pada titik sama menghasilkan geometri identik. Lihat docs/landing-motion.md; tunggu QC revisi.

- Efek kedalaman overlap telah diizinkan: pada desktop sticky, hanya .difference__content naik40–60px dan scale1→0,97 mengikuti About top bottom→top10% (scrub1). Grid/background/opacity/sticky tetap. Mobile/viewport pendek tetap alami; reduced motion bypass; cleanup lewat context. Scroll balik identik dan build diperiksa; menunggu QC. Detail docs/landing-motion.md.

- Revisi About header: desktop pinned dimulai tengah viewport, title per baris/deskripsi reveal via scroll; garis muncul lalu header/stage transform ke posisi default ketika panel membuka. Durasi scroll215vh (2.15×tinggi viewport). Badge awal content width20px + padding4px (outer28px); saat teks label muncul, width/gap melebar dan ikon rotate360°. Mobile offset maksimal48px tanpa pin panjang, direct #about/reduced motion tampil lengkap. Sticky/depth Difference tidak diubah. Browser/build diperiksa; tunggu QC. Detail docs/landing-motion.md.

# Solutions motion — menunggu QC

- Pengguna mengizinkan Solutions menutupi About sehingga Difference/About/Solutions saling overlap. About kini CSS sticky + margin215vh dengan trigger wrapper .about-solutions-story; pin About lama dihapus. Hanya Solutions pin terakhir, jangan kembali mem-pin ancestor/lapisan bawah.
- Solutions: judul/label tengah → header kembali kiri/atas, deskripsi kanan → garis simetris → panel putih → isi/foto → tiga kartu terpisah; scrub dua arah230vh. Layout/variasi kartu, foto, CTA dan dialog yang sudah QC dipertahankan. Desktop fit memakai padding/tinggi kartu adaptif; mobile/tablet/pendek reveal alami tanpa pin panjang. Direct #solutions/#solution-* dan reduced motion tampil lengkap.
- Mask panel About/Solutions memakai CSS variables dan fromTo eksplisit agar interpolasi inset/refresh tetap simetris. Resize width mengukur ulang threshold natural About/Difference; cleanup listener/frame/context wajib. Browser desktop/mobile, keyboard/dialog, reverse, direct URL/refresh, build React/legacy dan23 tes frontend diperiksa. Detail docs/landing-motion.md. Tunggu QC sebelum section berikutnya.

- Depth About telah diizinkan: .about__content naik40–60px/scale1→0,97 saat Solutions menutupi (top bottom→top10%, scrub1), sama dengan Difference. Background/opacity/sticky tidak berubah; transform terpisah dari reveal header/statistik. Mobile/pendek tetap alami, direct Solutions/reduced motion bypass. Context cleanup dan resize tetap; desktop reverse/mobile dan build diperiksa. Menunggu QC; detail docs/landing-motion.md.

- Revisi isi Solutions: gap akhir8px tetap sejak awal, tween gap dihapus agar lebar kartu/teks/foto tidak berubah. Pemisahan visual lewat backing panel fade + background/border/radius kartu. Reveal terpisah ikon → judul → deskripsi → CTA; foto mask kiri→kanan + scale1.06→1, badge menyusul. Range desktop250vh, fallback timeline per kartu pada mobile/pendek. Pertahankan context cleanup, direct URL/reduced motion dan CTA. Ukuran sebelum/sesudah pemisahan identik; build lulus. Detail docs/landing-motion.md; menunggu QC.

# Testimonials motion — menunggu QC

- Pengguna mengizinkan takeover saat10% terlihat, reveal blok konsisten, dan border atas/bawah memanjang dari tengah. Solutions sekarang CSS sticky +hold250vh dengan wrapper .solutions-testimonial-story (z-index2 di atas About); pin Solutions lama dihapus. Semua4 lapisan tanpa nested pin. Depth Solutions40–60px/scale0.97 mengikuti takeover.
- Desktop yang muat: Testimonials100svh, scene tinggi calc(100svh +220vh). Start top90%; background penuh setelah40vh scroll, lalu transform mengimbangi50vh gerak natural sebelum sticky. Reveal menyusul: heading/intro, portrait, quote/tahun, kutipan per baris, tagline, detail/kontrol. Border scaleX dari tengah dalam fase berbeda. Timeline scrub dua arah, tanpa autoplay/scroll lock.
- Quote span dikelola React, pengelompokan baris lewat layout effect/ResizeObserver/font ready, GSAP hanya variable progres parent. Pertahankan cleanup dan navigasi carousel/aria/fokus preventScroll. Mobile/pendek/isi tidak muat memakai tinggi natural min100svh + reveal alami; direct #testimonials/#testimonial-title dan reduced motion penuh. Tidak ada motion Missions/Sectors baru.
- Browser desktop/mobile, takeover/fullscreen/exit tanpa gap/reverse/carousel keyboard, build React/API/legacy dan23 tes frontend diperiksa. Detail docs/landing-motion.md. Tunggu QC sebelum section selanjutnya.

- Spacer flow .testimonial-scene__hold320vh setelah section; wrapper otomatis mengikuti tinggi section +spacer. Reveal selesai100vh sebelum batas sticky; raw scroll melewati akhir menyelesaikan scrub konten ketika panel masih tertahan, reverse awal mengembalikan0. Batas dihitung dari ukuran DOM bersama, tanpa pin/scroll lock baru. Fallback/direct/reduced motion spacer0.
- Perbaikan sinkronisasi takeover terbaru: transform panel yang mengimbangi gerak natural/CSS sticky wajib memakai scrub:true/ease:none, tanpa numeric scrub atau callback settle pada geometri. Lenis sudah menghaluskan scroll; tambahan lag pada kompensasi menimbulkan celah sekitar117px saat scroll cepat/reverse. Numeric scrub1.3 tetap hanya untuk reveal konten. Pengukuran saat animasi berjalan setelah refresh menghasilkan selisih di bawah1px (pembulatan ScrollTrigger), exit menyambung Missions dan reverse kembali top0; mobile/direct URL cleanup serta build React/API diperiksa. Tidak mengubah hold/tempo konten/section lain. Detail docs/landing-motion.md; tunggu QC revisi.

# Carousel Testimonials — menunggu QC

- Pengguna menerima perbaikan sticky dan mengizinkan carousel berlapis: kutipan keluar/masuk per baris, foto disapu mask horizontal + scale ringan, identitas menyusul dan counter bergulir. Durasi sekitar1.6 detik, Previous membalik arah. Tidak ada autoplay/loop baru atau perubahan aset/copy/API.
- Semua cerita ditumpuk dalam grid yang sama untuk menyimpan tinggi kutipan/tagline/nama terpanjang. Inaktif tetap aria-hidden/visibility hidden; satu cerita aktif dan announcement setelah transisi selesai. Lapisan transform carousel terpisah dari lapisan scroll reveal: .testimonial__portrait-reveal untuk scroll, slide/foto untuk carousel, .testimonial__quote-motion di dalam span scroll. Jangan memindahkan transform ke panel/background/sticky atau mengembalikan numeric scrub pada takeover.
- Input selama transisi ditahan lewat ref/aria-disabled tanpa melepas fokus kontrol; batas awal/akhir tetap disabled, keyboard ArrowLeft/Right/Home/End dan fokus preventScroll. Swipe touch/pen horizontal minimal48px dan dominan1.4× vertikal; pan-y/pinch tetap native, mouse selection normal. Reduced motion berpindah langsung; resize/perubahan preferensi menyelesaikan transisi. Context/listener/observer/font promise dibersihkan.
- Browser desktop1280×720/mobile390×844, grid sizing, Next/Previous, klik cepat, keyboard/fokus, resize di tengah animasi dan interaksi dengan sticky diperiksa. Gesture touch fisik dan preferensi reduced motion sistem masih perlu QC manual. Detail/hasil build di docs/landing-motion.md. Tunggu QC sebelum motion section berikutnya.

# Missions motion — menunggu QC

- Carousel diterima; pengguna mengizinkan transisi garis Testimonials → foto Missions → background terang → layout asli → benefit dan speedometer. Seluruh fase mengikuti scroll dua arah dengan tempo bertahap. Sectors/Footer belum mendapat motion baru.
- .testimonial-scene kini dimiliki LandingPage dan mencakup Testimonials, spacer320vh, lalu Missions. Reveal Testimonials tetap dihitung dari spacer miliknya, bukan tinggi wrapper bersama; jangan memperpanjang reveal ketika Missions bertambah tinggi. Native sticky Testimonials menjadi latar selama handoff. Tidak ada GSAP pin/ticker Lenis baru.
- useMissionsMotion memakai stage sticky +spacer280vh pada desktop yang muat. Garis bawah menuju tengah, foto membuka vertikal dari celah, surface terang meluas, foto kembali ke grid kanan, label/teks/benefit muncul bergantian. Seluruh geometri scrub:true; transform scroll dan carousel tetap terpisah. Wrapper handoff ornamen menghindari dua timeline mengubah properti child yang sama.
- Desktop story memakai padding/tinggi visual adaptif agar komposisi muat; layout akhir dua kolom/aset/copy dipertahankan. Mobile/viewport pendek/isi panjang memakai layout alami dan reveal per bagian tanpa hold panjang; direct #missions/#missions-title dan reduced motion tampil penuh. Jangan memotong konten agar dipaksa muat.
- Revisi QC Missions: konten desktop story dipusatkan vertikal dalam viewport; kalimat emphasis memakai text fill kiri→kanan per kata, scroll reversible. Mobile memakai trigger baca alami; direct/reduced motion tampil penuh.
- Heading Missions mengikuti screenshot revisi: grid desktop23%/77%, label sejajar bawah judul, ukuran judul responsif sampai48px dan baris baru pada frasa dalam tanda kurung. Mobile tetap stacked/font36px dengan wrapping natural. Pertahankan pusat konten/reveal baris; browser desktop/mobile dan build React/legacy diperiksa. Menunggu QC.
- Heading desktop dinaikkan24px. Posisi garis horizontal Missions mengikuti batas bawah header +16px melalui observer yang sama dengan pengukuran baris judul; amati section/content juga agar perubahan tinggi viewport tetap aman. Bersihkan observer/CSS variable saat unmount. Jangan mengembalikan garis ke offset tetap yang memotong heading.
- Gauge React kini satu SVG dengan path identik untuk track/fill, ketebalan20 dan stroke-linecap round. Dashoffset100→46 mengisi54% track; marker mengikuti lingkaran/pusat yang sama dan berhenti tepat di ujung arc sesuai nilai persen CMS (54%=108deg dari sweep200deg). Aset gauge Pug lama tetap dipertahankan. Counter CMS tetap berakhir pada nilai aslinya54%; gauge adalah ilustrasi visual, bukan metrik live. Counter dekoratif/ruang digit/cleanup copy asli dipertahankan.
- Cleanup matchMedia/context/listener/observer/font-ready/frame wajib; resize mengukur ulang ukuran natural. Browser desktop1280×720/mobile390×844, reverse gauge, fast scroll/exit, direct URL/refresh dan fallback diperiksa; build React/API/legacy serta23 tes frontend lulus. Gesture touch fisik/reduced motion sistem perlu QC manual. Detail docs/landing-motion.md; tunggu QC sebelum section berikutnya.

# Motion Missions → Sectors → Footer — menunggu QC

- Sectors berada di dalam missions-scene setelah hold Missions. Revisi terbaru menggantikan foto/canvas dengan panel Sectors masuk dari kanan ke kiri; Missions sedikit bergeser ke kiri, mengecil2% dan meredup. Desktop ≥1280px/tinggi≥672px dan konten muat memakai native sticky + hold150vh; tanpa GSAP pin atau RAF Lenis baru. Label berputar/membuka, heading/copy dan kartu terungkap bergantian; grid final tetap desain QC.
- Direct #missions menampilkan gauge final54% dan hold singkat40vh sebelum handoff. Direct #sectors/#sectors-title/#footer serta reduced motion tetap statis; mobile/viewport pendek/konten panjang memakai flow natural. Bridge foto telah dihapus. Clip horizontal memakai overflow-x:clip tanpa scroll container baru; kompensasi y mengikuti scrub langsung agar panel tetap sejajar viewport. Mobile memakai gerak lateral32px dalam flow natural. Cleanup mengembalikan context/class/listener/RAF dan pengukuran resize.
- Footer memakai container clip + parallax panel100px sebagai curtain dan reveal rule/brand/newsletter/link/legal. Tinggi natural tetap dipertahankan; tidak ada perubahan API/data/flow newsletter. Detail docs/landing-motion.md; tunggu QC sebelum melanjutkan.

# Revisi divider dan emphasis Sectors — menunggu QC

- Divider atas Missions/Sectors memakai garis rata1px, berbagi --missions-grid-horizontal-top pada missions-scene agar sejajar selama horizontal handoff. Setelah slide selesai divider Sectors kembali perlahan ke210px. Pertahankan pengukuran font/resize dan cleanup variable; rule bawah SVG tetap tersedia.
- “Every organization is different.” memakai fill warna scroll per kata, konsisten dengan emphasis Missions; direct/reduced motion penuh, forced colors terbaca. Interaksi sector-feature/sector-card-column berikutnya masih menunggu instruksi; jangan mengubahnya pada revisi ini. Detail docs/landing-motion.md.

# State aktif kartu Sectors — menunggu QC

- Ketiga sektor sekarang memakai SectorMorphCard yang sama; sector-feature merupakan state aktif, bukan jenis kartu khusus Nonprofits. Urutan scroll Nonprofits→Healthcare→Education memakai hold tambahan260vh setelah reveal220vh (revisi entrance terbaru). Lebar/grid/tinggi slot tetap, morph terjadi di artikel/foto/judul/ikon/panel; angka01 muncul di atas Nonprofits default,02 di bawah Healthcare,03 di atas Education. Jangan mengganti ulang kartu dengan conditional remount.
- Foto HD bundel pengguna: Frame594 Healthcare, Frame553 Education. Tidak ada perubahan API/kontrak copy CMS; angka donasi/volunteer/progress tetap ilustrasi section yang sama. Revisi terbaru mengizinkan counter nominal/persen dan bar berbasis active; volunteer tetap statis.
- Inert/aria-hidden menjaga panel tertutup keluar dari fokus; Explore tunggal/dialog/return focus tetap. Direct #sectors mendukung urutan active setelah readiness event; reduced motion seluruh kartu aktif statis. Mobile stacked dengan aktivasi per viewport; cleanup GSAP/atribut/listener tetap wajib. Detail docs/landing-motion.md; tunggu QC sebelum interaksi berikutnya.

# Reveal awal kartu Sectors — menunggu QC

- Entrance terbaru: garis putih memanjang → canvas putih membuka vertikal → kartu/isi muncul bergantian → seam dan canvas memudar untuk membuka gap final. Gunakan sectors__cards-stage/canvas/seams dan --sector-entry; jangan memakai --sector-active untuk entrance agar morph yang sudah QC tetap terpisah.
- Hold entrance220vh, hold state260vh tetap; jeda setelah entrance sebelum aktivasi. Grid/gap/slot tidak berubah. Text/image/metrics/number entrance memakai wrapper tersendiri agar opacity/transform state aktif tidak tertimpa. Root kartu inert sampai entry hampir selesai; panel metrik tetap mempunyai guard sendiri.
- Mobile memakai reveal per kartu tanpa canvas besar; direct #sectors/reduced motion tetap siap baca. Readiness anchor mencakup Missions/Sectors setelah geometri siap. Cleanup wajib memulihkan inert/GSAP/style. Build React/legacy dan23 tes frontend lulus; tunggu QC.

# Counter dan progress Sectors — menunggu QC

- Nominal USD dan persen dekoratif mengikuti --sector-active setelah60% morph, cubic-out; kartu pertama juga menunggu --sector-metrics-entry. Reverse deterministik, tanpa timer atau state React per frame. Bar target52% sesuai label CMS, menggantikan lebar lama57.3%; origin kiri/ujung rounded dipertahankan.
- Integer cents, target string asli saat selesai, tabular-nums/tinggi blok stabil. Copy nonnumerik tidak dipaksa menjadi angka. Nilai asli visually-hidden, counter aria-hidden tanpa aria-live. Cleanup mengembalikan teks/transform dan keyed spans menjaga update CMS; jangan mengganti ilustrasi menjadi ledger. Detail docs/landing-motion.md; tunggu QC.

# Footer overlap dan fullscreen — menunggu QC

- Menggantikan curtain sebelumnya: Footer compact100svh pada desktop≥1280px/tinggi≥672px. Jika copy tidak muat atau layar mobile/pendek, pertahankan tinggi natural; tidak ada scroll internal atau link terpotong.
- Footer tetap di luar main. sectors-scene__footer-hold100vh + margin Footer−100vh membuat Sectors tetap sticky sampai tertutup. Extension hanya aktif bila Footer muat/Sectors sticky; Education selesai dahulu. Tidak ada GSAP pin/hold setelah Footer utuh.
- Rule dari tengah, logo/heading/email/kolom link/wordmark/legal reveal berurutan dan reversible; Sectors mundur/meredup. Reduced motion/direct #footer utuh tanpa overlap. Cleanup style/context/listener/RAF wajib; tidak mengubah API/newsletter/flow bisnis. AppLayout memakai koordinat anchor absolut dan event footer-ready.
- Browser1280×720/390×844, document end, reverse, form keyboard/dialog diperiksa. Build React/legacy dan23 tes frontend lulus. Detail docs/landing-motion.md; tunggu QC pengguna.

# Navigasi dashboard — sliding pill (menunggu QC)

- Organization header Dashboard/Donors/Campaigns/Donations memakai satu indicator dekoratif melalui useSlidingNav; transisi posisi/lebar/tinggi500ms, warna teks350ms. NavLink/aria-current/fokus/URL dan guard API tidak berubah. Admin internal/CMS tidak termasuk tugas ini.
- Ukur subpixel setelah route/font/resize, tanpa animasi sweep pada mount. Mobile menggulir scroller horizontal secukupnya agar link aktif terlihat; reduced motion tanpa transisi. Bersihkan ResizeObserver/frame/font callback; jangan menambah clock GSAP/Lenis.
- Browser desktop/mobile, route/Back/keyboard/refresh diperiksa. Build React/legacy dan23 tes frontend lulus; detail docs/dashboard-sliding-tabs.md. Tunggu QC pengguna.

# Kelanjutan sliding pill admin internal — menunggu QC

- Sliding pill kini juga aktif di menu AdminLayout dan sepuluh tab CMS, menggantikan batas cakupan portal saja pada tugas sebelumnya. Gunakan useSlidingNav yang sama dan CSS admin; wrap mobile mendukung gerak x/y serta perubahan lebar/tinggi.
- Navigasi section CMS harus persisten di luar keyed EditorLoader agar pill dapat bergerak antar section. Loader/form tetap keyed untuk menjaga draft/loading/error; jangan memindahkan guard draft atau mengubah API. aria-current/Link tetap sumber active, termasuk saat navigasi diblokir.
- Desktop/mobile, menu admin/CMS, keyboard/Back/refresh serta Keep editing/reset draft tanpa menyimpan telah diperiksa. Build React/legacy dan23 tes frontend lulus. Detail docs/dashboard-sliding-tabs.md; tunggu QC.

# Microinteraction Total Raised — menunggu QC

- Hanya nominal Total Raised dan grafik tren portal organisasi: refresh menghitung ke nilai API selama850ms; Daily/Monthly mentransisikan instance Chart.js yang sama. Nominal sama tidak recount; refetch otomatis pada view yang sama tidak replay. Pertahankan USD integer cents, nilai aksesibel dan reduced motion/cleanup.
- Retensi laporan saat request/retry wajib scoped akun/organisasi. Label interval/periode mengikuti laporan aktual yang masih terlihat, dengan updating/stale/error/retry; jangan ekspor placeholder/error atau menjadikan fixture fallback API. Tidak mengubah backend/database maupun Campaign/gauge.
- Browser1280×720/390×844, refresh dan interval diperiksa. Build React/legacy dan24 tes frontend lulus. Batas pemeriksaan dan detail ada di docs/dashboard-raised-motion.md. Tunggu QC sebelum kartu/interaksi berikutnya.

# Revisi Total Raised — rolling digits dan line reveal

- Counter sebelumnya diganti reel vertikal per digit1050ms/stagger35ms, simbol tetap; nilai aksesibel aktual, tanpa render React per frame. Refresh grafik memakai clip kiri→kanan1200ms dengan bar sedikit menyusul. Interval memakai morph1050ms; total sama/background refetch tidak replay.
- Cleanup Web Animations/RAF/Chart/listener dan reduced motion wajib dipertahankan. Tidak menambah pengelompokan data khusus/pulse/check dropdown atau menyentuh backend. Desktop/mobile dan interval diperiksa, build React/legacy serta24 tes frontend lulus; detail docs/dashboard-raised-motion.md. Tunggu QC.

# Persiapan paket VPS — 26 Oktober 2026

- Pengguna mengizinkan step1 paket kode lokal terbaru untuk aaPanel. `npm run package:vps` membangun frontend lalu membuat ZIP `kindsight/` beserta manifest/checksum di deploy-artifacts (ignored). Paket mengambil working tree allowlist, termasuk revisi belum commit; tidak memakai Git archive lama dan tidak push/deploy.
- Paket mengecualikan .env/credential/.local/.git/node_modules/SQL/upload pengguna. DB dan storage harus dipindahkan privat terpisah nanti. Dokumentasi deployment/README.md dan template deployment/vps.env.example; web root wajib dist, source/config tidak boleh dipublikasikan.
- API tetap npm run start:api melalui tsx devDependency: VPS perlu npm ci --include=dev; jangan upload node_modules Mac atau memakai omit=dev tanpa perubahan runtime teruji. Tidak ada perubahan backend/migrasi/database.
- Verifikasi build,24 frontend/13 unit API, ZIP+hash, clean install dan startup health200/ready503 tanpa DB lulus pada Mac. Tidak mengklaim Linux/VPS/DB teruji. Audit runtime menemukan high pada body-parser/multer; selesaikan sebelum publik. trust proxy/limiter Nginx juga belum disesuaikan; jangan membuka publik sebelum review. Tidak mengubah konfigurasi VPS/aplikasi lain.

# Persiapan GitHub CI untuk VPS

- Atas instruksi pengguna, .github/workflows/vps-package.yml menyiapkan test/build/ZIP+SHA di Ubuntu Node22.22.2 untuk push main,PR/manual. Action dipin commit dan permission contents:read; tidak memakai rahasia/deploy/migrasi VPS. Audit high informasional selama persiapan, wajib diselesaikan sebelum publik.
- Rekomendasi domain kindsight.owwteam.dev; belum mengubah DNS atau base aplikasi. Instruksi deployment/github-vps.md membedakan build CI dari deploy SSH yang belum terhubung. Jangan mengklaim otomatis update VPS sebelum deployment teruji atau git pull pada direktori ZIP nongit. Env/upload/database wajib persisten terpisah saat update.

# Feedback publish CMS

- Save and publish menampilkan toast persisten nama section hanya setelah API sukses; spinner pending dan check pada tombol. Dismiss/edit/reset/reload/pergantian section membersihkan toast; edit/percobaan baru membersihkan success lama. Jangan tampilkan sukses optimistis atau menghapus draft/error409.
- Live region polite, reduced motion, token/BEM dan fokus kembali ke publish saat dismiss tanpa scroll paksa. Berlaku untuk seluruh section melalui EditorForm yang sama. Browser desktop/mobile dan save lokal tanpa mengubah copy diperiksa; detail docs/cms-publish-feedback.md. Tidak mengubah CMS/data/VPS live.
- GitHub masih build/artifact saja, bukan auto deploy VPS. Jangan menyebut perubahan tampil live sebelum deployment nyata diverifikasi.

# Otomasi deploy VPS — persiapan belum aktif

- User mengizinkan automatic deploy dengan batas khusus Kindsight. Nama aktual hasil pemeriksaan server adalah kindsight_api. Jangan memakai restart_project aaPanel karena fungsi itu mengubah izin direktori Node bersama; jangan PM2/global restart atau perubahan aplikasi lain.
- deployment/kindsight-deploy.py dan installer menyiapkan root helper tanpa argumen/sudo terbatas, fixed path dan startup hash, scope PID uid/cwd/tag, verified ZIP/manifest, staging npm as-www, preflight, backup/restore unit code; env/storage/database dipertahankan. Folder app bukan symlink agar aaPanel cwd tetap cocok. Detail deployment/automatic-deploy.md.
- Job deploy workflow hanya main, environment production dan repository variable VPS_DEPLOY_ENABLED=true. Belum root install/sudo/secrets/enable/live test pada tahap persiapan ini. Jangan mengklaim sudah auto-deploy atau rollback live teruji. Server interruption saat aktivasi membutuhkan recovery journal manual; restart singkat, bukan zero downtime.
