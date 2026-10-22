import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useFooterMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready) return;
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    let active = true;
    let announced = false;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = root.current;
        if (!active || !section || document.documentElement.classList.contains('has-landing-intro')) return;
        media?.revert();
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 80rem) and (min-height: 42rem)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce || hash === '#footer') return;
          const panel = section.querySelector<HTMLElement>('.site-footer__panel')!;
          const sectors = document.querySelector<HTMLElement>('#sectors');
          const exit = document.querySelector<HTMLElement>('.sectors-scene__footer-hold');
          const fits = section.offsetHeight <= innerHeight + 2;
          const overlap = context.conditions?.desktop && fits && sectors && exit && getComputedStyle(sectors).position === 'sticky';
          const brand = section.querySelector('.site-footer__brand');
          const heading = section.querySelectorAll('.site-footer__heading-word > span');
          const email = section.querySelector('.site-footer__email');
          const description = section.querySelector('#react-newsletter-description');
          const groups = section.querySelectorAll('.site-footer__group');
          const wordmark = section.querySelector('.site-footer__wordmark');
          const bottom = section.querySelector('.site-footer__bottom');
          if (overlap) {
            section.classList.add('site-footer--overlap');
            // Extend the existing containing block, then overlap that extension.
            // Education finishes before the footer enters; document end is one full footer.
            gsap.set(exit, { height: innerHeight });
            gsap.set(section, { marginTop: -innerHeight });
            const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: true } });
            timeline.fromTo(panel, { borderRadius: '28px 28px 20px 20px' }, { borderRadius: '20px', duration: 0.8 }, 0)
              .to(sectors.querySelector('.sectors__content'), { y: -32, scale: 0.98, opacity: 0.35, duration: 1, ease: 'none' }, 0)
              .fromTo(section.querySelector('.site-footer__rule'), { scaleX: 0, transformOrigin: 'center' }, { scaleX: 1, duration: 0.48 }, 0.08)
              .fromTo(section.querySelectorAll('.site-footer__ornament > img'), { autoAlpha: 0, rotation: -45 }, { autoAlpha: 1, rotation: 0, duration: 0.4 }, 0.1)
              .fromTo(brand, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.18)
              .fromTo(heading, { yPercent: 110 }, { yPercent: 0, stagger: 0.035, duration: 0.35 }, 0.28)
              .fromTo(email, { clipPath: 'inset(0 100% 0 0 round 30px)' }, { clipPath: 'inset(0 0% 0 0 round 30px)', duration: 0.4 }, 0.38)
              .fromTo(description, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.45)
              .fromTo(groups, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.35 }, 0.4)
              .fromTo(wordmark, { clipPath: 'inset(100% 0 0)', yPercent: 15 }, { clipPath: 'inset(0% 0 0)', yPercent: 0, duration: 0.25 }, 0.7)
              .fromTo(bottom, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.18 }, 0.82);
          } else {
            // Natural height on narrow/short screens; each block finishes before page end.
            const reveal = (target: gsap.TweenTarget, trigger: Element) => gsap.fromTo(target, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger, start: 'top 95%', end: 'clamp(top 65%)', scrub: true } });
            reveal(brand!, brand as Element);
            reveal(section.querySelector('.site-footer__newsletter')!, section.querySelector('.site-footer__newsletter')!);
            groups.forEach(group => reveal(group, group));
            reveal(bottom!, bottom as Element);
            gsap.fromTo(section.querySelector('.site-footer__rule'), { scaleX: 0, transformOrigin: 'center' }, { scaleX: 1, scrollTrigger: { trigger: section, start: 'top 95%', end: 'clamp(top 60%)', scrub: true } });
            gsap.fromTo(wordmark, { clipPath: 'inset(100% 0 0)' }, { clipPath: 'inset(0% 0 0)', scrollTrigger: { trigger: wordmark, start: 'top 98%', end: 'clamp(top 75%)', scrub: true } });
          }
          return () => section.classList.remove('site-footer--overlap');
        }, section);
        ScrollTrigger.refresh();
        if (!announced) { announced = true; window.dispatchEvent(new Event('kindsight:footer-ready')); }
      });
    };
    setup();
    void document.fonts.ready.then(() => { if (active) setup(); });
    window.addEventListener('resize', setup);
    window.addEventListener('kindsight:intro-complete', setup);
    window.addEventListener('kindsight:sectors-ready', setup);
    return () => { active = false; cancelAnimationFrame(frame); media?.revert(); window.removeEventListener('resize', setup); window.removeEventListener('kindsight:intro-complete', setup); window.removeEventListener('kindsight:sectors-ready', setup); };
  }, [root, ready, hash]);
}
