import { useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router';
import { Button, LinkButton } from '../components/ui/Button';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useFoundationPalette } from '../queries/foundation';
import type { SampleScenario } from '../services/types';
import '../styles/pages/_foundation.scss';

export function FoundationPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('scenario');
  const scenario: SampleScenario = raw === 'error' || raw === 'empty' ? raw : 'success';
  const palette = useFoundationPalette(scenario);
  const [clicks, setClicks] = useState(0);
  return <div className="foundation">
    <title>QC fondasi React — Kindsight</title>
    <header className="foundation__header">
      <p className="foundation__eyebrow">Kindsight / QC fondasi React</p>
      <h1 className="foundation__title">Font, warna, dan komponen dasar.</h1>
      <p className="foundation__description">Style yang sama dengan acuan Pug, dirender melalui React. Sampel ini tidak menjalankan fungsi bisnis.</p>
    </header>
    <section id="typography" className="foundation__group" aria-labelledby="type-title" tabIndex={-1}>
      <h2 id="type-title" className="foundation__heading">Typography</h2>
      <p className="foundation__type foundation__type--regular">Inter Tight Regular · 400</p>
      <p className="foundation__type foundation__type--medium">Inter Tight Medium · 500</p>
      <p className="foundation__type foundation__type--semibold">Inter Tight SemiBold · 600</p>
      <p className="foundation__caption">Angka dan tanda baca: $18,425.98 · 54% · 3,000+ · Aa Bb Cc</p>
    </section>
    <section className="foundation__group" aria-labelledby="color-title">
      <h2 id="color-title" className="foundation__heading">Warna &amp; service async</h2>
      <label className="spa-field">Skenario data contoh
        <select value={scenario} onChange={event => {
          const next = new URLSearchParams(params);
          if (event.target.value === 'success') next.delete('scenario'); else next.set('scenario', event.target.value);
          setParams(next);
        }}>
          <option value="success">Data tersedia</option><option value="empty">Data kosong</option><option value="error">Service gagal</option>
        </select>
      </label>
      {palette.isPending && <StatusMessage kind="loading">Memuat warna…</StatusMessage>}
      {palette.isError && <StatusMessage kind="error" action={<Button variant="outline" size="sm" onClick={() => void palette.refetch()}>Coba lagi</Button>}>{palette.error.message}</StatusMessage>}
      {palette.isSuccess && (palette.data.length ? <>
        <ul className="foundation__swatches" aria-label="Design tokens">
          {palette.data.map(item => <li key={item.token} className="foundation__swatch">
            <span className="foundation__color" style={{ '--swatch-color': `var(--color-${item.token})` } as CSSProperties} aria-hidden="true" />
            <strong className="foundation__swatch-name">{item.name}</strong><span className="foundation__caption">{item.hex}</span>
          </li>)}
        </ul>
        <StatusMessage kind="success">Enam warna contoh berhasil dimuat melalui TanStack Query.</StatusMessage>
      </> : <StatusMessage kind="empty">Belum ada warna pada skenario ini. Pilih Data tersedia untuk kembali.</StatusMessage>)}
    </section>
    <section className="foundation__group" aria-labelledby="button-title">
      <h2 id="button-title" className="foundation__heading">Button &amp; state UI lokal</h2>
      <div className="foundation__buttons">
        <Button onClick={() => setClicks(value => value + 1)}>Primary</Button>
        <Button variant="dark" onClick={() => setClicks(value => value + 1)}>Dark</Button>
        <Button variant="light" onClick={() => setClicks(value => value + 1)}>Light</Button>
        <Button variant="outline" onClick={() => setClicks(value => value + 1)}>Outline</Button>
        <Button size="sm" onClick={() => setClicks(value => value + 1)}>Small</Button>
        <Button disabled>Disabled</Button>
        <LinkButton to="/foundation#typography" variant="outline">Tautan typography</LinkButton>
      </div>
      <p className="foundation__caption" role="status">Tombol sampel ditekan {clicks} kali. Penghitung memakai React state dan kembali ke nol setelah meninggalkan halaman.</p>
    </section>
    <section className="foundation__group" aria-labelledby="states-title">
      <h2 id="states-title" className="foundation__heading">Contoh loading, empty, error, success</h2>
      <StatusMessage kind="loading">Contoh tampilan: data sedang dimuat.</StatusMessage>
      <StatusMessage kind="empty">Contoh tampilan: belum ada data.</StatusMessage>
      <StatusMessage kind="error">Contoh tampilan: terjadi kesalahan.</StatusMessage>
      <StatusMessage kind="success">Contoh tampilan: perubahan berhasil.</StatusMessage>
    </section>
    <LinkButton to="/" variant="outline">Kembali ke landing page</LinkButton>
  </div>;
}
