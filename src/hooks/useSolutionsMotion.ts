import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useSolutionsMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready) return;
    const direct = ['#solutions', '#solutions-title', '#testimonials', '#testimonial-title'].includes(hash) || hash.startsWith('#solution-');
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = root.current;
        if (!section || media || document.documentElement.classList.contains('has-landing-intro')) return;
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 80rem) and (min-height: 42rem)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce) return;
          const surface = section.closest<HTMLElement>('.solutions-testimonial-story') ?? section;
          const header = section.querySelector<HTMLElement>('.solutions__header')!;
          const title = section.querySelector<HTMLElement>('.solutions__title')!;
          const lines = title.querySelectorAll<HTMLElement>('span');
          const label = section.querySelector<HTMLElement>('.solutions__label')!;
          const labelText = label.querySelector<HTMLElement>('span')!;
          const icon = label.querySelector('img');
          const description = section.querySelector('.solutions__description');
          const stage = section.querySelector('.solutions__stage');
          const panel = section.querySelector<HTMLElement>('.solutions__panel')!;
          const cards = section.querySelector<HTMLElement>('.solutions__cards')!;
          const items = cards.querySelectorAll<HTMLElement>('.solution-card');
          const revealItem = (timeline: gsap.core.Timeline, item: HTMLElement, at: number) => {
            const icon = item.querySelector('.solution-card__icon');
            const title = item.querySelector('.solution-card__title');
            const description = item.querySelector('.solution-card__description');
            const cta = item.querySelector('.solution-card__cta');
            const visual = item.querySelector('.solution-card__visual');
            const photo = item.querySelector('.solution-card__photo');
            const badge = item.querySelector('.solution-card__badge');
            timeline.fromTo(icon, { autoAlpha: 0, y: 10, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }, at)
              .fromTo(title, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, at + 0.2)
              .fromTo(description, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, at + 0.55);
            if (cta) timeline.fromTo(cta, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, at + 1);
            if (visual && photo) {
              gsap.set(visual, { clipPath: 'inset(0% var(--solution-image-right, 0%) 0% 0% round 10px)' });
              timeline.fromTo(visual, { autoAlpha: 0, '--solution-image-right': '100%' }, { autoAlpha: 1, '--solution-image-right': '0%', duration: 1.7 }, at + 0.15)
                .fromTo(photo, { scale: 1.06 }, { scale: 1, transformOrigin: '50% 50%', duration: 2, ease: 'power2.out' }, at + 0.15);
              if (badge) timeline.fromTo(badge, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, at + 1.1);
            }
          };
          if (context.conditions?.desktop) section.classList.add('solutions--motion');
          const fits = context.conditions?.desktop && section.offsetHeight + 24 < innerHeight;
          if (!fits) {
            section.classList.remove('solutions--motion');
            gsap.set(section, { marginTop: -32 });
            if (direct) return;
            gsap.fromTo(header, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger: header, start: 'top 92%', end: 'top 62%', scrub: 1.2, invalidateOnRefresh: true } });
            items.forEach(item => {
              const reveal = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
                trigger: item, start: 'top 92%', end: 'top 35%', scrub: 1.2, invalidateOnRefresh: true,
              } });
              reveal.fromTo(item, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0);
              revealItem(reveal, item, 0.1);
            });
            return;
          }
          gsap.set(section, { position: 'sticky', top: 0, minHeight: '100vh', marginBottom: direct ? 0 : '250vh' });
          const testimonials = surface.querySelector('.testimonial-scene');
          if (testimonials && hash !== '#testimonials' && hash !== '#testimonial-title') {
            gsap.fromTo(section.querySelector('.solutions__content'), { y: 0, scale: 1, transformOrigin: '50% 50%' }, {
              y: () => -Math.min(60, Math.max(40, innerHeight * 0.075)), scale: 0.97, ease: 'none',
              scrollTrigger: { trigger: testimonials, start: 'top bottom', end: 'top 50%', scrub: 1, invalidateOnRefresh: true },
            });
          }
          if (direct) return () => section.classList.remove('solutions--motion');
          const background = getComputedStyle(items[0]).backgroundColor;
          const border = getComputedStyle(items[0]).borderColor;
          const radius = getComputedStyle(items[0]).borderRadius;
          const labelGap = parseFloat(getComputedStyle(label).gap);
          const centeredY = () => Math.max(0, (innerHeight - header.offsetHeight) / 2 - parseFloat(getComputedStyle(section).paddingTop));
          const centeredTitleX = () => (header.clientWidth - title.offsetWidth) / 2;
          const labelWidth = () => 20 + labelGap + labelText.scrollWidth;
          gsap.set(header, { y: centeredY });
          gsap.set(stage, { y: centeredY });
          gsap.set(title, { x: centeredTitleX });
          gsap.set(lines, { x: index => (title.offsetWidth - lines[index].offsetWidth) / 2, autoAlpha: 0, y: 24, clipPath: 'inset(100% 0 -10% 0)' });
          gsap.set(label, { width: 20, gap: 0, x: () => (header.clientWidth - 28) / 2, autoAlpha: 0 });
          gsap.set(labelText, { autoAlpha: 0, x: -8 });
          gsap.set(description, { autoAlpha: 0, y: 12 });
          // Keep the final grid gap and widths throughout. The backing panel
          // fills the gutters until separation, so copy never reflows on scroll.
          gsap.set(items, { backgroundColor: 'transparent', borderColor: 'transparent', borderRadius: 0 });
          gsap.set(panel, { autoAlpha: 0, '--solutions-panel-x': '47%', '--solutions-panel-bottom': () => `${Math.max(0, panel.offsetHeight - 4)}px`, '--solutions-panel-radius': '4px' });
          const scene = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
            trigger: surface, start: 'top top', end: () => `+=${innerHeight * 2.5}`,
            scrub: 1.4, invalidateOnRefresh: true,
          } });
          scene.to(label, { autoAlpha: 1, duration: 0.8 }, 0)
            .to(lines, { autoAlpha: 1, y: 0, clipPath: 'inset(-10% 0 -10% 0)', stagger: 0.2, duration: 1.2 }, 0.2)
            .to(label, { width: labelWidth, gap: labelGap, x: () => (header.clientWidth - labelWidth() - 8) / 2, duration: 1.2 }, 1.5)
            .to(icon, { rotation: 360, duration: 1.2 }, 1.5)
            .to(labelText, { autoAlpha: 1, x: 0, duration: 1 }, 1.65)
            .to(header, { y: 0, duration: 1.8 }, 2.9)
            .to(stage, { y: 0, duration: 1.8 }, 2.9)
            .to(title, { x: 0, duration: 1.8 }, 2.9)
            .to(lines, { x: 0, duration: 1.8 }, 2.9)
            .to(label, { x: 0, duration: 1.8 }, 2.9)
            .to(description, { autoAlpha: 1, y: 0, duration: 1.3 }, 3.4)
            .to(panel, { autoAlpha: 1, duration: 0.7 }, 3.4)
            .fromTo(panel, { '--solutions-panel-x': '47%' }, { '--solutions-panel-x': '0%', duration: 1.3 }, 4.3)
            .fromTo(panel, { '--solutions-panel-bottom': () => `${Math.max(0, panel.offsetHeight - 4)}px`, '--solutions-panel-radius': '4px' }, { '--solutions-panel-bottom': '0px', '--solutions-panel-radius': '12px', duration: 1.7 }, 5.5)
            .to(items, { backgroundColor: background, borderColor: border, borderRadius: radius, duration: 1.6 }, 8.8)
            .to(panel, { autoAlpha: 0, duration: 1.6 }, 8.8)
            .to({}, { duration: 0.7 });
          items.forEach((item, index) => revealItem(scene, item, 6.5 + index * 0.15));
          return () => section.classList.remove('solutions--motion');
        }, section);
        ScrollTrigger.refresh();
      });
    };
    setup();
    window.addEventListener('kindsight:intro-complete', setup);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('kindsight:intro-complete', setup);
      media?.revert();
    };
  }, [root, ready, hash]);
}
