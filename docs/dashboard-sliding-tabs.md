# Sliding indicator navigasi portal organisasi

Tab Dashboard/Donors/Campaigns/Donations pada header persisten memakai satu span dekoratif sebagai background aktif. useSlidingNav mengukur aria-current=page dan mengubah posisi/lebar/tinggi pill dengan transisi500ms cubic-bezier(.22,1,.36,1); teks bertransisi350ms. NavLink/URL, guard role, cache dan API tetap sama. Halaman admin internal/CMS tidak diubah.

Posisi awal dipasang sebelum transisi diaktifkan sehingga refresh tidak memicu sweep dari kiri. Pengukuran menggunakan bounding rect pecahan pixel, ResizeObserver pada nav/link dan font-ready. Pada mobile, scroller horizontal menggeser secukupnya agar tab aktif terlihat utuh tanpa menggeser halaman vertikal. Reduced motion mematikan transisi dan smooth scroll. Cleanup melepas observer/frame dan mengabaikan font promise lama; tidak ada GSAP atau RAF permanen tambahan. Background aktif lama tetap menjadi fallback sebelum pengukuran selesai.

Browser1280×720/390×844: seluruh tujuan route, perpindahan berurutan, Back, Tab/Enter, resize dan refresh /app/donations diperiksa. Mobile Donations awal terpotong oleh scroller lama; sekarang scrollLeft23 membuat tepi kanan tab365.77px berada di dalam scroller kanan370px. Setelah refresh rect pill tepat sama dengan link aktif (width90.59px/height44px). Tidak ada overflow halaman/console error. Login memakai akun QC lokal tanpa mencetak password; tidak ada mutasi ledger.

Build React/API/Vite dan legacy serta23 tes frontend lulus. Reduced motion sistem/gesture touch fisik perlu QC manual. Screenshot dashboard-sliding-tabs.png dan dashboard-sliding-tabs-mobile.png. Menunggu QC sebelum perubahan berikutnya.

## Kelanjutan: admin internal dan CMS

Sliding pill yang sama kini juga dipakai Overview/Demo requests/Organizations/Users/Landing content pada AdminLayout, serta sepuluh tab section Landing editor. CSS admin mendukung perpindahan x/y saat tab membungkus ke beberapa baris. Link, aria-current, role guard dan API tidak diubah.

ContentSectionNavigation dipindahkan ke sibling persisten dari EditorLoader yang tetap keyed per section. Dengan demikian pill tidak di-remount saat route section berubah, sementara draft/form/loading/error tetap di loader masing-masing. Guard UnsavedChanges tetap menentukan route yang benar-benar aktif; pill tidak bergerak saat perpindahan diblokir atau dibatalkan.

Browser1280×720/390×844: seluruh menu admin, CMS Navbar→Hero→About/Back, Tab/Enter dan refresh section diperiksa. Draft Connector sementara (tidak disimpan) memblokir perpindahan ke About; Keep editing menjaga Hero aktif. Draft dikembalikan lewat Reset unsaved changes tanpa Save/publish. Mobile Footer pill dan target sama persis (77.35×42.40px), main Landing content pill146.23×42.40px; tidak ada overflow. Login admin memakai kredensial lokal tanpa mencetak password. Tidak ada perubahan data persisten.

Build React/API/Vite dan legacy serta23 tes frontend lulus. Screenshot admin-sliding-tabs.png dan admin-sliding-tabs-mobile.png. Menunggu QC pengguna.
