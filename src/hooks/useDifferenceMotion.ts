import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation } from 'react-router';

gsap.registerPlugin(ScrollTrigger);

export function useDifferenceMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready) return;
    // Direct section URLs remain fully readable without replaying the reveal.
    const direct = ['#difference', '#difference-title', '#about', '#about-title'].includes(hash);
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!root.current || media || document.documentElement.classList.contains('has-landing-intro')) return;
        const section = root.current;
        const minimumHeight = Math.ceil(section.querySelector<HTMLElement>('.difference__content')!.offsetHeight + parseFloat(getComputedStyle(section).paddingTop) + 25);
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 75rem)', roomy: `(min-height: ${minimumHeight}px)`, reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce) return;
          const stage = section.closest<HTMLElement>('.landing-story') ?? section;
          const body = section.querySelector<HTMLElement>('.difference__body');
          const gradient = section.querySelector('.difference__illustration');
          const insight = section.querySelector('.difference__insight');
          const rows = section.querySelectorAll('.accordion__item');
          const descriptions = section.querySelectorAll('.accordion__panel p');
          const title = section.querySelectorAll('.difference__title > span');
          const label = section.querySelector('.difference__label');
          const padding = parseFloat(getComputedStyle(section).paddingTop);
          const fits = context.conditions?.desktop && context.conditions?.roomy;
          if (fits) {
            const hold = () => direct ? 0 : innerHeight * 0.95;
            // One native sticky surface spans both sections. The margin reserves
            // the reveal's scroll distance; About starts entering only afterwards.
            gsap.set(section, { position: 'sticky', top: 0, minHeight: '100vh', marginBottom: direct ? 0 : '95vh' });
            const about = stage.querySelector<HTMLElement>('#about');
            const content = section.querySelector<HTMLElement>('.difference__content')!;
            if (about && hash !== '#about' && hash !== '#about-title') {
              // Only the inner composition recedes. Sticky geometry and the grid
              // remain untouched; this range ends before About's own pin starts.
              gsap.fromTo(content, { y: 0, scale: 1, transformOrigin: '50% 50%' }, {
                y: () => -Math.min(60, Math.max(40, innerHeight * 0.075)),
                scale: 0.97, ease: 'none',
                scrollTrigger: {
                  trigger: about, start: 'top bottom', end: 'top 10%',
                  scrub: 1, invalidateOnRefresh: true,
                },
              });
            }
            if (direct) return;
            gsap.set(rows, { autoAlpha: 0, clipPath: 'inset(-8px 100% -8px 0)' });
            gsap.set(descriptions, { autoAlpha: 0, y: 8 });
            gsap.set(title, { autoAlpha: 0, y: 24, clipPath: 'inset(100% 0 -10% 0)' });
            // At the sticky scene's start, content sits at the section's top padding.
            // Translate only the panel; the header's reserved layout never collapses.
            const centeredY = () => (innerHeight - body!.offsetHeight) / 2 - padding - body!.offsetTop;
            const entrance = () => Math.max(0, innerHeight * 0.92 - body!.offsetTop - padding);
            const scene = gsap.timeline({
              defaults: { ease: 'power2.out' },
              scrollTrigger: { trigger: stage, start: () => `top ${entrance()}px`, end: () => `+=${entrance() + hold()}`, scrub: 1.3, invalidateOnRefresh: true },
            });
            scene.fromTo(body, { autoAlpha: 0, y: centeredY, scale: 0.96, transformOrigin: '50% 0%', clipPath: 'inset(0 0 100% 0 round 12px)' }, { autoAlpha: 1, y: centeredY, scale: 1, clipPath: 'inset(0 0 0% 0 round 12px)', duration: 1.35 }, 0)
              .fromTo(gradient, { autoAlpha: 0, clipPath: 'inset(0 0 100% 0 round 10px)' }, { autoAlpha: 1, clipPath: 'inset(0 0 0% 0 round 10px)', duration: 1.2 }, 0.3)
              .to(rows, { autoAlpha: 1, clipPath: 'inset(-8px 0% -8px 0)', duration: 0.95, stagger: 0.55 }, 1.25)
              .to(descriptions, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.7)
              .fromTo(insight, { autoAlpha: 0, y: 36, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.35 }, 1.95)
              .to(body, { y: 0, duration: 1.65, ease: 'power2.out' }, 3.15)
              .to(title, { autoAlpha: 1, y: 0, clipPath: 'inset(-10% 0 -10% 0)', duration: 1.2, stagger: 0.2 }, 3.55)
              .fromTo(label, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1 }, 3.95);
          } else {
            if (direct) return;
            // A stacked/tall composition must remain readable without a long pin.
            const reveal = (target: gsap.TweenTarget, trigger: Element, y: number, stagger = 0) => {
              gsap.set(target, { autoAlpha: 0, y });
              return gsap.to(target, { autoAlpha: 1, y: 0, duration: 1.3, stagger, ease: 'power2.out', scrollTrigger: { trigger, start: 'top 94%', end: 'top 68%', scrub: 1.2, invalidateOnRefresh: true } });
            };
            reveal(section.querySelector('.difference__header'), section.querySelector('.difference__header')!, 18);
            gsap.fromTo(body, { autoAlpha: 0, scale: 0.96, transformOrigin: '50% 0%', clipPath: 'inset(0 0 100% 0 round 12px)' }, {
              autoAlpha: 1, scale: 1, clipPath: 'inset(0 0 0% 0 round 12px)', ease: 'power2.out',
              scrollTrigger: { trigger: body, start: 'top 96%', end: 'top 53%', scrub: 1.2, invalidateOnRefresh: true },
            });
            rows.forEach(row => {
              gsap.fromTo(row, { autoAlpha: 0, clipPath: 'inset(-8px 100% -8px 0)' }, {
                autoAlpha: 1, clipPath: 'inset(-8px 0% -8px 0)', ease: 'power2.out',
                scrollTrigger: { trigger: row, start: 'top 90%', end: 'top 62%', scrub: 1.2, invalidateOnRefresh: true },
              });
            });
            reveal(insight, gradient!, 24);
          }
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
