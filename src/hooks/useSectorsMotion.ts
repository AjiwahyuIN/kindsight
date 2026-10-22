import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useSectorsMotion(root: RefObject<HTMLElement | null>, ready: boolean, donation: string, percentage: string) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready) return;
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    let announced = false;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const section = root.current;
          if (!section || media || document.documentElement.classList.contains('has-landing-intro')) return;
          media = gsap.matchMedia();
          media.add({ desktop: '(min-width: 80rem) and (min-height: 42rem)', all: '(min-width: 0px)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
            if (hash === '#footer') return;
            const direct = hash === '#sectors' || hash === '#sectors-title';
            const scene = section.parentElement!;
            const hold = scene.querySelector<HTMLElement>('.sectors-scene__hold')!;
            const cardsHold = scene.querySelector<HTMLElement>('.sectors-scene__cards-hold')!;
            const mission = scene.closest('.missions-scene')?.querySelector<HTMLElement>('.missions');
            const directMission = hash === '#missions' || hash === '#missions-title';
            if (!context.conditions?.reduce && context.conditions?.desktop && directMission && mission) {
              mission.classList.add('missions--story');
              if (mission.offsetHeight <= innerHeight + 2) {
                gsap.set(mission, { position: 'sticky', top: 0 });
                const missionHold = scene.closest('.missions-scene')?.querySelector('.missions-scene__hold');
                if (missionHold) gsap.set(missionHold, { height: '40vh' });
              } else mission.classList.remove('missions--story');
            }
            const emphasis = section.querySelector('.sectors__emphasis');
            const label = section.querySelector<HTMLElement>('.section-label')!;
            const cards = [...section.querySelectorAll<HTMLElement>('.sectors__cards > *')];
            const canvas = section.querySelector('.sectors__cards-canvas');
            const seams = section.querySelector('.sectors__cards-seams');
            const expose = (card: HTMLElement, active: boolean) => {
              const metrics = card.querySelector<HTMLElement>('.sector-morph__metrics');
              metrics?.toggleAttribute('inert', !active);
              metrics?.setAttribute('aria-hidden', String(!active));
            };
            const metricUpdates = new Map(cards.map(card => {
              const amount = card.querySelector<HTMLElement>('.sector-morph__amount-value')!;
              const percent = card.querySelector<HTMLElement>('.sector-morph__percentage-value')!;
              const bar = card.querySelector<HTMLElement>('.sector-feature__bar > span')!;
              const originalAmount = amount.textContent ?? '';
              const originalPercent = percent.textContent ?? '';
              const originalTransform = bar.style.transform;
              // Only the supplied USD/percentage format is animated; arbitrary CMS copy stays intact.
              const usd = originalAmount.match(/^\$(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/);
              const cents = usd ? Number(usd[1].replaceAll(',', '')) * 100 + Number((usd[2] ?? '').padEnd(2, '0')) : NaN;
              const pct = originalPercent.match(/^(\d{1,3}(?:\.\d{1,2})?)%$/);
              const targetPercent = pct ? Number(pct[1]) : NaN;
              const amountFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: usd?.[2]?.length ?? 0, maximumFractionDigits: usd?.[2]?.length ?? 0 });
              const update = (progress: number) => {
                if (usd && Number.isSafeInteger(cents)) amount.textContent = progress === 1 ? originalAmount : `$${amountFormat.format(Math.round(cents * progress) / 100)}`;
                if (pct && targetPercent <= 100) {
                  percent.textContent = progress === 1 ? originalPercent : `${(targetPercent * progress).toFixed(pct[1].split('.')[1]?.length ?? 0)}%`;
                  bar.style.transform = `scaleX(${progress})`;
                }
              };
              const restore = () => { amount.textContent = originalAmount; percent.textContent = originalPercent; bar.style.transform = originalTransform; };
              return [card, { update, restore }] as const;
            }));
            const sync = (card: HTMLElement) => {
              const active = Number(gsap.getProperty(card, '--sector-active'));
              const entry = Number(gsap.getProperty(card, '--sector-metrics-entry'));
              const progress = Math.min(Math.max(0, Math.min(1, (active - 0.6) / 0.4)), Number.isFinite(entry) ? entry : 1);
              metricUpdates.get(card)?.update(1 - Math.pow(1 - progress, 3));
              expose(card, active > 0.98);
            };
            const restore = () => cards.forEach((card, i) => { metricUpdates.get(card)?.restore(); expose(card, i === 0); card.removeAttribute('inert'); });
            if (context.conditions?.reduce) {
              gsap.set(cards, { '--sector-active': 1 });
              cards.forEach(card => expose(card, true));
              return restore;
            }
            if (context.conditions?.desktop) section.classList.add('sectors--story');
            const story = context.conditions?.desktop && section.offsetHeight <= innerHeight + 2;
            if (!story) section.classList.remove('sectors--story');
            const reveal = (timeline: gsap.core.Timeline, at = 0) => {
              timeline.fromTo(label, { width: 28, gap: 0, overflow: 'clip', autoAlpha: 0 }, { width: () => 36 + (label.querySelector('span')?.scrollWidth ?? 0), gap: 8, autoAlpha: 1, duration: 1 }, at)
                .fromTo(label.querySelector('img'), { rotation: 0 }, { rotation: 360, duration: 1.2 }, at)
                .fromTo(label.querySelector('span'), { autoAlpha: 0, x: -5 }, { autoAlpha: 1, x: 0, duration: 0.9 }, at + 0.25)
                .fromTo(section.querySelector('.sectors__title'), { clipPath: 'inset(100% 0 0)', y: 24 }, { clipPath: 'inset(0% 0 0)', y: 0, duration: 1.4 }, at + 0.3)
                .fromTo(section.querySelector('.sectors__description'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.2 }, at + 0.65);
            };
            const enterCard = (timeline: gsap.core.Timeline, card: HTMLElement, at: number, index: number) => {
              card.setAttribute('inert', '');
              timeline.fromTo(card, { '--sector-entry': 0 }, { '--sector-entry': 1, duration: 1.1, onUpdate: () => { card.toggleAttribute('inert', Number(gsap.getProperty(card, '--sector-entry')) < 0.98); } }, at)
                .fromTo(card.querySelector('.sector-morph__body'), { clipPath: 'inset(100% 0 0 round 8px)' }, { clipPath: 'inset(0% 0 0 round 8px)', duration: 1.1 }, at + 0.1)
                .fromTo(card.querySelector('.sector-morph__photo'), { clipPath: 'inset(100% 0 0 round 8px)' }, { clipPath: 'inset(0% 0 0 round 8px)', duration: 1.3 }, at + 0.15)
                .fromTo(card.querySelector('.sector-morph__photo img'), { scale: 1.08 }, { scale: 1, duration: 1.5 }, at + 0.15)
                .fromTo(card.querySelector('.sector-morph__title-reveal'), { autoAlpha: 0, yPercent: 110 }, { autoAlpha: 1, yPercent: 0, duration: 1.05 }, at + 0.35)
                .fromTo(card.querySelector('.sector-morph__open'), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.9 }, at + 0.55)
                .fromTo(card.querySelector('.sector-morph__description-reveal'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.1 }, at + 0.6)
                .fromTo(card.querySelector('.sector-morph__number-reveal'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1 }, at + 0.7);
              if (index === 0) timeline.fromTo(card, { '--sector-metrics-entry': 0 }, { '--sector-metrics-entry': 1, duration: 1.2, onUpdate: () => sync(card) }, at + 0.85)
                .fromTo(card.querySelector('.sector-morph__metrics-reveal'), { autoAlpha: 0, y: 24, clipPath: 'inset(100% 0 0 round 6px)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 round 6px)', duration: 1.2 }, at + 0.85);
            };
            if (story) {
              gsap.set(hold, { height: direct ? '0px' : '220vh' });
              gsap.set(cardsHold, { height: '260vh' });
              gsap.set(section, { position: 'sticky', top: 0 });
              const overlap = !direct && mission && getComputedStyle(mission).position === 'sticky';
              const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
                trigger: scene, start: overlap ? 'top 20%' : 'top top', end: () => `+=${hold.offsetHeight + (overlap ? innerHeight * 0.2 : 0)}`, scrub: true,
              } });
              if (overlap) {
                // Shared live divider measurement follows fonts/resize without stale offsets.
                gsap.fromTo(section, { '--sectors-divider-progress': 0 }, { '--sectors-divider-progress': 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top top', end: '+=300', scrub: true } });
                // Counter vertical travel while the real panel slides across the viewport.
                // Direct scrub shares Lenis' clock, keeping fast/reverse scroll aligned.
                gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top top', scrub: true } }).fromTo(section, { xPercent: 100, y: -innerHeight, borderRadius: '20px 0 0 20px' }, { xPercent: 0, y: 0, borderRadius: '0px', duration: 1, ease: 'none' }, 0)
                  .to(mission.querySelector('.missions__content'), { x: -innerWidth * 0.08, opacity: 0.35, scale: 0.98, duration: 1, ease: 'none' }, 0);
              }
              const revealAt = 0;
              if (!direct) {
                reveal(timeline, revealAt);
                timeline.fromTo(emphasis, { '--sectors-emphasis-progress': 0 }, { '--sectors-emphasis-progress': 1, duration: 1.5, ease: 'none' }, 0.95);
                gsap.set(canvas, { display: 'block' });
                gsap.set(seams, { display: 'block' });
                timeline.fromTo(canvas, { scaleX: 0.12, scaleY: 0.004, autoAlpha: 0, transformOrigin: '50% 0%' }, { scaleX: 1, autoAlpha: 1, duration: 0.9 }, 1.05)
                  .to(canvas, { scaleY: 1, duration: 1.3 }, 1.95)
                  .fromTo(seams, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 2.55);
                cards.forEach((card, i) => enterCard(timeline, card, 2.55 + i * 0.3, i));
                timeline.fromTo(section.querySelectorAll('.sectors__cards-seams > span'), { scaleX: 1 }, { scaleX: 0, duration: 0.95 }, 4.5)
                  .to(canvas, { autoAlpha: 0, duration: 0.95 }, 4.5)
                  .to({}, { duration: 0.8 });
              }
              const states = gsap.timeline({ defaults: { duration: 1.7, ease: 'power2.inOut' }, scrollTrigger: {
                trigger: scene, start: () => `top+=${hold.offsetHeight} top`, end: () => `+=${cardsHold.offsetHeight}`, scrub: true,
              } });
              cards.forEach((card, i) => {
                gsap.set(card, { '--sector-active': i === 0 ? 1 : 0 });
                sync(card);
                if (i > 0) {
                  const at = 0.6 + (i - 1) * 3;
                  const previous = cards[i - 1];
                  states.to(previous, { '--sector-active': 0, onUpdate: () => sync(previous) }, at)
                    .to(card, { '--sector-active': 1, onUpdate: () => sync(card) }, at + 0.2);
                }
              });
              states.to({}, { duration: 0.9 });
            } else {
              if (!direct) {
                gsap.fromTo(section, { x: 32 }, { x: 0, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top 55%', scrub: true } });
                const timeline = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 25%', scrub: true } });
                reveal(timeline);
                gsap.fromTo(emphasis, { '--sectors-emphasis-progress': 0 }, { '--sectors-emphasis-progress': 1, ease: 'none', scrollTrigger: { trigger: emphasis, start: 'top 85%', end: 'bottom 45%', scrub: true } });
              }
              cards.forEach(card => {
                const active = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: card, start: 'top 95%', end: 'bottom 10%', scrub: true } });
                active.fromTo(card, { '--sector-active': 0 }, { '--sector-active': 1, duration: 1.4, onUpdate: () => sync(card) }, 0).to({}, { duration: 0.6 }).to(card, { '--sector-active': 0, duration: 0.6, onUpdate: () => sync(card) });
              });
              if (!direct) cards.forEach((card, i) => {
                const entry = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 35%', scrub: true } });
                enterCard(entry, card, 0, i);
              });
            }
            return () => { restore(); section.classList.remove('sectors--story'); if (directMission) mission?.classList.remove('missions--story'); };
          }, section);
          ScrollTrigger.refresh();
          if (!announced) {
            announced = true;
            window.dispatchEvent(new Event('kindsight:sectors-ready'));
          }
        });
      });
    };
    let width = innerWidth, height = innerHeight;
    const resize = () => {
      if (width === innerWidth && height === innerHeight) return;
      width = innerWidth; height = innerHeight;
      media?.revert(); media = undefined; setup();
    };
    setup();
    window.addEventListener('resize', resize);
    window.addEventListener('kindsight:intro-complete', setup);
    return () => { cancelAnimationFrame(frame); media?.revert(); window.removeEventListener('resize', resize); window.removeEventListener('kindsight:intro-complete', setup); };
  }, [root, ready, hash, donation, percentage]);
}
