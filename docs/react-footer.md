# Footer React — diterima pengguna

Navbar React diterima pengguna. Urutan berikut diubah atas instruksi pengguna:
**Footer dahulu, baru Hero**. Tugas ini hanya memigrasikan Footer.
Buka http://127.0.0.1:5176/#footer. Backend/API/MySQL tidak diintegrasikan.

## Desain dan reuse

Struktur panel gelap, ornamen, brand, newsletter, tiga grup tautan, legal,
copyright dan wordmark dekoratif mengikuti Pug yang sudah tersedia. Menggunakan
src/styles/components/_landing-end.scss, token/font dan empat SVG Footer asli
tanpa mengubah path/aset. Tahun 2025 tetap copy desain, bukan aturan bisnis baru.

Desktop mempertahankan tiga grup di samping newsletter. Mobile memakai adaptasi
sebelumnya: newsletter ditumpuk, navigasi dua kolom, legal membungkus. Tidak ada
desain mobile baru yang diasumsikan. Footer berada di luar Container agar padding
tepi/panel mengikuti versi Pug. Catatan migrasi di atas Footer merupakan area QC,
bukan section landing baru. Landmark footer dapat menerima fokus anchor tanpa
outline kontainer; tombol/link/input tetap memiliki fokus keyboard terlihat.

## Data dan interaksi

- Fixture React bertipe terpusat di src/data/footer.ts. Kontrak FooterContent,
  FooterLink dan NewsletterPreview terpisah dari DOM. Service async contoh di
  src/services/footer.ts; hooks/query keys berada di src/queries/footer.ts.
- Footer memakai TanStack Query, termasuk loading/empty/error/retry. Query key
  memuat skenario. Kontrol QC di bawah Navbar memakai ?footerState=empty/error;
  default success dihilangkan dari URL. Skenario bertahan setelah refresh.
- Newsletter menggunakan useMutation untuk preview async. Email wajib/valid
  memakai validasi native dan service; pending menonaktifkan submit, error
  mempertahankan draft, sukses mereset input dan menyatakan tidak ada subscription.
  ?newsletterState=error mensimulasikan kegagalan; gunakan Berhasil lalu submit
  ulang untuk menguji pemulihan. Tidak ada email yang dikirim/disimpan ke backend,
  database atau penyimpanan browser. Hanya state form React selama halaman aktif.
- Tidak ada invalidasi laporan pada preview newsletter karena tidak membuat data.
  Mutasi newsletter nyata beserta invalidasi daftar admin baru ditambahkan saat
  backend diintegrasikan, dengan kontrak service yang sama.
- Link internal menggunakan React Router; link eksternal http(s) memakai anchor.
  Tujuan kosong membuka dialog preview seperti Pug. Legal juga tetap preview,
  tidak diasumsikan sebagai dokumen kebijakan final.
- Anchor About/Solutions/iWave/Ascend dipertahankan. Selama elemen tujuan belum
  dimigrasikan, klik biasa membuka preview dengan keterangan section belum ada.
  Setelah section tujuan tersedia, Link akan mengikuti anchor tersebut. Tidak
  membuat section placeholder atau route bisnis baru.
- Brand Footer menuju home dan menggulir ke atas meskipun sudah di route yang
  sama. Tombol QC Lihat Footer menggulir/fokus ke footer, termasuk jika hash sama.
- Dialog memakai komponen Dialog React dari Navbar: Close/Escape/backdrop dan
  pengembalian fokus ke pemicu. Tidak memasang controller DOM Pug di React.

## Verifikasi

- npm run build lulus (strict TypeScript + Vite). Tidak ada dependency baru,
  perubahan Pug/backend/schema/seed/SCSS legacy, atau pengujian database.
- Browser desktop 1440 dan mobile 320 tanpa overflow horizontal. SVG termuat;
  mobile memiliki dua kolom navigasi, input/tombol tetap terjangkau dengan Tab.
- Newsletter kosong/salah, sukses/reset, kegagalan dan pemulihan diperiksa.
  Dialog legal, About yang belum dimigrasikan, Close/native Escape dan
  pengembalian fokus ke Privacy Policy diperiksa pada desktop/mobile.
- Brand home dan Lihat Footer bekerja dengan hash SPA; validitas native form
  menunjukkan draft tetap ada setelah navigasi tersebut, bukan reload dokumen.
- Empty/error/retry konten, pemulihan, dan refresh ?footerState=empty diperiksa.
- Screenshot: docs/screenshots/react-footer-desktop.jpg dan react-footer-mobile.jpg.
- Review React: query/mutation terpisah dari state UI, tanpa hook kondisional,
  props/hasil service bertipe, Link untuk internal, aset import statis, serta
  reuse Dialog dengan cleanup effect. Tidak menambah listener global baru.

QC: panel/ornamen/wordmark dan jarak, kolom desktop/mobile, form newsletter,
tautan legal/preview dan fokus keyboard. Tunggu QC sebelum Hero.

Production preview juga diperiksa: seluruh SVG Footer termuat, panel memakai
rgb(42,42,42), dan newsletter menampilkan hasil preview lokal yang sama. Console
desktop tidak melaporkan error/warning. Preview server pengujian dihentikan;
dev server React port 5176 tetap berjalan untuk QC.

Footer telah lolos QC pengguna. Migrasi Hero dilanjutkan pada tugas berikutnya.
