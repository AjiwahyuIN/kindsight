# Kindsight — React SPA + API lokal

React + Vite + TypeScript, React Router, TanStack Query, SCSS BEM/CSS variables dan Chart.js. Express memakai entry/router baru TypeScript dengan modul legacy yang dipertahankan, MySQL lokal melalui mysql2. Tidak menggunakan Redux, SSR, PWA atau ORM.

Arah produk: software fundraising untuk organisasi. Rencana pemisahan publik/portal/admin dan statusnya: [Flow dan hak akses](docs/product-flow-access-plan.md). Fondasi role/organisasi telah diterapkan; portal organisasi /app/* sudah tersedia; pengalaman admin lengkap masih bertahap. [Status implementasi dan akun QC](docs/role-organization-foundation.md).

## Menjalankan

Gunakan konfigurasi `.env` lokal. MySQL harus aktif.

```sh
npm ci
npm run db:migrate
npm run db:check
npm run dev:api
# Di terminal kedua
npm run dev
```

Buka http://127.0.0.1:5176. Login organisasi `/login` menuju dashboard; login admin internal `/admin/login` menuju overview. Akun yang masuk lewat pintu yang salah mendapat penjelasan dan link workspace sesuai role. Kredensial akun organisasi lokal ada di `.organization-credentials.local`; provisioning tanpa reset melalui `npm run organization:create-user`. Service React aktif memakai REST dan MySQL; akun fixture `admin@example.test` serta data IndexedDB tidak dipakai sebagai autentikasi/data server.

Route: `/`, `/login`, `/admin/login`, `/admin/overview`, `/admin/demo-requests`, `/admin/organizations`, `/admin/users`, `/app/dashboard`, `/app/donors`, `/app/campaigns`, `/app/donations`, `/admin/content/:section`, `/foundation` (utilitas terpisah), serta 404. Landing mencakup seluruh section yang diterima. Editor mendukung Navbar–Footer dan upload logo Partners. Filter/pencarian/pagination berada di URL; navigasi internal memakai SPA.

Instalasi database kosong, kontrak API, penanganan akun, preservasi data, dan cakupan TypeScript bertahap: [Integrasi React/API/MySQL](docs/react-api-database.md). Jangan menjalankan reseed/reset untuk memulihkan data browser. Permintaan demo React tersimpan ke MySQL dan dapat direview di `/admin/demo-requests`; newsletter masih preview, flow donate/payment ditunda. Email/jadwal/akun tidak dibuat otomatis.

## Verifikasi dan preview

```sh
npm run build
npm run test:api
npm run test:frontend
npm run test:integration
npm run test:organizations
npm run test:organization-management
npm run test:users
npm run test:admin
npm run test:demo
npm run test:db
npm run test:auth
npm run test:crud
npm run test:dashboard
npm run test:content
npm run test:uploads
npm run preview
```

Build memeriksa TypeScript frontend/API dan menghasilkan `dist/`. Preview port 5180 memerlukan API 3101. Test integrasi menggunakan fixture sementara dan membersihkannya. `content:contract` meregenerasi kontrak copy CMS setelah perubahan schema desain yang disetujui.

## Struktur

```text
src/app, layouts, pages/  # Router, QueryClient, halaman React
src/components/          # UI reusable, landing, dashboard, admin
src/services/            # Kontrak TypeScript dan adapter REST; mock terisolasi
src/queries/             # Query key/mutasi/invalidation per domain
src/data/                # Acuan desain dan fixture pengujian
src/assets, styles/      # Aset dan SCSS yang sudah diterima
server/index.ts          # Entry API aktif
server/react/            # CMS React TypeScript, kompatibel konten lama
server/routes, repositories, services/ # Modul backend legacy yang dipakai ulang
server/db/               # Migrasi/seed/provisioning eksplisit
shared/                  # Kontrak CMS React dan kompatibilitas Pug
```

Pengelolaan organisasi/API/QC: [Organisasi](docs/organization-management.md). Kelola akun: [Users dan password awal](docs/user-management.md). Reset password/undangan belum tersedia.

Flow demo/API/QC: [Permintaan demo](docs/demo-requests.md).

Admin internal/definisi angka/QC: [Admin internal](docs/internal-admin.md).

Portal/alias/menu dan QC terbaru: [Portal organisasi](docs/organization-portal.md). URL `/dashboard` serta `/admin/{donors,campaigns,donations}` lama tetap redirect beserta filter.

## Referensi Pug

`npm run dev:legacy` (5175), `build:legacy` (`dist-legacy/`), `preview:legacy` (5181). Jangan hapus modul/aset/shared yang masih diimpor backend. Arsip sebelum migrasi berada di `migration-baselines.local/pug-before-react-2026-10-20.tar.gz`, diabaikan Git, tanpa database atau kredensial.

Aturan aktif: [AGENTS.md](AGENTS.md). [Status migrasi](docs/react-spa-migration.md), [SPA deployment](docs/spa-deployment.md), [Acuan visual Pug](docs/pug-reference.md).

Tampilan dropdown admin/portal aktif: [komponen bersama dan QC](docs/custom-dropdowns.md). Fitur password lanjutan ditunda atas instruksi pengguna; pekerjaan berikut mengikuti fokus tampilan.
