# SPA deployment dan API

Frontend menghasilkan `dist/index.html` dan `dist/assets/`. Dev 5176 dan preview 5180 mem-proxy `/api` ke Express 127.0.0.1:3101, dengan cookie same-origin dan Origin asli. API terputus menghasilkan JSON 503; tidak kembali ke fixture atau HTML. Preview hanya untuk QC lokal.

Urutan production: `/api` menuju backend; `/assets` dan file statis yang hilang 404; route halaman mengembalikan index.html; React Router menangani 404 halaman. Contoh Nginx berikut belum dipasang ke hosting:

```nginx
root /path/to/kindsight/dist;
location = /api {
    proxy_pass http://127.0.0.1:3101;
    proxy_set_header Host $host;
}
location ^~ /api/ {
    proxy_pass http://127.0.0.1:3101;
    proxy_set_header Host $host;
}
location ^~ /assets/ { try_files $uri =404; }
location ~* \.(?:js|mjs|css|map|png|jpe?g|webp|svg|ico|woff2?|ttf)$ { try_files $uri =404; }
location / { try_files $uri /index.html; }
```

Production menggunakan HTTPS, NODE_ENV=production (cookie Secure), APP_ORIGINS domain frontend yang tepat. Backend tetap bind lokal di belakang reverse proxy. Jangan gunakan catch-all SPA untuk `/api` atau file upload; file logo dilayani endpoint API terkontrol. `.env`, kredensial admin dan storage upload tidak masuk bundle frontend. Host/deployment belum dipilih atau dipublikasikan.

QC: direct URL + refresh `/dashboard` dan `/admin/content/hero`, alias HTML lama, 404 React, 404 aset hilang, API tak dikenal JSON 404, API offline JSON 503, serta navigasi Link/NavLink tanpa reload dokumen.
