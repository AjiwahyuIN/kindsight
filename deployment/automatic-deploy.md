# GitHub → aaPanel: hanya Kindsight

## Batas dan status

**Aktif dan berhasil diuji 26 Oktober 2026.** Root helper revisi lockfile terpasang, environment production dibatasi main, tiga secret SSH tersedia dan fingerprint ED25519 diverifikasi melalui Terminal aaPanel. VPS_DEPLOY_ENABLED=true. Workflow manual [40294639507](https://github.com/AjiwahyuIN/kindsight/actions/runs/40294639507) memasang commit d07417d7bb9d94748cbf3024dce42851d4e073a3 dengan sukses. Setiap push main menjalankan tes/build/audit lalu deploy berurutan. Ini belum merupakan klaim kesiapan production seluruh produk. Bagian uji gagal di bawah merupakan histori yang sudah diperbaiki.

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

## GitHub configuration (sudah dibuat)

Environment production, secrets:
- VPS_HOST:157.245.194.228
- VPS_SSH_KEY: isi private key khusus yang dibuat pengguna, tidak melalui chat/repository/log.
- VPS_KNOWN_HOSTS: host-key server yang fingerprint-nya telah dicocokkan lewat Terminal aaPanel.

Repository variable VPS_DEPLOY_ENABLED mengaktifkan job. Mulai dengan workflow_dispatch dari main pada waktu yang disetujui. Setelah satu update nyata dan penanganan rollback terverifikasi, push main akan menjalankan jalur yang sama. Audit high memblokir job package saat sakelar aktif; saat belum aktif audit tetap informasional.

## Verifikasi sebelum root install

Lima tes deployment (termasuk pemulihan unit saat aktivasi parsial gagal, env/upload dan aplikasi tetangga tetap utuh) menolak path traversal/symlink/credential, file undeclared/hash salah, dan scope PID dari user/folder/project lain. Syntax Bash/Python/YAML diperiksa. Tes ini bukan bukti live activation/rollback; uji VPS menunggu installer root dan secrets.

## Perbaikan cache staging — 26 Oktober 2026

- npm ci sekarang menerima --cache <release>/.npm-cache secara eksplisit. Cache dibuat oleh proses www di release Kindsight; opsi CLI mengalahkan cache global aaPanel tanpa mengubah npmrc atau izin /www/server/nodejs/cache. Tidak melakukan chown global atau upgrade npm.
- Lima tes deployment dan diff check lulus. Body-parser 2.4.0 dan multer 2.5.0 sudah dipush setelah audit memblokir percobaan pertama; audit bersih, build/unit API/upload/CMS MySQL lokal lulus.
- Helper terpasang masih versi lama sampai root mengganti satu file /usr/local/sbin/kindsight-deploy dengan hash terverifikasi. Installer awal tidak dijalankan ulang; konfigurasi, sudoers, startup script, env dan aplikasi lain tidak diubah. Setelah pembaruan, aktifkan kembali variable dan uji workflow.

## Uji cache dan rollback aktivasi — 26 Oktober 2026

- Helper cache baru dipasang root dan workflow 40293813907 lolos package/audit/npm ci/preflight. Aktivasi gagal karena instalasi ZIP awal tidak memiliki package-lock.json. Versi sebelumnya berhasil dipulihkan otomatis (log ROLLED BACK), readiness kembali200, hash respons publik hero/footer tetap diperiksa dan PID aplikasi www lain tidak berubah pada pemeriksaan.
- Perbaikan berikutnya menerima hanya package-lock.json sebagai unit live opsional: lockfile paket baru tetap wajib; rollback mengembalikan kondisi awal tanpa lockfile jika sebelumnya tidak ada. Unit live wajib lain diperiksa sebelum stop. Tes mencakup aktivasi penuh/parsial dan lockfile ada/tidak ada, env/storage/aplikasi tetangga tetap utuh.
- Perbaikan helper kedua masih perlu dipasang root dengan hash terverifikasi. VPS_DEPLOY_ENABLED=false sampai uji ulang; jangan mengklaim deployment versi baru berhasil.

## Verifikasi live berhasil

- Log DEPLOYED d07417d7bb9d94748cbf3024dce42851d4e073a3, activation journal bersih, lockfile baru tersedia. API health/ready200 JSON, database connected/schema ready. SHA256 HTML HTTPS cocok dengan dist/index.html VPS (183a6a393e5b234a652951eabc99258b10dbeb1eb98dff64a51ead6bbb2aa646).
- Route admin/login dan app/dashboard200, API hilang404 JSON, aset hilang404. Hero/Footer hash respons sama sebelum/sesudah. PID seluruh proses www lain tetap sama pada pemeriksaan; hanya Kindsight berganti PID. Tidak menjalankan migrasi/seed/reset.
- Login admin live, Navbar Save and publish tanpa edit copy: toast Navbar published dan tombol Saved and published tampil. Data respons publik Navbar identik sebelum/sesudah; hanya revisi penyimpanan berubah. Sesi verifikasi sudah logout. Screenshot lokal docs/screenshots/cms-publish-feedback-live.png tidak dimasukkan repo publik.
- Rollback aktivasi parsial benar-benar teramati pada percobaan sebelumnya (lockfile awal hilang); pemulihan setelah reboot/kill paksa belum diuji. Cache npm tiap release diisolasi; cache/config bersama tidak diubah.
