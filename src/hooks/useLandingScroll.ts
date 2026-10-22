import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

// One clock for smooth scrolling and future landing ScrollTrigger animations.
export function useLandingScroll(enabled: boolean) {
  const scroll = useRef<Lenis | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};
    function configure() {
      dispose();
      dispose = () => {};
      if (motion.matches) return;
      const lenis = new Lenis({
        autoRaf: false,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.1,
        anchors: false, // React Router owns fragment URLs and focus.
        prevent: node => Boolean(node.closest('dialog, [role="listbox"], [data-lenis-prevent]')),
        virtualScroll: () => !document.documentElement.classList.contains('has-landing-intro') && !document.querySelector('dialog[open]'),
      });
      scroll.current = lenis;
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      let frame = 0;
      const refresh = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { lenis.resize(); ScrollTrigger.refresh(); });
      };
      const observer = new ResizeObserver(refresh);
      observer.observe(document.body);
      refresh();
      dispose = () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        gsap.ticker.remove(tick);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        scroll.current = null;
      };
    }
    configure();
    motion.addEventListener('change', configure);
    return () => { motion.removeEventListener('change', configure); dispose(); };
  }, [enabled]);
  return scroll;
}
