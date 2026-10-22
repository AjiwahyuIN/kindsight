import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useTestimonialsMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready || hash === '#testimonials' || hash === '#testimonial-title') return;
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = root.current;
        if (!section || media || document.documentElement.classList.contains('has-landing-intro')) return;
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 48rem) and (min-height: 40rem)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce) return;
          const surface = section.closest<HTMLElement>('.testimonial-scene')!;
          const hold = surface.querySelector<HTMLElement>('.testimonial-scene__hold')!;
          const panel = section.querySelector<HTMLElement>('.testimonial__panel')!;
          const heading = section.querySelector('.testimonial__heading');
          const description = section.querySelector('.testimonial__description');
          const portrait = section.querySelector('.testimonial__portrait');
          const photo = section.querySelector('.testimonial__portrait-reveal');
          const storyHeading = section.querySelector('.testimonial__story-heading');
          const tagline = section.querySelector('.testimonial__tagline');
          const details = section.querySelectorAll('.testimonial__rating, .testimonial__name, .testimonial__count, .testimonial__controls');
          const rules = section.querySelectorAll('.testimonial__rule');
          const corners = section.querySelectorAll('.testimonial__ornament > img');
          gsap.set(portrait, { clipPath: 'inset(0% 0% var(--testimonial-portrait-bottom, 0%) 0% round var(--radius-md))' });
          const fits = context.conditions?.desktop && panel.offsetHeight <= innerHeight + 2;
          const revealRules = (timeline: gsap.core.Timeline, at: number) => {
            timeline.fromTo(rules[0], { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 1.5 }, at)
              .fromTo(rules[1], { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 1.5 }, at + 1.2)
              .fromTo(corners, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, stagger: 0.12, duration: 1 }, at + 0.2);
          };
          if (!fits) {
            const reveal = (target: gsap.TweenTarget, trigger: Element, distance = 18) => gsap.fromTo(target,
              { autoAlpha: 0, y: distance }, { autoAlpha: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger, start: 'top 92%', end: 'top 62%', scrub: 1.2, invalidateOnRefresh: true } });
            reveal(heading, heading!);
            reveal(description, description!);
            gsap.fromTo(portrait, { '--testimonial-portrait-bottom': '100%' }, { '--testimonial-portrait-bottom': '0%', scrollTrigger: { trigger: portrait, start: 'top 92%', end: 'top 52%', scrub: 1.2 } });
            gsap.fromTo(photo, { scale: 1.04 }, { scale: 1, scrollTrigger: { trigger: portrait, start: 'top 92%', end: 'top 52%', scrub: 1.2 } });
            reveal(storyHeading, storyHeading!);
            gsap.fromTo(section, { '--testimonial-quote-progress': 0 }, { '--testimonial-quote-progress': 1, ease: 'none', scrollTrigger: { trigger: section.querySelector('.testimonial__quote'), start: 'top 90%', end: 'bottom 70%', scrub: 1.2, invalidateOnRefresh: true } });
            reveal(tagline, tagline!);
            details.forEach(detail => reveal(detail, detail));
            rules.forEach(rule => gsap.fromTo(rule, { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, ease: 'power2.inOut', scrollTrigger: { trigger: rule.parentElement, start: 'top 95%', end: 'top 70%', scrub: 1.2 } }));
            return;
          }
          // Stable CSS sticky surface: takeover needs no nested GSAP pin and no
          // compensating negative margins. The panel fills the viewport early.
          // A real flow spacer follows the sticky surface, so later font/copy
          // height changes cannot consume the reserved sticky travel.
          gsap.set(hold, { height: '320vh' });
          gsap.set(section, { position: 'sticky', top: 0 });
          const settle = (trigger: ScrollTrigger, progress: 0 | 1) => {
            trigger.getTween()?.progress(1);
            trigger.animation?.progress(progress);
          };
          gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
            // This translation cancels the surface's natural travel exactly.
            // Numeric scrub adds lag to CSS sticky and exposes the background
            // on fast scroll/reversal. Lenis already smooths the scroll input.
            trigger: surface, start: 'top 90%', end: 'top top', scrub: true, invalidateOnRefresh: true,
          } })
            .fromTo(panel, { y: 0, borderRadius: 20 }, { y: () => -innerHeight * 0.5, borderRadius: 0, duration: 0.4 }, 0)
            // Counter the remaining natural section travel; background stays at y0.
            .to(panel, { y: 0, duration: 0.5 }, 0.4);
          gsap.set(details, { autoAlpha: 0, y: 10 });
          gsap.set(corners, { autoAlpha: 0, scale: 0.9 });
          const scene = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
            trigger: surface, start: 'top 50%',
            // Finish one viewport before the CSS sticky constraint releases.
            end: () => `+=${Math.max(0, hold.offsetHeight - innerHeight) + innerHeight * 0.5}`,
            scrub: 1.3, invalidateOnRefresh: true,
            // Fast input settles the reveal while the extra hold is still active.
            onLeave: trigger => settle(trigger, 1),
            onLeaveBack: trigger => settle(trigger, 0),
          } });
          revealRules(scene, 0.45);
          scene.fromTo(heading, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 0.8)
            .fromTo(description, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 1.3)
            .fromTo(portrait, { autoAlpha: 0, '--testimonial-portrait-bottom': '100%' }, { autoAlpha: 1, '--testimonial-portrait-bottom': '0%', duration: 1.7 }, 2.2)
            .fromTo(photo, { scale: 1.04 }, { scale: 1, duration: 1.9 }, 2.2)
            .fromTo(storyHeading, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 2.45)
            .fromTo(section, { '--testimonial-quote-progress': 0 }, { '--testimonial-quote-progress': 1, duration: 2, ease: 'none' }, 2.9)
            .fromTo(tagline, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 4.3)
            .fromTo(details, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.17 }, 4.7)
            .to({}, { duration: 0.8 });
        }, section);
        ScrollTrigger.refresh();
      });
    };
    let measuredWidth = innerWidth;
    const resize = () => {
      if (innerWidth === measuredWidth) return;
      measuredWidth = innerWidth;
      media?.revert(); media = undefined; setup();
    };
    setup();
    window.addEventListener('resize', resize);
    window.addEventListener('kindsight:intro-complete', setup);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('kindsight:intro-complete', setup);
      media?.revert();
    };
  }, [root, ready, hash]);
}
