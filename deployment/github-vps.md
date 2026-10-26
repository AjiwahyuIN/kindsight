# GitHub → VPS dan domain Kindsight

## Status aktif — 26 Oktober 2026

Website memakai https://kindsight.owwteam.dev, root frontend /www/wwwroot/kindsight/dist dan proxy API loopback3101. DNS subdomain dan HTTPS sudah diterapkan. Domain utama/email tidak diubah; wildcard owwteam.dev masih pekerjaan berikutnya.

## Alur update otomatis

1. Kerja lokal, QC, lalu push kode yang disetujui ke main di AjiwahyuIN/kindsight.
2. Workflow vps-package.yml menjalankan npm ci,24 tes frontend,13 unit API,5 tes deployment, build TypeScript/Vite, ZIP/checksum dan audit runtime yang memblokir high. PR hanya tes/build; artifact disimpan14 hari.
3. Push main atau workflow manual main menjalankan deploy pada environment production yang dibatasi branch main; repository variable VPS_DEPLOY_ENABLED=true adalah sakelar. Secrets VPS_HOST/VPS_SSH_KEY/VPS_KNOWN_HOSTS tersimpan di environment, bukan repo.
4. SSH kindsight_deploy restricted hanya dapat memanggil satu root helper tanpa argumen. Paket diverifikasi, npm ci memakai cache release tersendiri, preflight API dilakukan sebelum pergantian kode dan restart khusus kindsight_api. Tidak memakai restart global aaPanel/PM2/Nginx.
5. Readiness lokal/publik dan kecocokan HTML diperiksa. Kegagalan aktivasi normal memulihkan kode sebelumnya. Deploy berurutan tanpa cancellation otomatis.

[Workflow live berhasil](https://github.com/AjiwahyuIN/kindsight/actions/runs/40294639507) memasang d07417d. Push main sudah teramati memicu workflow; percobaan sebelum perbaikan cache berhenti aman dan percobaan lockfile berhasil rollback. Detail konfigurasi, batas dan histori: [automatic-deploy.md](automatic-deploy.md).

Folder VPS merupakan instalasi artifact, bukan checkout Git. Tidak perlu git pull atau build frontend berat di VPS.

## Data dan batas operasi

.env dan upload dipertahankan. Deploy tidak menjalankan migrasi/seed/reset database. Perubahan migrasi ditolak untuk rollout terpisah. Root app tetap direktori biasa agar deteksi cwd aaPanel benar; jangan menggantinya dengan symlink release.

Restart API singkat, bukan zero downtime. Backup/staging/cache belum dipangkas otomatis; pantau disk. Interupsi paksa saat aktivasi memerlukan recovery journal manual. Helper root tidak diperbarui oleh push GitHub: perubahan helper memerlukan review/checksum dan pemasangan root. Runtime www masih berbagi user dengan aplikasi lama. Tidak mengklaim seluruh produk siap production.
