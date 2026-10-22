# Dropdown custom — fokus tampilan admin/portal

Pengguna menunda ganti/reset password, undangan email dan kesiapan production untuk berfokus pada tampilan. Perubahan ini mengganti seluruh select yang terlihat pada area produk admin dan portal organisasi React.

## Cakupan

Komponen `src/components/ui/Select.tsx` dan SCSS BEM `_select.scss` dipakai di 16 lokasi deklarasi: filter/status/pagination Users, Organizations, Demo requests, fundraising, form status/referensi donor/campaign, pilihan organisasi akun, pilihan logo CMS, interval grafik dan campaign dashboard. Pilihan CMS/CRUD dinamis memakai komponen yang sama. Utilitas terpisah `/foundation` dan Pug arsip tetap acuan lama.

Tampilan memakai font, warna, radius, spacing dan motion token yang tersedia: panel putih, bayangan lembut, fokus/centang oranye, caret berputar, transisi buka/hover. Adaptasi dashboard mengikuti kontrol ringkas pada kartu. Ini usulan tampilan komponen bersama berdasarkan token aktif, bukan hasil pembacaan node dropdown Figma baru.

## Interaksi dan kontrak

- Combobox/listbox dengan selected/disabled, active descendant dan label/error yang terkait. Panah/Home/End, Enter/Space, typeahead, Tab dan Escape; pilihan disabled dilewati. Klik luar menutup menu. Escape pertama menutup dropdown, bukan dialog induk.
- Panel menggunakan top-layer popover di DOM yang sama sehingga dapat tampil di atas dialog dan kontainer overflow. Posisi/lebar/tinggi dijepit ke viewport, membuka ke atas bila ruang bawah kurang; daftar panjang dapat discroll. Reduced motion mematikan animasi.
- Komponen memakai React state untuk tampilan dan `onValueChange` untuk pilihan. Select native tersembunyi hanya membawa name/value/required ke form; tidak menjadi kontrol OS yang terlihat. Nilai form, validasi, draft, filter URL dan service API tetap dipertahankan. Fokus kesalahan CMS/CRUD diarahkan ke trigger custom.
- Listener scroll/resize/pointer, ResizeObserver, timer typeahead dan top-layer dibersihkan saat tutup/unmount. Scroll pilihan aktif hanya menggeser daftar, bukan menggulir halaman.
- Tidak mengubah schema/migrasi, definisi data, endpoint, permission atau fitur password. Tidak menginstal dependency/library UI.

## Verifikasi dan QC

- `npm run build`: TypeScript frontend/API dan Vite lulus. `test:frontend`: 23 pengujian yang ada lulus. Tidak menambah tes statis yang meniru markup komponen.
- Browser admin: status Users dengan Arrow/End/Enter mengubah URL; pagination memilih 25 dan menu menutup; filter organisasi dalam dialog akun dapat dipilih lewat typeahead, native value tersinkron, Escape menutup menu sambil menjaga dialog. Pilihan logo CMS dibuka tanpa menerbitkan perubahan.
- Browser portal: interval Monthly mengubah URL; campaign tampil terbaca pada kartu dan menunya tidak terpotong. Form donasi memilih donor via typeahead; label pilihan custom sesuai native form value. Status dibuka di dialog, Escape/fokus/Close bekerja; draft ditutup tanpa menyimpan.
- Mobile aktual 390×844: tidak overflow horizontal halaman; menu pagination dekat bawah membuka ke atas dan tetap di dalam viewport. Viewport direset dan sesi admin dipulihkan.
- Pemeriksaan menggunakan data yang sudah ada, tanpa membuat/mengubah ledger, konten, organisasi atau akun. Screenshot `custom-select-desktop.png` dan `custom-select-mobile.png` sebagai acuan QC.

QC: filter, pagination, pilihan dalam dialog akun/CRUD, CMS logo, grafik; desktop/mobile dan keyboard. Tunggu QC sebelum perubahan tampilan berikutnya. Penundaan fitur password lanjutan tetap berlaku.
