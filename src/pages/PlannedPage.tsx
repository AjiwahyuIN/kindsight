import { LinkButton } from '../components/ui/Button';
export function PlannedPage({ name }: { name: string }) {
  return <section className="foundation" aria-labelledby="planned-title">
    <title>{`${name} — Kindsight`}</title>
    <p className="foundation__eyebrow">Tahap migrasi berikutnya</p>
    <h1 id="planned-title" className="foundation__title">{name} belum dimigrasikan.</h1>
    <p>Route ini disiapkan dalam peta SPA. Tampilan dan fungsi halaman akan dikerjakan pada tugas tersendiri setelah QC fondasi.</p>
    <div className="foundation__buttons"><LinkButton to="/foundation">Periksa fondasi</LinkButton></div>
  </section>;
}
