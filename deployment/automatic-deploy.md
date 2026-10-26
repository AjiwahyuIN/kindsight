# GitHub → aaPanel: hanya Kindsight

## Batas dan status

Kode otomasi sudah disiapkan. Belum dipasang sebagai root, belum diberi sudo, belum menyimpan private key di GitHub, dan belum diaktifkan. Tidak ada deployment live/restart saat persiapan ini. GitHub repository variable `VPS_DEPLOY_ENABLED=true` adalah sakelar aktivasi; default tidak ada berarti job deploy dilewati. Jangan mengaktifkan sebelum instalasi, fingerprint, secrets dan uji selesai.

Pemeriksaan VPS menemukan nama aktual **kindsight_api**, bukan kingsight_api. API berjalan via startup script aaPanel, bukan PM2. Fungsi restart_project bawaan juga melakukan chmod/chown pada direktori Node bersama, jadi tidak dipakai. Helper hanya menjalankan `/www/server/nodejs/vhost/scripts/kindsight_api.sh` sebagai www, setelah mencocokkan checksum script dengan saat instalasi. Perubahan script panel memerlukan tinjauan ulang.

## Desain

- Workflow tes/build di GitHub, artifact dari commit bersih; job deploy hanya main/non-PR pada environment production. Deploy berurutan tanpa cancellation otomatis.
- SSH tetap user kindsight_deploy/key restricted; known_hosts terverifikasi, tanpa StrictHostKeyChecking=no. Akun tidak masuk grup www dan tidak mendapat sudo umum. Sudo hanya satu entry point root-owned tanpa argumen `/usr/local/sbin/kindsight-deploy`.
- Upload ke home akun deploy: incoming/package.zip dan package.sha256. Root helper mengambil snapshot regular file milik akun tersebut, memeriksa SHA, namespace ZIP/manifest, ukuran dan semua hash; menolak traversal/symlink/credential/storage/node_modules.
- Staging dan npm ci dijalankan sebagai www dengan Node22.22.2. Tidak ada global npm install, perubahan Node default atau konfigurasi website lain.
- Candidate dites melalui ready pada port loopback sementara. Migrasi database berbeda dari versi live ditolak dan membutuhkan rollout terpisah; tidak ada seed/reset/import/migrasi otomatis.
- Root direktori `/www/wwwroot/kindsight` tetap berupa direktori biasa. Memindahkannya menjadi symlink release dapat membuat deteksi cwd aaPanel salah. Hanya server/shared/src/node_modules/package files/dist diganti setelah API berhenti. .env tetap di tempat, storage server dipindahkan sementara lalu dipasang kembali tanpa mengganti isinya. Database tidak disentuh. Aset berhash lama dipertahankan untuk browser yang masih membuka versi sebelumnya.
- Stop hanya PID milik www, cwd tepat Kindsight, dan tag NODE_PROJECT_NAME=kindsight_api; PID file juga wajib cocok. Tidak ada killall/pkill/npm global restart, PM2 restart all, restart Nginx atau restart aplikasi lain. Identitas starttime diperiksa sebelum signal.
- Restart memakai startup script satu project tersebut sebagai www. Health lokal dan readiness/frontend HTTPS diperiksa; kegagalan aktivasi normal memulihkan unit backup dan memulai versi sebelumnya. Ini restart singkat, bukan zero downtime.
- Jika server mati atau helper terputus paksa saat aktivasi, journal menghentikan deploy berikutnya untuk recovery manual. Backup/staging belum dipangkas otomatis; operator perlu memantau disk dan mengatur retensi. Rollback tidak mengembalikan database karena deploy tidak memutasi database.
- Runtime www masih merupakan user bersama seperti konfigurasi sebelumnya. Pembatasan helper mencegah perintah deploy menarget aplikasi lain; ini bukan klaim isolasi OS penuh antar aplikasi. Pemisahan user runtime adalah pekerjaan terpisah.

## Instalasi sekali di VPS

Review `install-kindsight-deploy.sh` dan `kindsight-deploy.py`. Unduh dari commit immutable yang disepakati dan cocokkan checksum sebelum menjalankan installer sebagai root pada Terminal aaPanel. Installer membuat hanya folder/file Kindsight: /www/kindsight-deploy, incoming, /etc/kindsight-deploy.json, /etc/sudoers.d/kindsight-deploy dan helper /usr/local/sbin/kindsight-deploy. Izin .env diperketat ke www:600. Tidak merestart aplikasi atau mengubah SSH/global config. Installer menolak menimpa konfigurasi deploy yang sudah ada.

Sesudah installer: cek `sudo -n -l` sebagai kindsight_deploy. Root helper tidak dipanggil sampai paket pertama sengaja dikirim. Jangan menjalankan helper root tanpa paket yang valid untuk mencoba restart.

## GitHub configuration (belum dibuat saat persiapan)

Environment production, secrets:
- VPS_HOST:157.245.194.228
- VPS_SSH_KEY: isi private key khusus yang dibuat pengguna, tidak melalui chat/repository/log.
- VPS_KNOWN_HOSTS: host-key server yang fingerprint-nya telah dicocokkan lewat Terminal aaPanel.

Repository variable VPS_DEPLOY_ENABLED mengaktifkan job. Mulai dengan workflow_dispatch dari main pada waktu yang disetujui. Setelah satu update nyata dan penanganan rollback terverifikasi, push main akan menjalankan jalur yang sama. Audit high memblokir job package saat sakelar aktif; saat belum aktif audit tetap informasional.

## Verifikasi sebelum root install

Lima tes deployment (termasuk pemulihan unit saat aktivasi parsial gagal, env/upload dan aplikasi tetangga tetap utuh) menolak path traversal/symlink/credential, file undeclared/hash salah, dan scope PID dari user/folder/project lain. Syntax Bash/Python/YAML diperiksa. Tes ini bukan bukti live activation/rollback; uji VPS menunggu installer root dan secrets.
