import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useAboutMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready) return;
    const direct = ['#about', '#about-title', '#solutions', '#solutions-title'].includes(hash) || hash.startsWith('#solution-');
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = root.current;
        if (!section || media || document.documentElement.classList.contains('has-landing-intro')) return;
        const minimumHeight = Math.ceil(section.offsetHeight + 25);
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 48rem)', roomy: `(min-height: ${minimumHeight}px)`, reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce) return;
          const surface = section.closest<HTMLElement>('.about-solutions-story') ?? section;
          const statistics = section.querySelector<HTMLElement>('.about__statistics')!;
          const panel = section.querySelector<HTMLElement>('.about__statistics-panel')!;
          const cards = section.querySelectorAll('.stat-card');
          const copy = section.querySelectorAll('.stat-card__value, .stat-card__label');
          const header = section.querySelector<HTMLElement>('.about__header')!;
          const label = section.querySelector<HTMLElement>('.about__label')!;
          const labelText = label.querySelector<HTMLElement>('span')!;
          const icon = label.querySelector('img');
          const title = section.querySelectorAll('.about__title > span');
          const description = section.querySelector('.about__description');
          const stage = section.querySelector('.about__statistics-stage');
          const fits = Boolean(context.conditions?.desktop && context.conditions?.roomy);
          // Each underlying layer owns one CSS sticky surface; only the final
          // Solutions scene uses a pin. The wrapper stays stable during refresh.
          if (fits) {
            gsap.set(section, { position: 'sticky', top: 0, minHeight: '100vh', marginBottom: direct ? 0 : '215vh' });
            const solutions = surface.querySelector<HTMLElement>('#solutions');
            const content = section.querySelector<HTMLElement>('.about__content')!;
            const directSolutions = hash === '#solutions' || hash === '#solutions-title' || hash.startsWith('#solution-');
            if (solutions && !directSolutions) {
              // Recede only the inner composition, matching Difference's depth.
              // The sticky surface/grid and the header's own reveal stay separate.
              gsap.fromTo(content, { y: 0, scale: 1, transformOrigin: '50% 50%' }, {
                y: () => -Math.min(60, Math.max(40, innerHeight * 0.075)),
                scale: 0.97, ease: 'none',
                scrollTrigger: {
                  trigger: solutions, start: 'top bottom', end: 'top 10%',
                  scrub: 1, invalidateOnRefresh: true,
                },
              });
            }
          }
          if (!context.conditions?.desktop) gsap.set(section, { marginTop: -32 });
          if (direct) return;
          const centeredY = () => {
            const offset = Math.max(0, (innerHeight - header.offsetHeight) / 2 - parseFloat(getComputedStyle(section).paddingTop) - header.offsetTop);
            return fits ? offset : Math.min(48, offset);
          };
          const labelGap = parseFloat(getComputedStyle(label).gap);
          const gap = getComputedStyle(statistics).gap;
          const background = getComputedStyle(cards[0]).backgroundColor;
          const border = getComputedStyle(cards[0]).borderColor;
          const radius = getComputedStyle(cards[0]).borderRadius;
          const scene = gsap.timeline({
            defaults: { ease: 'power2.inOut' },
            scrollTrigger: {
              trigger: fits ? surface : section, start: fits ? 'top top' : 'top 85%',
              end: fits ? () => `+=${innerHeight * 2.15}` : 'bottom 72%',
              scrub: 1.4, invalidateOnRefresh: true,
            },
          });
          gsap.set(statistics, { gap: 0 });
          gsap.set(cards, { backgroundColor: 'transparent', borderColor: 'transparent', borderRadius: 0 });
          gsap.set(copy, { autoAlpha: 0, y: 18 });
          gsap.set(header, { y: centeredY });
          gsap.set(stage, { y: centeredY });
          gsap.set(title, { autoAlpha: 0, y: 24, clipPath: 'inset(100% 0 -10% 0)' });
          gsap.set(description, { autoAlpha: 0, y: 16, clipPath: 'inset(0 0 100% 0)' });
          // Content-box width 20px + 4px padding on each side: a 28px icon badge.
          gsap.set(label, { width: 20, gap: 0, autoAlpha: 0, y: 8 });
          gsap.set(labelText, { autoAlpha: 0, x: -8 });
          gsap.set(panel, { opacity: 1, '--about-panel-x': '34%', '--about-panel-bottom': () => `${Math.max(0, panel.offsetHeight - 4)}px`, '--about-panel-radius': '4px' });
          scene.to(label, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
            .to(title, { autoAlpha: 1, y: 0, clipPath: 'inset(-10% 0 -10% 0)', duration: 1.3, stagger: 0.22 }, 0.2)
            .to(description, { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0% 0)', duration: 1.1 }, 1)
            .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.65 }, 1.9)
            .fromTo(panel, { '--about-panel-x': '34%' }, { '--about-panel-x': '0%', duration: 1.4 }, 2.2)
            .to(header, { y: 0, duration: 1.8 }, 3.4)
            .to(stage, { y: 0, duration: 1.8 }, 3.4)
            .fromTo(panel, { '--about-panel-bottom': () => `${Math.max(0, panel.offsetHeight - 4)}px`, '--about-panel-radius': '4px' }, { '--about-panel-bottom': '0px', '--about-panel-radius': '12px', duration: 1.8 }, 3.6)
            .to(copy, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.2 }, 5.2)
            .to(label, { width: () => 20 + labelGap + labelText.scrollWidth, gap: labelGap, duration: 1.4 }, 5.2)
            .to(icon, { rotation: 360, transformOrigin: '50% 50%', duration: 1.4 }, 5.2)
            .to(labelText, { autoAlpha: 1, x: 0, duration: 1.1 }, 5.4)
            .to(cards, { backgroundColor: background, borderColor: border, borderRadius: radius, duration: 1.2 }, 6.9)
            .to(panel, { opacity: 0, duration: 0.6 }, 6.9)
            .to(statistics, { gap, duration: 1.6 }, 6.9)
            .to({}, { duration: 0.65 });
        }, section);
        ScrollTrigger.refresh();
      });
    };
    let measuredWidth = innerWidth;
    const resizeWidth = () => {
      if (innerWidth === measuredWidth) return;
      measuredWidth = innerWidth;
      // Re-measure the natural composition after responsive line wrapping.
      // Height-only browser chrome changes remain handled by matchMedia/refresh.
      media?.revert();
      media = undefined;
      setup();
    };
    setup();
    window.addEventListener('resize', resizeWidth);
    window.addEventListener('kindsight:intro-complete', setup);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resizeWidth);
      window.removeEventListener('kindsight:intro-complete', setup);
      media?.revert();
    };
  }, [root, ready, hash]);
}
