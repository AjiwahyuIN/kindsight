# GitHub → VPS dan domain Kindsight

## Pilihan domain yang disarankan

`https://kindsight.owwteam.dev` menggunakan root aplikasi `/` yang sudah dipakai React Router dan `/api`. `https://owwteam.dev/kindsight` juga mungkin, tetapi perlu audit base Vite, basename router, absolute path aset/API, redirect dan scope cookie; bukan sekadar membuat folder. Tidak mengubah base/route aplikasi dalam tugas ini.

DNS yang diperlukan setelah memastikan record host belum dipakai: A record host `kindsight`, target157.245.194.228. Pemeriksaan DNS26 Oktober2026 mengembalikan dns1.namecheaphosting.com dan dns2.namecheaphosting.com. Jadi kelola record di DNS hosting/cPanel (Zone Editor), bukan mengasumsikan Host Records Advanced DNS registrar tersedia. Jangan mengganti nameserver seluruh domain untuk satu subdomain. Jangan mengubah record @/www/MX website/email utama. aaPanel memerlukan vhost subdomain, root dist, proxy khusus API dan sertifikat HTTPS. APP_ORIGINS menggunakan origin subdomain final. Belum ada perubahan DNS/vhost/sertifikat dalam tugas ini.

## Alur update

1. Kerja lokal, QC, lalu push kode yang disetujui ke main di AjiwahyuIN/kindsight.
2. `.github/workflows/vps-package.yml` menjalankan clean install,24 tes frontend,13 unit API, build TypeScript/Vite, packaging dan checksum di runner Ubuntu dengan Node22.22.2. Tidak memerlukan MySQL atau rahasia VPS. PR juga diperiksa; workflow dapat dijalankan manual.
3. Artifact ZIP+SHA disimpan14 hari dengan nama yang menyertakan commit. Audit dependency bersifat informasional selama fase persiapan, bukan security gate siap produksi; known high harus ditangani sebelum publik.
4. Saat ini artifact belum otomatis dikirim/dipasang ke VPS. Tidak ada SSH key, host-key trust, secret, remote command atau migrasi otomatis yang ditambahkan. Unduh artifact dan upload melalui panel tetap merupakan jalur sementara.
5. Target selanjutnya: deployment lewat GitHub Environment production dengan trigger manual/persetujuan, SSH deploy user khusus, verified host key, staging release, checksum/health/ready sebelum pergantian versi, backup dan rollback. Perlu memastikan izin panel/user/process manager agar tidak menyentuh aplikasi lain. Setelah satu deployment teruji baru pertimbangkan deploy otomatis sesudah push main.

Folder hasil ekstraksi yang sudah ada tetap berguna untuk deployment pertama. Jangan melakukan `git pull` di atas folder ZIP yang belum merupakan checkout Git. Git menjadi sumber kode, sedangkan artifact hasil CI menjadi bahan rilis; tidak perlu checkout Git dan build frontend berat di VPS.

## Data yang tetap tinggal di VPS

`.env`, database, session dan `server/storage/partner-logos/` tidak ikut diganti oleh update kode. Sebelum menggunakan release directories/current symlink, jalur env/upload harus dipetakan sebagai shared persistent data; backend saat ini memakai path relatif lokasi file. Jangan melakukan switch symlink tanpa menyiapkan jalur dan restart prosesnya. Jangan memakai rsync --delete pada root aplikasi/data. Migrasi database tetap tindakan terpisah yang ditinjau dan dicadangkan, bukan setiap push.

## Status saat disiapkan

Repo default branch main dan GitHub Actions enabled telah diperiksa. SSH VPS belum berhasil digunakan; pilihan domain masih berupa rekomendasi. DNS, credentials, MySQL dan aplikasi aktif VPS tidak diubah. Workflow tidak mengklaim sudah tersambung/deploy ke VPS sebelum akses dan deployment nyata diuji.
