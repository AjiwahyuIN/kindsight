# Fondasi motion landing

Lenis dan GSAP ScrollTrigger terpasang untuk route `/` saja melalui `useLandingScroll`. Lenis memakai ticker GSAP (konversi detik ke milidetik), scroll memperbarui ScrollTrigger, dan ResizeObserver memperbarui ukuran setelah konten/aset berubah. Tidak mengubah konfigurasi ticker global.

React Router tetap mengelola URL fragment. AppLayout mengarahkan fragment melalui Lenis; navigasi route tanpa fragment kembali ke atas. Touch tetap native; preferensi reduced motion menonaktifkan Lenis, termasuk ketika preferensi berubah. Dialog/listbox memakai scroll native; wheel di luar dialog modal tidak menggerakkan halaman.

Unmount membersihkan ticker, observer, frame, event dan instance Lenis. Animasi ScrollTrigger per section nantinya wajib memakai context/revert atau kill miliknya sendiri saat unmount. Belum ada reveal, pin/sticky tambahan, parallax atau preloader pada tahap fondasi ini.

Validasi: build TypeScript frontend/API + Vite, 23 tes frontend lulus. Browser desktop: instance aktif dan anchor About mencapai section; route admin tanpa class Lenis. Mobile 390×844: refresh landing aktif, tanpa overflow horizontal. Sensasi wheel/touch perlu QC perangkat pengguna. Vite mengeluarkan peringatan ukuran chunk utama setelah penambahan GSAP; build tetap berhasil.

Referensi integrasi: https://github.com/darkroomengineering/lenis dan https://gsap.com/docs/v3/Plugins/ScrollTrigger/.

## Orange aperture → Hero — storyboard aktif

Revisi pengguna menggantikan prototipe dua bidang terpisah: latar putih dan logo di pusat layar → logo asli membesar → close-up bintang putih dikelilingi oranye → putih di celah bintang mengungkap Hero → zoom berlanjut sampai batas logo keluar layar. Tidak ada pergantian ke persegi atau tirai terpisah.

OrangeAperture mengambil path dari aset kindsight-mark.svg (raw), memakai warna token brand, dan merender SVG inline. GSAP mengubah atribut transform pada grup SVG; bukan memperbesar tekstur img kecil yang membuat tepi buram. Skala dihitung dari tinggi bintang dan interiornya agar pembukaan menutup viewport desktop maupun portrait.

Timeline sekitar 7,1 detik setelah readiness: simbol muncul 0,1–0,8; jeda sampai 1,2; zoom menuju close-up 1,2–3,4; jeda; putih mulai mengungkap Hero 3,85–5,1; zoom melalui bintang 4,45–7,1. Navbar/headline/detail/dashboard masuk dengan timing overlap. Mobile tanpa rotasi 3D dashboard.

Untuk memudahkan QC, intro tampil setiap refresh/mount landing biasa, termasuk URL ber-fragment. Tidak memakai seen flag sessionStorage, posisi scroll awal atau parameter replay. Reduced motion tetap melewatinya. AppLayout menunggu intro selesai serta query landing siap sebelum mengarahkan URL fragment; animasi tidak menghilangkan tujuan anchor. Halaman di luar landing tidak memakai intro.

Revisi QC: zoom close-up ditambah 18% untuk menutup sudut luar logo. Skip menyelesaikan animasi dalam 450 ms; Escape segera memulihkan konten. Wheel/touchmove/keyboard scroll diblokir selama intro, tanpa mempercepat timeline. Tab mengarahkan fokus ke Skip. Class has-landing-intro mengunci overflow root/body, menahan body dengan position fixed dan memblokir input Lenis; cleanup melepaskan lock saat selesai/Skip/error/unmount. Perubahan viewport/reduced motion menyelesaikan intro. Font/gambar ditunggu maksimal 800 ms; pending/error/empty memiliki batas waktu dan memulihkan situs. Tidak ada persentase palsu. Context GSAP, tween interupsi, event dan timer dibersihkan saat selesai/unmount/StrictMode.

Browser: desktop 1280×720, mobile 390×844; logo kecil, close-up vektor tajam, Hero terlihat melalui celah, hasil akhir tanpa overflow. Refresh berulang menampilkan intro. QC tempo dan performa perangkat fisik tetap oleh pengguna; emulasi reduced motion tidak tersedia di tool browser. Build frontend/API dan 23 tes frontend lulus. Peringatan bundle utama >500 kB masih ada. Legacy tidak terdampak oleh revisi ini (komponen/stylesheet khusus React).

Screenshot: docs/screenshots/orange-star-closeup-desktop.png dan orange-star-hero-reveal.png.

QC revisi: wheel dan PageDown saat intro menjaga scrollY=0; close-up desktop diperiksa untuk sudut kanan bawah. Build frontend/API/Vite lulus. Screenshot: docs/screenshots/orange-star-overscan-desktop.png.

Penguatan mobile: body fixed mencegah pemulihan scroll browser saat refresh menggeser halaman di belakang intro. AppLayout menghitung ulang ukuran Lenis sebelum memposisikan halaman setelah unlock. Uji viewport 390×844: wheel saat intro tetap y=0.

## Reveal Partners — menunggu QC

Pengguna mengizinkan reveal logo section. Partners memakai ScrollTrigger scrub 1,4 detik: logo masuk dari bawah dengan selisih fase kecil berdasarkan index, sehingga tidak muncul bersamaan. Salinan loop memakai fase index yang sama dengan sumber agar sambungan carousel tetap konsisten. Gradient dan loop CSS yang sudah QC tetap dipakai; tidak ada tombol pause baru atau transisi background menuju Difference.

Hero dashboard mendapat parallax kecil pada viewport dalamnya (28px desktop / 12px mobile), terpisah dari transform figure milik intro. Geometri/layout section tetap. Setup menunggu class pengunci intro dilepas, lalu refresh pengukuran. GSAP context/ScrollTrigger/frame/listener dibersihkan saat cleanup; reduced motion/partnersMotion=reduce memulihkan logo langsung tanpa reveal/parallax.

Browser desktop dan 390×844 diperiksa: reveal bertahap, hasil akhir, overflow, loop dan sambungan Hero. Build TypeScript frontend/API + Vite lulus (peringatan bundle besar yang sama). Screenshot: partners-reveal-desktop.png dan partners-reveal-mobile.png. Kecepatan loop berdasarkan velocity dan transisi Difference belum diterapkan pada tugas ini.

## Difference — prototipe storyboard, menunggu QC

Pengguna mengizinkan: panel putih/gradient → isi accordion dan kartu Insight → headline per baris/label sebagai penutup. Ruang header disediakan sejak awal; reveal tidak mengubah tinggi/layout. Hook useDifferenceMotion menunggu intro selesai, menggunakan GSAP matchMedia dan context cleanup.

Desktop >=1200px dengan komposisi muat di viewport: content tertahan (pin) sekitar 0,9 tinggi layar, timeline scrub 1,3 detik menghubungkan ketiga scene. Panel/gradient lebih dahulu; baris accordion masuk berurutan; Insight menyusul; headline dan label terakhir. Seluruh angka/isi serta interaksi klik accordion tetap memakai sumber yang sudah ada. Tidak menambah auto-switch accordion atau transisi About.

Adaptasi mobile/viewport pendek: tanpa pin; heading tampil saat berada di viewport, disusul panel/accordion/Insight sesuai alur vertikal supaya judul tidak selesai reveal setelah lewat layar. Reduced motion melewati semua reveal/pin. URL langsung #difference/#difference-title menampilkan komposisi lengkap tanpa menjalankan storyboard, agar anchor bisa langsung dibaca. Untuk QC storyboard buka / lalu scroll dari Partners.

Browser: 1280×720 scene panel/isi/headline diperiksa dan scene 2/3 disimpan; klik accordion serta ArrowDown bekerja. Mobile 390×844 tanpa pin/overflow, heading/panel/Insight dan klik accordion diperiksa. Direct URL/refresh diuji; emulasi system reduced motion belum tersedia. Build TypeScript frontend/API, Vite React dan legacy lulus. Bundle warning >500kB tetap sama. Screenshot: difference-scene-2.png, difference-scene-3.png, difference-mobile-motion.png.

### Revisi Difference: panel dan accordion bermask

Atas instruksi pengguna, panel sekarang membuka top→bottom melalui clip-path dari tinggi terlihat 0 ke penuh, dengan scale 0,96→1 dan origin atas. Gradient sedikit terlambat. Lebar/layout teks tetap sejak awal. Accordion desktop memakai mask kiri→kanan berurutan (durasi relatif 0,95, jeda mulai 0,55); deskripsi menyusul judul pertama, Insight mulai saat baris kedua masuk, headline terakhir. Pemicu awal disesuaikan ke panel mendekati bawah viewport agar pembukaan panel terlihat, bukan selesai di luar layar.

Mobile tetap tanpa pin: panel membuka vertikal, setiap baris mendapat mask horizontal ketika memasuki viewport sendiri. Klik accordion tidak diubah; deskripsi semua panel kembali terlihat penuh saat reveal selesai. Direct URL dan reduced motion tetap memakai konten utuh. Build frontend/API/Vite diperiksa. Perubahan hanya hook React; CSS/legacy tidak berubah pada revisi ini.

### Revisi posisi tengah panel

Pada desktop yang muat untuk pin, difference__body membuka dan menampilkan isinya di pusat vertikal viewport terlebih dahulu. Offset dihitung dari tinggi panel, padding section dan offset layout panel; hanya transform y yang berubah. Timeline menggeser panel ke y=0 mulai fase 3,15 selama 1,65 unit dengan ease-out, sedikit sebelum headline mulai 3,55, sehingga tersedia ruang untuk judul tanpa tabrakan. Header tetap menyimpan ruang asli. Mobile/viewport tinggi konten tidak muat tetap memakai alur tanpa centering.

QC: viewport 1280×720 pusat panel terukur y=360,7 vs pusat layar360 saat headline opacity0; posisi akhir transform y=0 dan headlineopacity1; klik accordion tetap berfungsi. Viewport390×844 tanpa pin/offset y dan tanpa overflow. Build TS frontend/API/Vite lulus. Screenshot: difference-centered-panel.png.

## About — overlapping storyboard (menunggu QC)

`useAboutMotion` menunggu konten dan intro selesai, lalu membuat satu timeline scrub1.4. Difference ditahan dengan pin tanpa spacer saat About naik menutupinya. About memakai lapisan background opaque dan z-index sendiri. Desktop yang muat di viewport menahan About selama1.65 tinggi viewport: garis pendek memanjang dari tengah; mask membuka panel putih ke bawah; angka/label statistik muncul berurutan; label About melebar dari ikon; panel menyatu lalu terpisah menjadi tiga kartu melalui gap dan radius. Ada jeda scroll sebelum section dilepas. Nilai marketing dipertahankan, tanpa count-up atau perhitungan baru.

Mobile/viewport pendek memakai alur alami tanpa pin About; overlap Difference lebih pendek, kartu tetap stacked. Direct #about/#about-title dan reduced motion melewati storyboard dan menampilkan seluruh konten. Data pending/error/empty tetap memakai state sebelumnya. Semua matchMedia, trigger, frame dan listener dibersihkan saat unmount/perubahan hash; tidak menambah RAF Lenis. Referensi Pug tidak berubah.

Pemeriksaan browser: desktop1280×720, alur normal dari intro/Difference serta scroll balik, fase garis/panel/statistik/pemisahan; mobile390×844 stacked tanpa overflow; direct #about konten penuh dan pergantian breakpoint. Build TypeScript frontend/API/Vite lulus (warning chunk>500kB masih ada). Emulasi system reduced motion dan perangkat sentuh fisik belum diuji. Screenshot docs/screenshots/about-scroll-cards.png. QC berikutnya: tempo overlap, panjang scroll tiap fase, serta pemisahan kartu. Jangan lanjut motion Solutions sebelum arahan pengguna.

### Perbaikan handoff Difference → About

Revisi ini menggantikan pin Difference dari hook About dan pin konten Difference yang sebelumnya bertumpuk. LandingPage kini menyediakan `.landing-story` sebagai containing block bersama. Difference memakai satu CSS sticky (top0), dengan margin95vh untuk menyelesaikan reveal sebelum About masuk. Trigger reveal memakai wrapper yang tidak bergerak, sehingga refresh tidak menghitung ulang posisi dari elemen sticky. About hanya memiliki pin miliknya sendiri; minimum tinggi100vh menutup seluruh lapisan Difference. Tidak ada nested pin atau pin-spacer Difference. Posisi sticky dan jarak hold memakai unit viewport CSS agar mengikuti resize. MatchMedia juga mengamati batas tinggi scene, sehingga viewport pendek beralih ke alur alami. Mobile tanpa sticky/pin, overlap visual32px.

Browser desktop1280×720: pada scrollY2196, Difference top0/body254,39px/About417,70px; setelah turun144px dan kembali144px, semua posisi identik. Saat turun144px hanya About bergeser ke273,70px; Difference tetap. Alur dari intro, fase kartu, scroll bolak-balik dan breakpoint390×844 diperiksa; mobile tidak menyisakan pin-spacer dan tidak overflow. Referensi visual docs/screenshots/difference-about-overlap-fixed.png. Direct section URL tetap menampilkan konten lengkap. Menunggu QC transisi revisi; screenshot/status pin lama di atas bersifat historis.

### Difference recedes during overlap — menunggu QC

Pada desktop yang memakai sticky, hanya `.difference__content` diberi translateY hingga−40…−60px (−54px pada720px viewport) dan scale1→0,97 dengan origin tengah. Trigger mengikuti About top bottom→top10%, scrub1, ease none; selesai sebelum pin About mulai. Background/grid, opacity dan geometri sticky tidak diubah. Context matchMedia membersihkan transform saat breakpoint/unmount; mobile/viewport pendek tetap alur alami, reduced motion melewati efek. Direct #about tetap konten penuh.

Browser1280×720: pada scrollY2196, About417,70px, Difference top0, transform scale0,986/y−25,17px. Turun216px menghasilkan scale0,976/y−43,17px; kembali ke posisi semula menghasilkan transform dan geometri identik. Opacity1, background transform none. Mobile390×844 transform konten kembali none, tanpa pin/overflow. Build TS frontend/API/Vite lulus; warning chunk lama tetap. Screenshot docs/screenshots/difference-overlap-depth.png. Tidak ada pin/RAF/listener baru di luar lifecycle yang sudah ada. Tunggu QC.

### Revisi header About — menunggu QC

Header dimulai di tengah viewport pada desktop pinned (transform saja, layout tetap direservasi). Judul memakai mask per baris + translate24px, deskripsi mask + translate16px, ikon/badge lebih awal. Panel mula-mula tersembunyi, garis muncul setelah teks, lalu header dan stage bergerak bersama ke y0 ketika garis berkembang menjadi panel. Scroll range diperpanjang ke2.15 viewport agar reveal, perpindahan dan pembentukan kartu tidak dipadatkan. Header kembali ke tengah ketika scroll dibalik.

Label awal width20px content-box + padding4px di setiap sisi (kotak28px), gap0 dan teks tersembunyi/clipped. Saat statistik muncul, lebar bertambah sesuai teks aktual, gap ke token8px, ikon berputar360° sambil teks fade/slide masuk. Base CSS tetap menampilkan label lengkap pada direct #about dan reduced motion. Mobile tanpa pin panjang: offset header/stage maksimal48px, teks tetap reveal lewat scroll alami. Semua efek berada dalam matchMedia/context yang sudah ada; tidak mengubah sticky Difference, depth overlap, data atau API.

Browser desktop1280×720: header top243.20px/bottom475.98px, pusat359.59px (viewport360px), label width20px/padding4px; setelah panel membuka header transformy0. Rotasi ikon teramati selama lebar label bertambah; label final utuh. Reverse mengembalikan pusat dan width20px. Mobile390×844: title/description reveal, statistik stacked, tanpa overflow. Build TS frontend/API/Vite lulus, warning chunk lama tetap. Screenshot docs/screenshots/about-centered-header.png. Reduced motion system/perangkat fisik belum diuji. QC: tempo reveal teks, perpindahan header dan putaran ikon.

## Solutions — rangkaian tiga lapisan (menunggu QC)

LandingPage sekarang menempatkan Difference → wrapper About/Solutions dalam `.landing-story`. About memakai satu CSS sticky seperti Difference, dengan margin215vh untuk storyboard-nya; trigger About memakai wrapper yang tidak bergerak. Pin About lama dihapus. Hanya Solutions memakai pin terakhir, sehingga tidak ada nested pin. Direct #about melewati reveal/hold tetapi tetap dapat ditutupi Solutions. Perubahan width mengukur ulang tinggi natural About/Difference agar threshold desktop tidak memakai ukuran teks mobile; listener/frame dibersihkan bersama context.

`useSolutionsMotion`: intro ikon + judul per baris di tengah, label melebar/ikon berputar, heading bergeser ke kiri dan atas menuju layout asli, deskripsi terbuka di kanan, garis putih memanjang simetris, panel membuka ke bawah, isi/foto kartu muncul bertahap, lalu panel terpisah menjadi3 kartu. Timeline scrub1.4, range230vh, dapat dibalik. Judul pendek bergerak lewat transform per baris, tanpa toggle text-align. Mask panel About/Solutions memakai variabel CSS x/bottom/radius dengan fromTo eksplisit, menghindari interpolasi string inset yang disingkat browser saat refresh.

Desktop >=1280px dan tinggi>=672px: padding dan tinggi kartu disesuaikan viewport (card320–438px) agar komposisi utuh muat. Konten, foto, fitur CTA, tiga variasi kartu dan urutannya dipertahankan. Jika tidak muat/tablet/mobile: tanpa pin panjang; reveal header/kartu mengikuti scroll alami, overlap visual32px, susunan kartu responsif lama dipakai. Direct #solutions/#solutions-title/#solution-* dan reduced motion menampilkan konten lengkap. Loading/error/empty dan dialog lama dipertahankan; tidak ada API/dependency/aset baru.

Verifikasi: browser1280×720 melalui intro/3 lapisan, judul tengah, header ke kiri, garis tipis simetris, panel tinggi, reveal isi, gap kartu, scroll balik. Pada URL #about, scrollY2253.5 menghasilkan About top0/Solutions396.20px, turun144px dan kembali menghasilkan geometri identik. Hanya1 pin-spacer di rangkaian. Learn More via Enter membuka dialog; Escape mengembalikan fokus ke tombol. Mobile390×844 tanpa overflow/pin tersisa, direct URL/refresh dan reveal alami diperiksa. Build React/API dan legacy, 23 tes frontend lulus; warning chunk React>500kB masih ada. Reduced motion system dan perangkat fisik belum diuji. Screenshot solutions-centered.png, solutions-scroll-cards.png dan about-solutions-overlap.png. Tunggu QC sebelum motion Testimonials.

### About recedes under Solutions — menunggu QC

About kini memakai depth yang sama dengan Difference pada desktop sticky: hanya `.about__content` naik40–60px (54px pada viewport720px) dan scale1→0,97. Progres mengikuti Solutions top bottom→top10%, scrub1/ease none; header/statistik tetap memiliki timeline anak sendiri. Background/grid, opacity dan geometri sticky tidak diubah. Tidak menambah pin, RAF atau listener; context/resize/reduced motion memakai lifecycle yang ada. Mobile/viewport pendek tetap alur alami; direct Solutions melewati depth.

Browser1280×720 pada #about: scrollY2217.5, About top0/Solutions432.20px, scale0,9867/y−23,96px; turun144px menghasilkan scale0,98/y−35,96px. Kembali144px menghasilkan transform/geometri identik. Background transform none, opacity1, hanya1 pin Solutions. Mobile390×844 membersihkan transform About menjadi none, sticky relative, pin0, tanpa overflow. Build frontend/API/Vite lulus; warning chunk lama tetap. Screenshot docs/screenshots/about-overlap-depth.png. Tunggu QC.

### Reveal isi Solutions + grid stabil — menunggu QC

Grid memakai gap akhir8px sejak awal; tween gap0→8 dihapus. Lebar kartu, foto, dan text wrapping tidak lagi berubah saat panel terpisah. Backing panel putih mengisi gutter selama fase menyatu; opacity panel turun bersamaan background/border/radius kartu muncul sehingga gutter terbuka secara visual tanpa relayout.

`revealItem` menambahkan fase per kartu: ikon fade/translate/scale ringan → judul → deskripsi → CTA. Foto memakai mask kiri→kanan melalui variabel CSS; scale1.06→1 terpisah pada gambar. Badge menyusul. Konten/visual tidak lagi direveal sekaligus lewat wrapper. Seluruh tween scrub dua arah dan dibersihkan context; tidak memakai display:none/mengubah ukuran teks. Desktop range250vh menjaga tempo; mobile/tablet/viewport pendek memakai timeline per kartu dalam scroll alami. Direct Solutions/reduced motion tetap menampilkan seluruh isi.

Desktop1280×720: sebelum dan sesudah pemisahan, seluruh ukuran identik: kartu603/262/262px, tinggi344px; judul tinggi29px dan deskripsi67px, lebar deskripsi220/196/170px, foto317px. Gap tetap8px termasuk saat reverse. Fase parsial teramati: ikon0.994/title0.889/deskripsi0.539/CTA0/badge0, mask foto75.2%, menunjukkan urutan overlap reveal. Learn More Enter/Escape tetap berfungsi. Build TS frontend/API/Vite lulus; warning chunk lama tetap. Screenshot solutions-content-reveal.png (fase parsial) dan solutions-fixed-card-layout.png (akhir). Tunggu QC.

Cek mobile390×844: urutan isi kartu tetap teramati (ikon1, judul0.9997, deskripsi0.9554, CTA0.6916), foto/badge terbuka ketika dilanjutkan scroll, tanpa overflow. Desktop dan mobile tetap memakai ukuran akhir masing-masing breakpoint; hanya opacity/transform/mask yang berubah selama reveal.

## Testimonials — takeover dan reveal blok (menunggu QC)

Rangkaian kini Difference → About → Solutions → Testimonials. Solutions memakai CSS sticky + hold250vh dengan trigger `.solutions-testimonial-story`, menggantikan pin GSAP terakhir. Wrapper Solutions/Testimonial mendapat z-index2 agar berada di atas About. Seluruh lapisan memakai containing block stabil; tidak ada nested pin atau pin-spacer baru. Konten Solutions mundur40–60px/scale0.97 selama takeover seperti lapisan sebelumnya.

React Testimonials memakai `testimonial--viewport`: desktop yang muat memiliki panel100svh; padding/gap responsif dipadatkan tanpa mengubah isi/aset. `.testimonial-scene` mempunyai tinggi calc(100svh +220vh), sehingga sticky ditahan oleh tinggi content box yang nyata. Takeover scrub mulai ketika scene top90% (10% terlihat). Selama40vh scroll, panel naik dari bagian bawah sampai penuh. Selama50vh berikutnya transform mengimbangi gerak natural scene agar background tetap tepat di layar; sesudahnya CSS sticky menjaga posisinya. Tidak mengunci scroll/menjalankan autoplay. Radius merata saat takeover; transisi dapat dibalik.

Setelah penuh: jeda singkat → heading/pengantar → portrait mask vertikal + scale1.04→1 → penanda kutipan/tahun → kutipan per baris → tagline → rating/nama/count/kontrol. Garis atas dan bawah scaleX0→1 dari tengah dengan fase berbeda; ornamen pojok fade ringan. Ukuran garis/layout tetap. Isi yang punya stagger diinisialisasi tersembunyi untuk semua target agar detail tidak muncul lebih awal.

Kutipan dirender menjadi span kata lewat React (teks dan spasi tetap terbaca aksesibilitas). Layout effect mengukur baris aktual dan menulis rasio baris; observer/font ready menangani wrapping tanpa rekonstruksi DOM oleh GSAP. Satu CSS variable progres pada section menggerakkan opacity/translate kata per baris, termasuk kata baru ketika carousel berganti. DOM reads dibatch sebelum writes; observer/promise guard/listener/frame/matchMedia dibersihkan. Fokus perpindahan story memakai preventScroll. Navigasi, status announcement, disabled batas dan keyboard tetap.

Layar mobile/pendek atau konten yang tidak muat: tinggi natural dengan minimum100svh, reveal alami per blok/garis tanpa hold panjang. Tidak memotong isi demi100vh. Direct #testimonials/#testimonial-title serta reduced motion tampil penuh. State loading/error/empty tetap tersedia. Tidak ada dependency/API/data baru, tidak ada perubahan motion Missions/Sectors.

Verifikasi desktop1280×720: panel720px, content top108.41/bottom611.59px; seluruh kata opacity1 setelah selesai. Pada scene top648.20px panel648.20px, top504.20px panel324.83px, top360.20px panel sekitar0px; kontrol masih opacity0 saat takeover selesai. Saat reveal berjalan, panel top0 dan quote progres0.3665. Pada exit panel bottom432.20px tepat sama dengan Missions top432.20px (tanpa gap). Scroll turun432px/balik mengembalikan panel/section top0 dan scrollY5493.5 identik. Carousel Enter/End/Home, seluruh3 cerita, fokus batas dan konten penuh diperiksa. Mobile390×844 panel901px natural, tanpa overflow, reveal/portrait/quote/garis bawah diperiksa. Build React/API dan legacy serta23 tes frontend lulus; warning chunk React lama tetap. System reduced motion/perangkat fisik belum diuji. Screenshot testimonials-reveal.png dan testimonials-fullscreen.png. Tunggu QC sebelum section berikutnya.

### Perbaikan batas lepas sticky Testimonials — menunggu QC

Batas lama reveal (start−50vh +270vh =+220vh) berimpit dengan batas CSS sticky (+220vh). Numeric scrub1.3 dapat tertinggal dari scroll sehingga panel bergerak keluar sementara detail masih menuju state akhir.

Revisi: `.testimonial-scene__hold` menjadi spacer flow sungguhan setelah section. Height320vh hanya pada mode desktop yang muat; wrapper mengikuti tinggi nyata section +spacer (tanpa hardcoded height wrapper). Akhir reveal dihitung dari tinggi wrapper−tinggi section, dikurangi100vh buffer, dengan kompensasi start50vh. Reveal tetap memiliki jarak270vh pada viewport720px; sticky baru lepas100vh sesudahnya. Ketika raw scroll melewati akhir takeover/reveal, scrub diselesaikan di area tahan; reverse melewati awal mengembalikan state0. Jeda buffer tidak menambah animasi baru dan tidak mengunci scroll. Pada fallback/direct/reduced motion spacer kembali0 lewat context cleanup.

Browser1280×720 pada #solutions: section720px, spacer2304px, wrapper3024px; revealEnd5637.70 dan release6357.70 (beda720px). Input scroll besar ke6285.5: panel top0, seluruh detail opacity1, seluruh kata penuh dan mask portrait0%. Setelah melewati release (y6429.5), panel bottom648.20 sama dengan Missions top648.20; semua detail tetap1. Scroll balik ke6285.5 mengembalikan panel top0/isi penuh, lalu reverse lebih jauh kembali memberi opacity bertahap (0.473/0.132/0.014/0), jadi reveal tetap reversible. Screenshot testimonials-sticky-hold-fixed.png. Build React/API/Vite dan legacy lulus; warning chunk lama tetap. Menunggu QC bugfix; definisi tinggi220vh sebelumnya bersifat historis.

Mobile390×844 pada revisi ini: spacer0, sticky relative, panel901px natural, tanpa overflow. Direct #testimonials juga spacer0, semua kata dan kontrol terlihat. Tidak ada tambahan ruang baca pada fallback/direct URL.

### Perbaikan sinkronisasi takeover saat scroll cepat / reverse — menunggu QC

QC pengguna menunjukkan penambahan hold sebelumnya belum menyelesaikan background yang terlepas. Penyebab terukur ada pada transform takeover: gerak natural/CSS sticky mengikuti posisi scroll saat itu, sedangkan transform penyeimbang tertinggal oleh numeric scrub0.8. Memanjangkan hold tidak menyinkronkan dua gerak tersebut. Pengukuran sebelumnya yang dilakukan sesudah gerak berhenti melewatkan selisih sementara ini.

Sebelum revisi, sampel DOM selama scroll turun menunjukkan scene top245.70px tetapi panel top−112.38px, lalu panel−117.62px ketika scene top210.20px. Saat reverse, panel bergeser ke+116.95px walaupun fase ini semestinya tetap memenuhi layar. Ini menghasilkan celah bawah/atas, bukan sticky yang kehilangan containing block.

Timeline geometri kini memakai scrub:true dengan ease:none, langsung mengikuti posisi scroll yang sudah dihaluskan Lenis. Callback settle pada takeover dihapus agar tidak memaksa state endpoint saat arah berganti. Reveal konten tetap scrub1.3, border/radius tetap mengikuti progres, hold320vh dan buffer100vh tidak diperpanjang lagi. Tidak menambah ticker, pin, listener, dependency atau perubahan layout/section lain.

Verifikasi setelah refresh penuh (bukan hanya HMR): sampel beruntun selama turun menunjukkan scene top339.20→318.20px dengan panel top−0.297px; reverse scene240.70→342.70px juga panel−0.297px. Selisih kurang1px berasal dari pembulatan posisi ScrollTrigger. Alur landing `/` dengan seluruh sticky Difference/About/Solutions aktif juga memberi posisi yang sama selama pergantian arah sebelum scroll berhenti. Pada exit, panel bottom612.20px sama dengan Missions top612.20px. Reverse dari exit menghasilkan panel−62.30px/bottom657.70px yang tetap menyambung Missions, kemudian kembali panel top0 setelah memasuki area sticky; seluruh detail sudah opacity1.

Mobile390×844: spacer0, position relative, transform panel none, panel natural900.60px dan tanpa overflow. Direct #testimonials pada desktop menampilkan seluruh kata/kontrol dengan spacer0 dan tanpa transform. Tidak ada error/warning pada console browser. Build TS frontend/API/Vite lulus; warning chunk React>500kB masih ada. Jalur Pug/SCSS tidak diubah sehingga build legacy tidak diulang pada revisi ini. Screenshot: testimonials-scroll-sync-fixed.png. QC berikutnya: scroll cepat turun, segera balik naik pada takeover, serta lintasi batas keluar/masuk sticky sebelum menuju section berikutnya.

## Carousel Testimonials — pergantian berlapis (menunggu QC)

Sticky telah diterima pengguna. Implementasi berikutnya hanya pergantian cerita: kutipan lama keluar lewat mask per baris (0–0.58s); portrait baru menyapu horizontal (0.16–1.26s), foto settle scale1.05→1; kutipan baru masuk dengan stagger baris (0.55–1.6s); nama/rating/tahun/tagline menyusul (0.72–1.47s); counter menggulung vertikal. Previous membalik arah mask/teks/counter. Background, garis, intro dan geometri sticky menjadi panggung tetap. Hover panah memakai translate3px + transisi background. Aset portrait/copy tetap dari service yang sama; contoh cerita saat ini memang memakai foto yang sama.

Setiap field menumpuk seluruh cerita melalui CSS grid, sehingga ukuran akhir semua kutipan/identitas direservasi sejak awal dan tidak berubah saat selected berganti. Story inaktif tetap ikut sizing, aria-hidden dan visibility hidden; hanya satu cerita terbaca. Quote tetap teks/spasi React, pengukuran baris membatch reads sebelum writes untuk seluruh paragraf, observer/font-ready memiliki cleanup. Span carousel berada di dalam span scroll, dan portrait-reveal menjadi target scale scroll tersendiri; tween carousel tidak menimpa tween ScrollTrigger. Tidak ada perubahan takeover scrub:true atau penambahan ticker/pin.

State React memilih cerita/draft transisi; ref mencegah input ganda selama sekitar1.6s, aria-busy/aria-disabled memberi status tanpa men-disable kedua kontrol hingga kehilangan fokus. Batas awal/akhir tetap disabled, fokus dipindah ke kontrol yang tersedia memakai preventScroll. Keyboard ArrowLeft/Right/Home/End tetap tersedia. Pengumuman live hanya setelah cerita selesai masuk. Resize/motion preference change menyelesaikan timeline ke tujuan; unmount/refetch membersihkan context/listener. Jika daftar cerita menyusut, transisi yang kehilangan target dihentikan tanpa akses node kosong. Reduced motion berpindah langsung.

Swipe memakai Pointer Events untuk touch/pen: jarak horizontal48px dan dominan1.4× vertikal, dengan pointer capture/cancel cleanup. `touch-action: pan-y pinch-zoom` mempertahankan scroll/pinch native. Mouse tidak memicu swipe sehingga seleksi teks tetap tersedia. Tidak ada autoplay atau library carousel/dependency baru.

Verifikasi desktop1280×720 pada scene sticky: sebelum/selama/sesudah pergantian panel top0/height720px, quote x44/y442/width1192/height104px tetap. Klik ganda Next hanya memilih02, tidak meloncat03. Setelah selesai hanya cerita02 terlihat, transform carousel kembali none dan announcement sesuai cerita. Native klik Previous ke batas01 mempertahankan scrollY5925.5 dan fokus berpindah ke Next. Arah balik mask foto teramati inset kanan9.18%, kata baru translateY−44.05px/opacity0.23 ketika sedang masuk. Scroll balik selama transisi tetap panel top0 dan hold2304px. Ukuran mobile390×844: panel natural937px, quote218.39px dengan ruang cerita terpanjang (5/5/6 baris), tanpa overflow. Pergantian cerita tidak mengubah ukuran; resize ke desktop saat transisi mengembalikan busy=false, satu cerita aktif dan seluruh mask/transform bersih.

Build React/API/Vite dan legacy, serta23 tes frontend diperiksa. Warning chunk React>500kB masih ada. Reduced motion sistem dan swipe pada perangkat touch fisik belum dapat diuji melalui alat browser; perlu QC manual. Screenshot transisi: testimonials-carousel-transition.png; hasil akhir: testimonials-carousel.png. Tidak ada perubahan backend/API/database, flow lain atau motion Missions/Sectors. QC: tempo/overlap foto dan teks, arah Next/Previous, counter/hover, swipe mobile dan konsistensi dengan scroll reveal.

## Missions — garis menjadi jendela foto + speedometer (menunggu QC)

Pengguna menerima carousel, menyetujui storyboard dan animasi speedometer, kemudian mengizinkan implementasi. Scope hanya handoff Testimonials → Missions dan reveal Missions; Sectors/Footer tidak dianimasikan pada tugas ini.

Containing block `.testimonial-scene` dipindah ke LandingPage: Testimonials → spacer320vh → Missions. Native sticky Testimonials tetap menjadi latar selama perpindahan. Perhitungan akhir reveal Testimonials kini memakai tinggi spacer320vh secara eksplisit, sehingga penambahan tinggi Missions tidak meregangkan tempo/reveal yang sudah QC. Tidak ada nested pin, GSAP pin-spacer, scroll lock, dependency atau ticker Lenis baru.

Pada desktop yang muat, Missions memakai native sticky top0 +spacer280vh. Padding story5vh (24–64px), jarak header5vh (24–48px), dan minimum tinggi visual48vh (320–432px) menjaga layout dua kolom tetap utuh pada viewport. Jika tidak muat, kelas story dilepas dan konten mengikuti tinggi natural. Default/direct URL tetap memakai spacing desain sebelumnya.

Handoff mulai saat Missions scene top mencapai bawah viewport: isi Testimonials naik24px sambil fade, ornamen atas memudar, dan garis bawah menyusut ke lebar visual Missions sambil menuju tengah layar. Wrapper ornamen terpisah menjaga tween scroll asli tidak berebut opacity/transform child. Foto Missions masih tersembunyi hingga stage mencapai top0, sehingga tidak muncul dua garis/jendela di posisi berbeda sebelum keduanya bertemu.

Selanjutnya satu timeline scrub:true: foto asli membuka vertikal dari celah di tengah, scale1.07→1; background terang mulai meluas dari belakang foto; visual bergerak ke sel grid kanan yang sudah menyimpan ukuran akhirnya. Label melebar/ikon berputar, judul reveal per baris aktual, deskripsi, garis benefit, ikon dan teks muncul bergantian. Gauge menyelesaikan komposisi, kemudian ada jeda baca sebelum sticky lepas. Semua geometri mengikuti scroll langsung yang sudah dihaluskan Lenis, termasuk ketika arah berubah cepat. Background dan transform carousel tidak diubah. GSAP context/matchMedia, frame setup, resize/intro listener, observer judul/font promise memiliki cleanup.

Speedometer mempertahankan aset track/arc/pointer serta geometri ilustrasi desain. Mask conic membuka sweep0→116deg, wrapper pointer berputar−108→0 di pusat gauge, lalu melambat menuju posisi akhir. Counter persen valid (maksimal dua desimal) mengikuti nilai CMS, sekarang0→54%; lebar digit/tabular-nums tetap, pembaruan hanya pada elemen dekoratif aria-hidden. Label figure tetap berisi nilai asli dan status ilustrasi, tidak ada live announcement tiap frame. Teks nonpersen tetap ditampilkan tanpa count-up. Tidak menambahkan definisi bisnis, perhitungan velocity atau hubungan ledger; sudut akhir tetap ilustrasi aset yang sudah disetujui. Cleanup memulihkan angka asli; node counter keyed oleh nilai CMS agar cleanup data lama tidak menimpa copy baru.

Mobile/tablet/viewport pendek/isi yang tidak muat: tanpa stage/hold panjang. Label, judul, copy, benefit dan mask foto mengikuti scroll alami; gauge berjalan ketika visual memasuki area baca. Direct #missions/#missions-title serta reduced motion menampilkan konten penuh. Direct #testimonials memakai alur alami Missions karena Testimonials tidak ditahan pada mode direct tersebut. API/loading/error/empty tetap memakai komponen/service lama.

Verifikasi desktop1280×720 setelah refresh: section Missions720px dan spacer2016px; foto terpusat x350.12/y178.70, ukuran579.77×362.59px ketika membuka, dengan background Testimonials top0. Surface kemudian mencapai inset0; visual kembali transform0 ke kanan. Pada scrollY8517.5 gauge menunjukkan24%, sweep51.91deg dan pointer masih berputar; scrollY8949.5 mencapai54%, sweep116deg dan transform pointer identity. Reverse432px kembali24% pada posisi yang sama. Fast scroll menuju exit menahan kedua permukaan di top0; saat melewati batas, Missions top−1.30/bottom718.70px sama dengan Sectors top718.70px. Setelah exit lebih jauh, bottom432.20px masih sama dengan Sectors top432.20px; reverse kembali menahan Missions di top0.

Mobile390×844: position relative, hold0, tanpa overflow. Pada scroll alami, visual432px terbuka penuh, counter50% dan pointer mendekati akhir; direct #missions mengembalikan counter54, transform none dan surface mask none. Desktop/mobile, direct URL/refresh, resize breakpoint dan scroll cepat/reverse diperiksa. Build TS frontend/API/Vite dan legacy,23 tes frontend lulus; warning chunk React>500kB tetap ada. Gesture touch fisik dan preferensi reduced motion sistem belum diuji secara langsung. Tidak ada perubahan API/database atau data CMS.

Screenshot: missions-photo-window.png, missions-speedometer-progress.png, missions-story-complete.png dan missions-mobile-motion.png. QC: tempo garis→foto, perluasan terang, perpindahan foto, reveal teks/benefit, dan kelambatan jarum mendekati54%; scroll balik/cepat serta adaptasi mobile. Tunggu QC sebelum motion Sectors/Footer.

### Revisi Missions: posisi tengah, text fill dan gauge utuh — menunggu QC

Desktop story kini memakai flex column/justify-content:center pada section min100svh. Seluruh kelompok header +body berada di pusat vertikal, dengan padding simetris sebagai ruang minimum. Ukuran akhir dihitung sebelum offset foto, sehingga fase foto terpusat dan perpindahannya tetap menyambung. Konten yang lebih tinggi dari viewport tetap masuk fallback natural; tidak dipotong atau dipaksa center pada mobile.

Kalimat emphasis “Trusted by organizations committed to funding what matters most.” dirender sebagai span kata dengan spasi/teks asli. Gradient background-clip:text mengisi warna text-secondary→text dari kiri ke kanan, dengan progres kata bertumpuk agar mengalir lintas baris. Timeline desktop fase3.65–5.3, reversible; fallback trigger top85%→bottom45% memakai scrub1.1. Tidak mengubah lebar/ukuran teks atau menjalankan DOM splitting. Default/direct/reduced motion progres1, forced-colors memakai CanvasText.

Gauge React mengganti dua geometri aset yang tidak sepusat dengan satu SVG viewBox288×186. Track/fill menggunakan path lingkaran identik: pusat144/143, radius119, sudut awal170° dan sweep200°. Keduanya stroke20/round; dashoffset normalisasi100→0 menggambar seluruh lintasan tanpa ujung terpotong. Marker SVG berada di titik awal path lalu rotate0→200 pada pusat yang sama, bukan orbit CSS terpisah dengan koordinat perkiraan. Ikon pointer asli dipertahankan; aset arc/track lama tetap tersedia untuk Pug. Sapuan warna penuh sesuai instruksi revisi, sedangkan counter tetap0→nilai CMS54% dan tidak mendefinisikan pengukuran velocity/ledger.

Desktop1280×720 setelah refresh: konten top103.51/bottom616.49px, pusat tepat360px. Pada scrollY8193.5 progres fill0.437: “Trusted/by” sudah penuh, “committed” sekitar62%, kata belakang masih muted. Pada scrollY8553.5 counter32%, dashoffset41.571547 dan markerrotate116.8569; selisih pusat marker dengan ujung path dihitung dari geometri DOM sekitar0.000023px. Track/fill d identik, stroke20px dan linecap round. Akhir scrollY8949.5: dashoffset0/opacity1, marker200°, angka54%; semua track tertutup warna. Browser mobile390×844/direct URL membersihkan hold/transform dan menampilkan nilai54 serta gauge penuh tanpa overflow. Build React/API/Vite dan legacy serta23 tes frontend lulus; warning chunk lama tetap. Touch fisik/reduced motion sistem belum diuji langsung.

Screenshot revisi: missions-text-fill.png (fase pengisian) dan missions-centered-rounded-gauge.png (akhir). Menunggu QC posisi tengah, tempo text fill, dan kebulatan/alignment gauge.

Cek tambahan alur mobile alami390×844: emphasis top502.09px/progres0.4805, kata pertama sudah penuh dan kata terakhir masih muted; hold0 dan tanpa overflow. Ini memverifikasi trigger fill mobile terpisah dari storyboard desktop.

### Heading Missions mengikuti screenshot revisi — menunggu QC

Header React pada desktop/tablet memakai grid23%/77% tanpa gap horizontal: label di kiri sejajar bagian bawah heading, judul dimulai lebih ke kiri. Font responsif32–48px memakai kelipatan token font-size-xl; frasa dalam tanda kurung mulai di baris baru. Copy tetap dari CMS dan span reveal/observer baris tetap digunakan. Mobile mempertahankan susunan stacked/font36px, dengan br tersembunyi agar wrapping alami.

Browser1280×720: judul mulai x326.80px, label dan heading sama-sama berakhir di y213.50px; dua baris berawal pada x yang sama. Pusat keseluruhan konten tetap360px. Pada lebar1326px judul mulai x337.38px, sesuai proporsi screenshot referensi. Mobile390×844 tanpa overflow; header flex dan br display:none. Build React/API/Vite dan legacy lulus. Screenshot: missions-heading-layout.png. Tidak ada perubahan gauge, text fill, API atau data; menunggu QC layout heading.

### Heading dinaikkan di atas garis

Revisi berikutnya menaikkan header desktop24px melalui translate pada wrapper, tanpa berebut transform label/judul. Grid horizontal sekarang memakai CSS variable yang dihitung dari batas bawah header +16px. Observer pengukuran judul juga mengamati content/section dan membatch pembacaan posisi sebelum menulis variable; cleanup melepas observer/variable. Ini menjaga garis di bawah heading ketika tinggi viewport atau wrapping berubah, alih-alih bergantung pada offset210px yang tetap. Mobile tetap tanpa translate, dengan garis mengikuti batas header natural.

Browser1280×720: heading/label bottom189.50px, garis top205.50px, jarak16px. Build React/API/Vite dan legacy lulus. Screenshot: missions-heading-above-divider.png. Menunggu QC.

Desktop1440×900 dan mobile390×844 juga mempertahankan jarak16px antara header dan garis, tanpa overflow.

### Pointer gauge berhenti pada 54%

Marker sekarang memakai persentase CMS untuk posisi akhir: 54% dari sweep 200° =108°, dekat tengah atas lintasan. Arc warna tetap menutup seluruh track sesuai revisi sebelumnya. Tween scroll dan default SVG memakai sudut yang sama, sehingga akses langsung/reduced motion juga konsisten. Build React/API/Vite lulus; posisi akhir browser terverifikasi rotate(108 144 143), counter54 dan dashoffset0. Tidak ada perubahan API/data.

### Revisi arc mengikuti nilai54%

Arc oranye kini berhenti bersama marker pada54% lintasan: pathLength100 memakai dashoffset46, marker108° dari total200°. Sisa track abu-abu tetap terlihat. Tween arc/pointer/counter memakai durasi dan easing yang sama; markup default juga konsisten untuk direct anchor/reduced motion. Revisi ini menggantikan keputusan arc penuh sebelumnya. Build React/API/Vite lulus; browser memverifikasi offset46 dan marker108°.

## Missions → Sectors → Footer — prototipe QC

Sectors kini berada di dalam containing block Missions, setelah hold280vh yang telah disetujui. Pada desktop≥1280px/tinggi≥672px dan konten muat satu layar, foto dekoratif dari aset Missions menyambung posisi akhir figure lalu melebar menjadi canvas. Copy/metric Missions memudar; wash warna background menggantikan foto sebelum Sectors mengambil layar. Geometri mengikuti scrub langsung dengan satu clock Lenis; tanpa pin GSAP/fixed viewport tambahan. Pengukuran mengurangi transform intro figure agar sambungan memakai posisi akhir grid. Setup Sectors menunggu frame berikutnya setelah setup Missions.

Sectors sticky menggunakan hold150vh; label membuka/berputar, heading dan description terungkap, lalu mask kartu membuka bergantian bersama teks/gambar. Grid/gap final tetap. Mobile, viewport pendek atau konten terlalu tinggi memakai flow natural dengan reveal per kartu. Direct #sectors/#sectors-title/#footer dan reduced motion mempertahankan tampilan statis. Bridge memakai aria-hidden dan pointer-events:none; dialog/return focus tetap menggunakan komponen lama.

Footer memakai clipping container dan parallax panel100px untuk kesan curtain, disusul rule/brand/newsletter/kolom link serta legal. Tinggi natural footer tetap tersedia agar konten di layar pendek dapat dibaca. Hook cleanup mengembalikan context/matchMedia, class, RAF dan listener; tidak ada API/database baru.

Akses langsung #missions tetap menampilkan semua konten/gauge54% dan memakai hold singkat40vh sebelum bridge; tidak menjalankan ulang reveal masuk Missions. Browser1280×720: bridge posisi awal sesuai foto (left640.234/top249.5), transisi tengah tidak terpotong, Sectors final720px, dialog Healthcare/Nonprofits dan Escape/return focus diperiksa. Mobile390×844: flow natural/hold0, tidak ada overflow, reveal per kartu dan direct #sectors diperiksa. Scroll maju/balik dan console diperiksa tanpa error baru. Build React/API/Vite dan legacy serta23 tes frontend lulus. Screenshot missions-sectors-handoff.png, sectors-scroll-complete.png, sectors-footer-curtain.png, sectors-mobile-reveal.png. Gesture touch fisik dan reduced motion sistem tetap perlu QC manual.

## Revisi handoff horizontal Missions → Sectors

Atas instruksi pengguna, bridge foto/canvas dihapus. Panel Sectors asli masuk dari kanan ke kiri (xPercent100→0), dengan y−100vh→0 membatalkan perpindahan vertikal selama scene top bottom→top top. Geometri memakai scrub langsung, tanpa pin/RAF baru. Missions content bergerak8vw ke kiri, mengecil2% dan opacity1→0.35. Header Sectors mulai reveal saat panel hampir penuh (scene top20%); kartu mengikuti dengan mask dari kanan dan gerak24px. Posisi akhir/grid tetap sama, curtain Footer dipertahankan.

Containing block Missions memakai overflow-x:clip/overflow-y:visible agar panel di luar viewport tidak menyebabkan horizontal scroll dan tidak membuat scroll container yang memutus sticky. Sectors scene mengizinkan area satu viewport di atasnya melalui clip-path. Mobile/viewport pendek/konten panjang tetap flow natural, panel/kartu bergeser pendek32px; direct Sectors/Footer dan reduced motion tetap statis. Cleanup matchMedia/RAF/listener dan restore class tetap tersedia.

Browser1280×720: panel pada progress50% berada x640.89/y−0.30, final x0/y0, tidak ada overflow horizontal. Reverse memulihkan opacity Missions1 dan gauge offset46. Dialog Healthcare/Close/Escape/return focus tetap diperiksa. Mobile390×844 memakai hold0 tanpa overflow. Screenshot missions-sectors-horizontal.png. Build React/API/Vite dan legacy lulus; gesture touch fisik/reduced motion sistem perlu QC manual. Menunggu QC pengguna.

## Revisi garis kontinu dan fill teks Sectors

Garis atas SVG Missions/Sectors kini digambar sebagai divider horizontal1px yang rata, dengan rule bawah aset tetap dipertahankan. Pengukuran header Missions dibagikan melalui CSS variable pada missions-scene (observer/font-ready/cleanup yang sama), sehingga panel Sectors memakai sumbu yang sama selama slide. Setelah panel menutup Missions, garis Sectors perlahan kembali ke posisi desain210px selama300px scroll. Tidak memakai snapshot posisi sebelum font/layout siap.

Emphasis CMS “Every organization is different.” memakai span per kata dan gradient clip text abu-abu→warna teks. Progres mengikuti timeline scroll Sectors; fallback natural/mobile memakai trigger kalimat. Direct anchor/reduced motion menampilkan teks penuh dan forced colors memakai CanvasText. Tidak mengubah copy CMS, ukuran/layout teks, kartu atau footer.

Browser1280×720 pada slide tengah: garis Missions205.5px/Sectors205.20px (selisih subpixel0.30px dari kompensasi travel), dibanding gap sebelumnya. Fill intermediate0.234 terverifikasi. Build React/API/Vite dan legacy lulus. Screenshot missions-sectors-divider.png dan sectors-text-fill.png. Menunggu QC; interaksi kartu berikutnya belum dikerjakan.

## Sectors — tiga state aktif mengikuti scroll

SectorMorphCard menggunakan satu pohon DOM per sektor untuk default/active. Kolom tetap422px pada desktop (442px viewport sempit); satu artikel berubah tinggi300→422px, thumbnail60px membesar menjadi foto, judul berpindah/berganti warna, plus berputar/crossfade ke arrow, angka urutan memudar, dan panel metrik terbuka lewat mask setelah progres active45%. Nonprofits default berada di bawah angka01, Healthcare default di atas angka02, Education default di bawah angka03. Tidak me-remount kartu atau mengubah grid/gap saat fokus berpindah.

Foto HD pengguna Frame594.png untuk Healthcare dan Frame553.png untuk Education dipetakan sebagai aset bundel berdasarkan stable ID. Copy/aset thumbnail lama tetap dipertahankan; tidak ada perubahan kontrak CMS, API atau database. Seluruh kartu aktif memakai nilai ilustrasi section yang sama; angka, nominal dan bar tidak dianimasikan atau diberi definisi bisnis baru.

Hold reveal150vh tetap; hold terpisah260vh menambahkan urutan Nonprofits → Healthcare → Education dengan overlap penutupan/pembukaan dan jeda sebelum Footer. Timeline CSS variable mengikuti scrub langsung sehingga reverse kontinu. #sectors/#sectors-title melewati reveal masuk tetapi mendukung urutan active; event readiness setelah pengukuran memastikan anchor tidak diarahkan sebelum hold section lain siap. Notifikasi sekali per mount/hash, bukan resize. Mobile/section terlalu tinggi memakai flow natural dan membuka/menutup per kartu saat melewati tengah viewport. Reduced motion menampilkan semua kartu aktif secara statis.

Panel metrik yang belum terbuka memakai inert/aria-hidden dan dipulihkan saat cleanup. Tombol Explore tunggal tetap tersedia; Learn More hanya dapat difokuskan ketika panel hampir sepenuhnya terbuka. Dialog/return focus tetap menggunakan komponen yang sama. Tidak memakai React state per frame atau menambahkan RAF Lenis baru. Cleanup mengembalikan context/CSS variable dan atribut aksesibilitas.

Browser1280×720: Nonprofits awal, Healthcare aktif (Nonprofits default+01), Education aktif, reverse Healthcare diperiksa; area kolom tetap422px dan tanpa overflow. Dialog Education/Healthcare, Escape dan return focus diperiksa. Mobile390×844: kolom stacked442px/hold0, foto Healthcare HD dan dialog diperiksa tanpa overflow. Build React/API/Vite dan legacy,23 tes frontend lulus. Screenshot sectors-healthcare-active.png, sectors-education-active.png, sectors-mobile-healthcare.png. Gesture touch fisik/reduced motion sistem perlu QC manual. Menunggu QC morph/timing; animasi nominal/bar tetap ditunda.

## Reveal kartu — satu bidang menjadi tiga

Entrance yang hanya menggeser/memask seluruh kartu diganti menjadi garis putih horizontal (scaleX0.12→1, scaleY0.004), lalu canvas tumbuh vertikal, ketiga artikel membuka bergantian. Foto melalui mask dan zoom kecil, judul terungkap dari wrapper, ikon/deskripsi/nomor menyusul, panel metrik pertama membuka setelah foto. Lapisan putih pada gap menipis sambil canvas memudar, tanpa mengubah lebar kolom atau gap aktual. Hold entrance diperpanjang150→220vh agar rangkaian tidak terburu-buru; hold260vh dan timeline morph aktif tidak berubah.

--sector-entry mengontrol mask artikel secara terpisah dari --sector-active. Wrapper title/description/number/metrics menyimpan transform/opacity entrance sehingga tidak menimpa CSS morph. Root kartu inert sampai progres entry98%; cleanup melepas atribut. Panel metrik mempunyai inert/aria-hidden sendiri seperti sebelumnya. Canvas/seam dekoratif aria-hidden/pointer-events:none. Mobile menggunakan entrance per kartu sesuai viewport tanpa canvas tiga kolom yang memanjang; direct Sectors/reduced motion tetap melewati entrance. Event layout-ready juga memposisikan anchor Missions setelah containing block siap.

Browser1280×720: fase garis, canvas, entry0.56/0.06/0, gap membuka dan layout akhir diperiksa, tanpa overflow. Reverse mengembalikan mask/inert dan scroll berikutnya tetap mengaktifkan Healthcare (entry ketiganya1). Dialog Healthcare/Escape/return focus diperiksa. Mobile390×844: canvas none, entry per kartu, tanpa overflow; gesture touch fisik/reduced motion sistem perlu QC manual. Build React/API/Vite dan legacy serta23 tes frontend lulus. Screenshot sectors-entry-line.png, sectors-entry-canvas.png, sectors-entry-complete.png, sectors-entry-mobile.png. Menunggu QC entrance/tempo; nilai/progress bar tetap statis.

## Metrik kartu — counter dan progress mengikuti active

Nominal Total Donation dan label persen dekoratif kini mengikuti progres active sesudah60% morph, dengan easing cubic-out. Kartu pertama juga menunggu progres entrance panel metrik sehingga nominal tidak langsung penuh sebelum panel membuka. Jumlah dihitung sebagai integer cents, target akhir dipulihkan persis sesuai string CMS. Bar memakai lebar target persentase CMS52% (menggantikan lebar ilustrasi lama57.3%) dan transform scaleX dengan origin kiri; label persen dan nominal memakai progres yang sama. Reverse mengikuti nilai progres yang sama, tanpa timer/counter mandiri.

Hanya format USD/persen numerik valid yang dianimasikan; copy lain tetap utuh. Nilai/persentase CMS tidak diubah, semua tetap ilustrasi. Counter memakai tabular-nums, blok nominal dengan tinggi stabil, persen right-aligned. Nilai asli disediakan lewat teks visually-hidden; span yang berubah aria-hidden tanpa aria-live agar pembaca layar tidak dibanjiri angka. Restore mengembalikan teks/transform saat unmount/resize, hook mengamati perubahan nominal/persen CMS; keyed span melindungi konten baru dari cleanup lama. Tidak ada React setState/RAF baru per frame. Listener readiness anchor kini tetap terpasang meski anchor pernah diposisikan, agar perubahan status fetching tidak melepas handler sebelum geometri siap.

Browser desktop: Healthcare state0.877 menghasilkan$11,070.13/50%, bar scale0.970981×52%; state penuh$11,400.97/52%/scale1. Reverse kembali tepat ke nilai intermediate yang sama. Mobile390×844 mencapai target yang sama, tanpa overflow/console error. Build React/API/Vite dan legacy serta23 tes frontend lulus. Screenshot sectors-metrics-progress.png, sectors-metrics-complete.png, sectors-metrics-mobile.png. Reduced motion sistem/gesture touch fisik perlu QC manual; static markup target tetap tersedia. Menunggu QC counter/tempo.

## Footer — overlap penutup dan satu layar desktop

Footer tetap di luar main sebagai landmark halaman. Desktop≥1280px/tinggi≥672px menggunakan spacing compact, min-height100svh dan panel viewport−16px; tinggi tetap bisa membesar jika copy tidak muat. Ketika Footer dan Sectors muat/sticky, footer-hold setinggi viewport memperpanjang containing block Sectors, sementara margin Footer−100vh menutup extension tersebut. Ini memastikan Education menyelesaikan urutan active terlebih dahulu, lalu Footer naik menutup Sectors tanpa GSAP pin tambahan. Pada document end Footer utuh dan diam; tidak ada hold setelah reveal selesai.

Selama overlap, Sectors content bergerak−32px/scale0.98/opacity0.35. Sudut atas panel gelap membulat lalu kembali ke radius desain. Rule memanjang dari tengah, ornamen berputar kecil, logo muncul, heading newsletter terungkap melalui word mask, email membuka horizontal, deskripsi dan kolom link menyusul. Wordmark membuka dari bawah, copyright/legal terakhir. Semua scrub langsung/reversible memakai satu clock Lenis. Nilai/copy/destinasi/preview newsletter tidak berubah.

Mobile, layar pendek atau konten terlalu tinggi tetap natural flow dan reveal per blok; end trigger memakai clamp agar legal/wordmark selesai sebelum batas bawah halaman. Reduced motion dan #footer menampilkan konten utuh tanpa overlap. MatchMedia/RAF/font-ready/event resize/intro/sectors-ready dibersihkan; resize menghitung ulang tinggi/containing block. Readiness Footer ditangani AppLayout untuk direct anchor. Anchor Lenis kini memakai koordinat absolut DOM+scrollY agar tidak memakai posisi animatedScroll yang tertinggal ketika browser memposisikan fragment.

Browser1280×720: footer720px/panel704px, overlap tengah Footer top359.70px/Sectors top0 dan Education active1; document end Footer top0.70px/legal opacity1 tanpa overflow. Reverse mengembalikan Sectors opacity1. Form email→Tab memfokuskan tombol preview; dialog Contact Us/Escape/return focus diperiksa tanpa submit newsletter. Direct #footer/refresh diperiksa. Mobile390×844: footer natural1241.17px, margin0/exit-hold0, semua group dan legal opacity1 di document end, tanpa overflow/console error. Build React/API/Vite dan legacy serta23 tes frontend lulus. Gesture touch fisik/reduced motion sistem perlu QC manual.

Screenshot footer-fullscreen-desktop.png, footer-overlap-mid.png, footer-overlap-complete.png, footer-mobile-bottom.png. Prototipe overlap ini menggantikan curtain/parallax100px sebelumnya; menunggu QC penutup landing.
