# Feedback Save and publish

- Setelah API menyimpan section dengan sukses, notifikasi fixed menampilkan nama section dan pesan bahwa perubahan tersedia pada landing. Tetap tampil sampai ditutup, edit baru, reset, reload atau pindah section; tidak ada timeout yang dapat terlewat.
- Tombol menampilkan spinner/Saving and publishing saat request, lalu check/Saved and published setelah konfirmasi. Edit baru atau percobaan berikutnya membersihkan status sukses lama. Error/conflict/draft dan invalidasi query tetap memakai alur sebelumnya; tidak ada success optimistis.
- Notifikasi memakai token/BEM, live region polite, tombol dismiss berlabel dan reduced motion. Dismiss mengembalikan fokus ke tombol publish tanpa scroll paksa. Toast tidak menggeser layout atau mengalihkan fokus otomatis ketika save berhasil.
- Verifikasi lokal: save Navbar tanpa mengubah copy, feedback pending/success, dismiss, edit/reset; desktop1280×800 dan mobile390×844 tanpa overflow. Data copy tetap sama; hanya revisi record lokal yang berubah saat save. Tidak melakukan mutasi CMS live VPS. Error API/reduced motion tidak difault-inject dalam browser pada tugas ini.
- Build TypeScript/Vite dan24 tes frontend lulus. Bukti visual lokal docs/screenshots/cms-publish-feedback.png.
- Push GitHub menguji pipeline build/artifact saja. Auto deploy VPS belum tersambung; jangan mengklaim live menerima revisi ini sebelum paket dipasang dan diperiksa. Env/upload/database VPS tidak berubah.
