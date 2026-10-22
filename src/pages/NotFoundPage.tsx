import { LinkButton } from '../components/ui/Button';
export function NotFoundPage() {
  return <section className="foundation" aria-labelledby="not-found-title">
    <title>404 — Kindsight</title>
    <p className="foundation__eyebrow">404</p>
    <h1 id="not-found-title" className="foundation__title">Halaman tidak ditemukan.</h1>
    <p>Periksa alamat atau kembali ke landing page.</p>
    <div className="foundation__buttons"><LinkButton to="/">Kembali ke awal</LinkButton></div>
  </section>;
}
