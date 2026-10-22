import { useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useMissionsMotion(root: RefObject<HTMLElement | null>, ready: boolean, growth: string) {
  const { hash } = useLocation();
  useLayoutEffect(() => {
    if (!ready || hash === '#missions' || hash === '#missions-title') return;
    let frame = 0;
    let media: gsap.MatchMedia | undefined;
    const setup = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = root.current;
        if (!section || media || document.documentElement.classList.contains('has-landing-intro')) return;
        media = gsap.matchMedia();
        media.add({ all: '(min-width: 0px)', desktop: '(min-width: 64rem) and (min-height: 40rem)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
          if (context.conditions?.reduce) return;
          const scene = section.closest<HTMLElement>('.missions-scene')!;
          const hold = scene.querySelector('.missions-scene__hold');
          const surface = section.querySelector<HTMLElement>('.missions__surface')!;
          const visual = section.querySelector<HTMLElement>('.missions__visual')!;
          const photo = section.querySelector('.missions__photo');
          const title = section.querySelector('.missions__title');
          const label = section.querySelector<HTMLElement>('.section-label')!;
          const labelText = label.querySelector('span');
          const labelIcon = label.querySelector('img');
          const description = section.querySelector('.missions__description');
          const emphasis = section.querySelector('.missions__emphasis');
          const benefits = [...section.querySelectorAll<HTMLElement>('.missions__benefit')];
          const metric = section.querySelector('.missions__metric');
          const track = section.querySelector('.missions__gauge-track');
          const arc = section.querySelector('.missions__gauge-fill');
          const orbit = section.querySelector('.missions__pointer-orbit');
          const value = section.querySelector<HTMLElement>('.missions__growth-value');
          const originalValue = value?.textContent ?? '';
          const numericValue = Number(originalValue);
          const pointerAngle = value && Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100 ? numericValue * 2 : 100;
          const gauge = (timeline: gsap.core.Timeline, at: number) => {
            timeline.fromTo(metric, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1 }, at)
              .fromTo(track, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, at + 0.35)
              .fromTo(arc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, at + 0.65)
              .fromTo(arc, { attr: { 'stroke-dashoffset': 100 } }, { attr: { 'stroke-dashoffset': 100 - pointerAngle / 2 }, duration: 1.9, ease: 'power2.out' }, at + 0.65)
              .fromTo(orbit, { attr: { transform: 'rotate(0 144 143)' } }, { attr: { transform: `rotate(${pointerAngle} 144 143)` }, duration: 1.9, ease: 'power2.out' }, at + 0.65);
            if (value && Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100) {
              const counter = { amount: 0 };
              const decimals = originalValue.includes('.') ? originalValue.split('.')[1].length : 0;
              timeline.fromTo(counter, { amount: 0 }, { amount: numericValue, duration: 1.9, ease: 'power2.out', onUpdate: () => { value.textContent = counter.amount.toFixed(decimals); } }, at + 0.65);
            }
          };
          const cleanup = () => {
            section.classList.remove('missions--story');
            if (value) value.textContent = originalValue;
          };
          if (context.conditions?.desktop) section.classList.add('missions--story');
          const fits = context.conditions?.desktop && section.offsetHeight <= innerHeight + 2;
          const previous = section.closest('.testimonial-scene')?.querySelector<HTMLElement>('#testimonials');
          const previousRule = previous?.querySelector<HTMLElement>('.testimonial__handoff-rule');
          if (!fits || !previous || getComputedStyle(previous).position !== 'sticky' || !previousRule) {
            section.classList.remove('missions--story');
            const reveal = (target: gsap.TweenTarget, trigger: Element) => gsap.fromTo(target, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger, start: 'top 92%', end: 'top 62%', scrub: 1.1 } });
            reveal(label, label);
            gsap.fromTo(title, { '--missions-title-progress': 0 }, { '--missions-title-progress': 1, ease: 'none', scrollTrigger: { trigger: title, start: 'top 92%', end: 'bottom 65%', scrub: 1.1 } });
            reveal(description, description!);
            gsap.fromTo(emphasis, { '--missions-emphasis-progress': 0 }, { '--missions-emphasis-progress': 1, ease: 'none', scrollTrigger: { trigger: emphasis, start: 'top 85%', end: 'bottom 45%', scrub: 1.1 } });
            gsap.fromTo(visual, { clipPath: 'inset(46% 0% 46% 0% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', scrollTrigger: { trigger: visual, start: 'top 92%', end: 'top 35%', scrub: 1.2 } });
            gsap.fromTo(photo, { scale: 1.05 }, { scale: 1, scrollTrigger: { trigger: visual, start: 'top 92%', end: 'top 35%', scrub: 1.2 } });
            benefits.forEach(benefit => {
              const timeline = gsap.timeline({ scrollTrigger: { trigger: benefit, start: 'top 92%', end: 'bottom 60%', scrub: 1.1 } });
              timeline.fromTo(benefit, { '--missions-benefit-line': 0 }, { '--missions-benefit-line': 1, duration: 1 }, 0)
                .fromTo(benefit.querySelector('.missions__icon'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.2)
                .fromTo(benefit.querySelector('p'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.45);
            });
            const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: visual, start: 'top 65%', end: 'bottom 65%', scrub: 1.2 } });
            gauge(timeline, 0);
            return cleanup;
          }
          gsap.set(section, { position: 'sticky', top: 0 });
          gsap.set(hold, { height: '280vh' });
          const visualBox = visual.getBoundingClientRect();
          const sectionBox = section.getBoundingClientRect();
          const x = innerWidth / 2 - (visualBox.left + visualBox.width / 2);
          const y = innerHeight / 2 - (visualBox.top - sectionBox.top + visualBox.height / 2);
          const ruleBox = previousRule.getBoundingClientRect();
          const ruleWidth = previousRule.querySelector<HTMLElement>('.testimonial__rule')?.offsetWidth || ruleBox.width;
          const previousBox = previous!.getBoundingClientRect();
          const ruleY = innerHeight / 2 - (ruleBox.top - previousBox.top + ruleBox.height / 2);
          gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top top', scrub: true } })
            .to(previous!.querySelector('.testimonial__content'), { autoAlpha: 0, y: -24, duration: 0.75 }, 0)
            .to(previous!.querySelector('.testimonial__handoff-top'), { autoAlpha: 0, duration: 0.6 }, 0.1)
            .to(previousRule, { y: ruleY, scaleX: visualBox.width / ruleWidth, duration: 1 }, 0)
            .fromTo(previousRule, { clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: 'inset(0px 44px 0px 44px)', duration: 0.5 }, 0.5);
          // Geometry uses direct progress; Lenis provides the smoothing clock.
          // The actual figure stays mounted in its final grid cell throughout.
          const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
            trigger: scene, start: 'top top', end: () => `+=${hold instanceof HTMLElement ? hold.offsetHeight : 0}`, scrub: true, invalidateOnRefresh: true,
          } });
          const initialTop = innerHeight / 2 - visualBox.height / 2;
          const initialLeft = innerWidth / 2 - visualBox.width / 2;
          gsap.set(surface, { autoAlpha: 0 });
          gsap.set(visual, { autoAlpha: 0 });
          gsap.set(section.querySelector('.missions__copy'), { autoAlpha: 0 });
          gsap.set(surface, { clipPath: 'inset(var(--missions-surface-top, 0px) var(--missions-surface-right, 0px) var(--missions-surface-bottom, 0px) var(--missions-surface-left, 0px) round var(--missions-surface-radius, 0px))' });
          timeline.fromTo(visual, { x, y, clipPath: 'inset(49.85% 0% 49.85% 0% round 8px)' }, { x, y, clipPath: 'inset(0% 0% 0% 0% round 8px)', duration: 1.5 }, 0)
            .to(visual, { autoAlpha: 1, duration: 0.2 }, 0)
            .fromTo(photo, { scale: 1.07 }, { scale: 1, duration: 2.5 }, 0)
            .to(previousRule, { autoAlpha: 0, duration: 0.25 }, 0)
            .to(surface, { autoAlpha: 1, duration: 0.35 }, 1)
            .fromTo(surface, { '--missions-surface-top': `${initialTop}px`, '--missions-surface-bottom': `${sectionBox.height - initialTop - visualBox.height}px`, '--missions-surface-left': `${initialLeft}px`, '--missions-surface-right': `${initialLeft}px`, '--missions-surface-radius': '8px' }, { '--missions-surface-top': '0px', '--missions-surface-bottom': '0px', '--missions-surface-left': '0px', '--missions-surface-right': '0px', '--missions-surface-radius': '0px', duration: 1.65 }, 1)
            .to(visual, { x: 0, y: 0, duration: 1.65 }, 1.8)
            .fromTo(label, { width: 28, gap: 0, overflow: 'clip', autoAlpha: 0 }, { width: () => 28 + 8 + (labelText?.scrollWidth ?? 0), gap: 8, autoAlpha: 1, duration: 1.1 }, 2.35)
            .fromTo(labelIcon, { rotation: 0 }, { rotation: 360, duration: 1.1 }, 2.35)
            .fromTo(labelText, { autoAlpha: 0, x: -5 }, { autoAlpha: 1, x: 0, duration: 0.9 }, 2.55)
            .fromTo(title, { '--missions-title-progress': 0 }, { '--missions-title-progress': 1, duration: 1.45, ease: 'none' }, 2.55)
            .to(section.querySelector('.missions__copy'), { autoAlpha: 1, duration: 0.45 }, 3)
            .fromTo(description, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 3.1)
            .fromTo(emphasis, { '--missions-emphasis-progress': 0 }, { '--missions-emphasis-progress': 1, duration: 1.65, ease: 'none' }, 3.65);
          benefits.forEach((benefit, i) => {
            timeline.fromTo(benefit, { '--missions-benefit-line': 0 }, { '--missions-benefit-line': 1, duration: 1.1 }, 3.65 + i * 0.2)
              .fromTo(benefit.querySelector('.missions__icon'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 3.85 + i * 0.2)
              .fromTo(benefit.querySelector('p'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.05 }, 4.1 + i * 0.2);
          });
          gauge(timeline, 4.65);
          timeline.to({}, { duration: 0.7 });
          return cleanup;
        }, section);
        ScrollTrigger.refresh();
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
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('kindsight:intro-complete', setup); media?.revert(); };
  }, [root, ready, growth, hash]);
}
