import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '../ui/Button';
import { StatusMessage } from '../ui/StatusMessage';
import { usePartners } from '../../queries/partners';
import type { PartnerLogo } from '../../services/partners-types';
import type { SampleScenario } from '../../services/types';
import '../../styles/components/_partners.scss';

gsap.registerPlugin(ScrollTrigger);

function geometry(logo: PartnerLogo): CSSProperties {
  const crop = logo.crop ?? { x: 0, y: 0, width: logo.width, height: logo.height };
  const scale = logo.builtin ? 26 / crop.height : Math.min(26 / crop.height, 120 / crop.width);
  return { '--logo-width': `${crop.width * scale}px`, '--logo-scale': scale, '--logo-x': `${-crop.x}px`, '--logo-y': `${-crop.y}px` } as CSSProperties;
}
function PartnerCarousel({ logos, forceReduced }: { logos: PartnerLogo[]; forceReduced: boolean }) {
  const root = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null), source = useRef<HTMLUListElement>(null);
  const [offscreen, setOffscreen] = useState(true);
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [measure, setMeasure] = useState({ distance: 0, count: 1 });
  const reduced = systemReduced || forceReduced;
  const ready = measure.distance > 0;

  useLayoutEffect(() => {
    if (reduced || !ready) return;
    let frame = 0;
    let context: gsap.Context | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Intro temporarily fixes the body; measure only after it releases it.
        if (document.documentElement.classList.contains('has-landing-intro') || context || !root.current) return;
        context = gsap.context(() => {
          const compact = () => window.matchMedia('(max-width: 47.999rem)').matches;
          const items = root.current!.querySelectorAll('.partners__item');
          gsap.set(items, {
            y: (index: number) => (compact() ? 20 : 28) + (index % logos.length) * 4,
            opacity: 0,
          });
          gsap.to(items, {
            y: 0, opacity: 1, duration: 1.4, ease: 'power2.out',
            // Each loop copy shares its source logo's phase, keeping the seam continuous.
            stagger: (index: number) => (index % logos.length) * 0.09,
            scrollTrigger: {
              trigger: root.current, start: 'top 97%', end: () => compact() ? 'top 73%' : 'top 64%',
              scrub: 1.4, invalidateOnRefresh: true,
            },
          });
          const dashboard = document.querySelector('.hero__preview-viewport');
          const figure = document.querySelector('.hero__preview');
          if (dashboard && figure) gsap.fromTo(dashboard, { y: 0 }, {
            y: () => compact() ? 12 : 28, ease: 'none',
            scrollTrigger: { trigger: figure, start: 'top 45%', end: 'bottom top', scrub: 1.4, invalidateOnRefresh: true },
          });
        });
        ScrollTrigger.refresh();
      });
    };
    setup();
    window.addEventListener('kindsight:intro-complete', setup);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('kindsight:intro-complete', setup);
      context?.revert();
    };
  }, [reduced, ready, logos, measure.count]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setSystemReduced(media.matches);
    changed(); media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useLayoutEffect(() => {
    const view = viewport.current, original = source.current;
    if (!view || !original) return;
    function update() {
      const distance = original!.getBoundingClientRect().width;
      if (!distance) return;
      const count = Math.max(2, Math.ceil(view!.clientWidth / distance) + 1);
      setMeasure(current => current.distance === distance && current.count === count ? current : { distance, count });
    }
    update();
    const resize = new ResizeObserver(update);
    resize.observe(view); resize.observe(original);
    return () => resize.disconnect();
  }, [logos]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <section id="partners" className="partners" aria-label="Partner organizations" lang="en" ref={root}
    data-ready={measure.distance > 0} data-offscreen={offscreen} data-reduced-motion={reduced}
    style={{ '--loop-distance': `${measure.distance}px`, '--loop-duration': `${measure.distance / 28}s` } as CSSProperties}>
    <div className="partners__viewport" ref={viewport} tabIndex={reduced ? 0 : undefined} role={reduced ? 'region' : undefined}
      aria-label={reduced ? 'Partner logos. Scroll horizontally to view all organizations.' : undefined}>
      <div className="partners__track">
        {Array.from({ length: measure.count }, (_, copy) => <ul key={copy} className="partners__set" ref={copy === 0 ? source : undefined}
          aria-label={copy === 0 ? 'Partner logos' : undefined} aria-hidden={copy === 0 ? undefined : true} inert={copy !== 0}>
          {logos.map(logo => <li key={logo.id} className="partners__item"><span className="partners__logo" style={geometry(logo)}>
            <img className="partners__image" src={logo.src} alt={copy === 0 ? logo.name : ''} width={logo.width} height={logo.height} decoding="async" />
          </span></li>)}
        </ul>)}
      </div>
    </div>
  </section>;
}
export function Partners() {
  const [params] = useSearchParams();
  const raw = params.get('partnersState');
  const scenario: SampleScenario = raw === 'empty' || raw === 'error' ? raw : 'success';
  const selection = params.get('partnersCount') === 'single' ? 'single' : 'all';
  const partners = usePartners(scenario, selection);
  if (partners.data?.length) return <PartnerCarousel logos={partners.data} forceReduced={params.get('partnersMotion') === 'reduce'} />;
  return <section id="partners" className="partners" aria-label="Partner organizations" lang="en"><div className="container">
    {partners.isPending && <StatusMessage kind="loading">Loading partner logos…</StatusMessage>}
    {partners.isError && <StatusMessage kind="error" action={<Button variant="outline" size="sm" onClick={() => void partners.refetch()}>Retry partner logos</Button>}>{partners.error.message}</StatusMessage>}
    {partners.isSuccess && <StatusMessage kind="empty">No partner logos are available in this sample scenario.</StatusMessage>}
  </div></section>;
}
