import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import markSource from '../../assets/brand/kindsight-mark.svg?raw';
import '../../styles/components/_orange-aperture.scss';

function shouldPlay() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
const markPath = markSource.match(/<path[^>]*\sd="([^"]+)"/)?.[1] ?? '';
const logoUnit = 64 / 31.3044;
const logoTransform = (scale: number) => `translate(${innerWidth / 2} ${innerHeight / 2}) scale(${logoUnit * scale}) translate(-16 -13.47825)`;

type Props = { ready: boolean; failed: boolean };
export function OrangeAperture({ ready, failed }: Props) {
  const [active, setActive] = useState(shouldPlay);
  const overlay = useRef<HTMLDivElement>(null);
  const finish = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    if (!active) return;
    document.documentElement.classList.add('has-landing-intro');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => document.documentElement.classList.remove('has-landing-intro');
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    let cancelled = false;
    let completed = false;
    let sequence: gsap.core.Timeline | undefined;
    let fastFinish: gsap.core.Tween | undefined;
    let context: gsap.Context | undefined;
    let fontTimeout: ReturnType<typeof setTimeout> | undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const complete = () => {
      if (cancelled || completed) return;
      completed = true;
      setActive(false);
      window.dispatchEvent(new Event('kindsight:intro-complete'));
    };
    const skip = (immediate = false) => {
      if (immediate || !sequence) { complete(); return; }
      if (!fastFinish) fastFinish = gsap.to(sequence, { totalProgress: 1, duration: 0.45, ease: 'power2.out', onComplete: complete });
    };
    finish.current = () => skip();
    const preventScroll = (event: Event) => event.preventDefault();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { skip(true); return; }
      if (event.key === 'Tab') {
        event.preventDefault();
        overlay.current?.querySelector<HTMLButtonElement>('.orange-intro__skip')?.focus({ preventScroll: true });
      } else if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        if (event.key !== ' ' || event.target !== overlay.current?.querySelector('.orange-intro__skip')) event.preventDefault();
      }
    };
    const preference = () => { if (motion.matches) skip(true); };
    const hash = () => skip(true);
    const resize = () => skip(true);
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('hashchange', hash);
    window.addEventListener('resize', resize);
    motion.addEventListener('change', preference);
    // A slow/failed request must never leave an opaque screen over the site.
    const safety = setTimeout(complete, ready ? 10000 : 5000);
    if (failed || motion.matches) complete();
    else if (ready && overlay.current) {
      const hero = document.getElementById('hero');
      const header = document.querySelector('.site-header');
      const symbol = overlay.current.querySelector('.orange-intro__symbol');
      const veil = overlay.current.querySelector('.orange-intro__veil');
      const pieces = hero?.querySelectorAll('.hero__title-piece');
      const details = hero?.querySelectorAll('.hero__social-proof, .hero__description, .hero__actions');
      const preview = hero?.querySelector('.hero__preview');
      const highlight = hero?.querySelector('.hero__highlight');
      const compact = window.matchMedia('(max-width: 47.999rem)').matches;
      // The opening is the transparent negative space of the ORIGINAL logo.
      // Its star spans ~13.45 SVG units; its safe interior radius is ~2.4 units.
      const unit = logoUnit;
      // Overscan the slanted logo edges, especially the lower-right corner.
      const closeUp = Math.max(innerHeight * 1.04 / (13.45 * unit), innerWidth * 1.16 / 64) * 1.18;
      const throughStar = Math.hypot(innerWidth, innerHeight) / (2.4 * unit) * 1.3;
      context = gsap.context(() => {
        gsap.set(symbol, { opacity: 0.35, attr: { transform: logoTransform(1) } });
        if (header) gsap.set(header, { opacity: 0, y: -12 });
        if (pieces?.length) gsap.set(pieces, { opacity: 0, y: 28, clipPath: 'inset(100% 0 -10% 0)' });
        if (details?.length) gsap.set(details, { opacity: 0, y: 18 });
        if (highlight) gsap.set(highlight, { color: 'var(--color-surface)' });
        if (preview) gsap.set(preview, { opacity: 0, y: compact ? 36 : 80, rotationX: compact ? 0 : 7, scale: compact ? 0.98 : 0.96, transformPerspective: 1200, transformOrigin: '50% 0%' });
        sequence = gsap.timeline({ paused: true, defaults: { ease: 'power3.inOut' }, onComplete: complete });
        sequence.to(symbol, { opacity: 1, duration: 0.7 }, 0.1)
          .to(symbol, { attr: { transform: logoTransform(closeUp) }, duration: 2.2, ease: 'power3.inOut' }, 1.2)
          // Let the enlarged star read before white becomes a window into Hero.
          .to(veil, { opacity: 0, duration: 1.25, ease: 'power2.inOut' }, 3.85)
          .to(symbol, { attr: { transform: logoTransform(throughStar) }, duration: 2.65, ease: 'power2.inOut' }, 4.45);
        if (header) sequence.to(header, { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out' }, 3.95);
        if (pieces?.length) sequence.to(pieces, { opacity: 1, y: 0, clipPath: 'inset(-10% 0 -10% 0)', duration: 1.65, stagger: 0.22, ease: 'power3.out' }, 4.05);
        if (highlight) sequence.to(highlight, { color: 'var(--color-accent)', duration: 1.35, ease: 'power2.out' }, 4.35);
        if (details?.length) sequence.to(details, { opacity: 1, y: 0, duration: 1.4, stagger: 0.24, ease: 'power3.out' }, 4.4);
        if (preview) sequence.to(preview, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 1.8, ease: 'power3.out' }, 4.95);
      });
      // Start with ready text metrics and hero imagery, but never wait indefinitely.
      const images = [...(hero?.querySelectorAll<HTMLImageElement>('img:not([loading="lazy"])') ?? [])];
      void Promise.race([
        Promise.allSettled([document.fonts.ready, ...images.map(image => image.decode())]),
        new Promise(resolve => { fontTimeout = setTimeout(resolve, 800); }),
      ]).then(() => {
        if (!cancelled) {
          // Reload restoration can run after the route's initial scroll effect.
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          sequence?.play();
        }
      });
    }
    return () => {
      cancelled = true;
      clearTimeout(safety);
      clearTimeout(fontTimeout);
      fastFinish?.kill();
      context?.revert();
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', preference);
      finish.current = () => {};
      ScrollTrigger.refresh();
    };
  }, [active, ready, failed]);

  if (!active) return null;
  return <div className="orange-intro" ref={overlay}>
    <div className="orange-intro__veil" aria-hidden="true" />
    <svg className="orange-intro__vector" aria-hidden="true" width="100%" height="100%">
      <g className="orange-intro__symbol" transform={logoTransform(1)}><path d={markPath} fill="var(--color-brand)" /></g>
    </svg>
    <button type="button" className="orange-intro__skip" onClick={() => finish.current()}>Skip intro <span aria-hidden="true">↗</span></button>
  </div>;
}
