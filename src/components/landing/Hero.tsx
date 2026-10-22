import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { StatusMessage } from '../ui/StatusMessage';
import { useHero } from '../../queries/hero';
import type { HeroContent } from '../../services/hero-types';
import type { SampleScenario } from '../../services/types';
import { supporters } from './hero-assets';
import { DashboardPreview } from './DashboardPreview';
import { OrangeAperture } from './OrangeAperture';
import caret from '../../assets/icons/hero/cta-caret.svg';
import '../../styles/components/_hero.scss';

type Props = { onRequestDemo: (trigger: HTMLElement) => void };
export function Hero({ onRequestDemo }: Props) {
  const [params] = useSearchParams();
  const raw = params.get('heroState');
  const scenario: SampleScenario = raw === 'error' || raw === 'empty' ? raw : 'success';
  const hero = useHero(scenario);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<HeroContent['overview']>([]);
  const trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null), next = useRef<HTMLButtonElement>(null);
  const availableSteps = hero.data?.overview ?? [];
  const current = steps[index];
  return <>
    <OrangeAperture ready={Boolean(hero.data)} failed={hero.isError || (hero.isSuccess && !hero.data)} />
    <section id="hero" className="hero" aria-label="Kindsight introduction" aria-labelledby={hero.data ? 'hero-title' : undefined} lang="en">
      <div className="hero__background" aria-hidden="true" />
      <div className="hero__content container">
        {hero.isPending && <StatusMessage kind="loading">Loading Hero content…</StatusMessage>}
        {hero.isError && <StatusMessage kind="error" action={<Button size="sm" variant="outline" onClick={() => void hero.refetch()}>Retry Hero</Button>}>{hero.error.message}</StatusMessage>}
        {hero.isSuccess && !hero.data && <StatusMessage kind="empty">No Hero content is available in this sample scenario.</StatusMessage>}
        {hero.data && <>
          <div className="hero__social-proof"><div className="hero__avatars" aria-hidden="true">{supporters.map(src => <img key={src} className="hero__avatar" src={src} alt="" width={16} height={16} />)}</div><span>{hero.data.socialProof}</span></div>
          <h1 id="hero-title" className="hero__title" aria-label={[hero.data.heading, hero.data.connector, hero.data.highlight].filter(Boolean).join(' ')}><span className="hero__title-piece">{hero.data.heading}</span><br className="hero__title-break" />{' '}<span className="hero__title-piece">{hero.data.connector}{' '}<span className="hero__highlight">{hero.data.highlight}</span></span></h1>
          <p className="hero__description">{hero.data.description}</p>
          <div className="hero__actions">
            <Button variant="dark" className="hero__cta" aria-haspopup="dialog" endIcon={<img src={caret} alt="" aria-hidden="true" />} onClick={event => onRequestDemo(event.currentTarget)}>{hero.data.demoLabel}</Button>
            <Button variant="light" className="hero__cta" aria-haspopup="dialog" ref={trigger} disabled={!availableSteps.length} onClick={() => { setSteps(availableSteps); setIndex(0); setOverviewOpen(true); }}>{hero.data.overviewLabel}</Button>
          </div>
        </>}
      </div>
      <figure className="hero__preview" role="img" aria-label="Illustrative Kindsight dashboard showing fundraising progress, major gifts, AI insights, and top prospects. Example data, not live reports."><div className="hero__preview-viewport"><DashboardPreview /></div></figure>
    </section>
    <Dialog className="hero__overview" lang="en" open={overviewOpen} onClose={() => setOverviewOpen(false)} initialFocus={close} returnFocus={trigger} aria-labelledby="react-hero-overview-title" aria-describedby="react-hero-overview-note">
      <div className="hero__overview-header"><p className="hero__overview-eyebrow">Kindsight / Overview</p><Button variant="light" size="sm" ref={close} onClick={() => setOverviewOpen(false)}>Close</Button></div>
      <p id="react-hero-overview-note" className="hero__overview-note">Video is not available in this preview. Explore a quick introduction below.</p>
      <p className="hero__overview-count" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</p>
      <div className="hero__overview-slide" aria-live="polite" aria-atomic="true"><h2 id="react-hero-overview-title" className="hero__overview-title">{current?.title}</h2><p className="hero__overview-description">{current?.description}</p></div>
      <div className="hero__overview-controls"><Button variant="outline" size="sm" disabled={index === 0} onClick={() => { setIndex(value => Math.max(0, value - 1)); if (index === 1) next.current?.focus(); }}>Previous</Button>
        <Button variant="dark" size="sm" ref={next} onClick={() => { if (index === steps.length - 1) setOverviewOpen(false); else setIndex(value => Math.min(steps.length - 1, value + 1)); }}>{index === steps.length - 1 ? 'Done' : 'Next'}</Button>
      </div>
    </Dialog>
  </>;
}
