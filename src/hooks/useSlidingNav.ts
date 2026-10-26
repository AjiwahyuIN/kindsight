import { useLayoutEffect, useRef, type RefObject } from 'react';

// Measure the active route link; keep one indicator mounted across navigation.
export function useSlidingNav(root: RefObject<HTMLElement | null>, activeKey: string) {
  const initialized = useRef(false);
  useLayoutEffect(() => {
    const nav = root.current;
    if (!nav) return;
    let frame = 0;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const link = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!link) { nav.removeAttribute('data-indicator'); return; }
      const bounds = nav.getBoundingClientRect();
      const target = link.getBoundingClientRect();
      nav.style.setProperty('--nav-pill-x', `${target.left - bounds.left}px`);
      nav.style.setProperty('--nav-pill-y', `${target.top - bounds.top}px`);
      nav.style.setProperty('--nav-pill-width', `${target.width}px`);
      nav.style.setProperty('--nav-pill-height', `${target.height}px`);
      const scroller = nav.parentElement;
      if (scroller && scroller.scrollWidth > scroller.clientWidth) {
        const viewport = scroller.getBoundingClientRect();
        const delta = target.right > viewport.right - 4 ? target.right - viewport.right + 4 : target.left < viewport.left + 4 ? target.left - viewport.left - 4 : 0;
        if (delta) scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: initialized.current && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
      }
      nav.setAttribute('data-indicator', '');
      if (!initialized.current) {
        // Place the initial pill before enabling movement, avoiding a sweep on mount.
        frame = requestAnimationFrame(() => { if (alive) { nav.setAttribute('data-indicator-motion', ''); initialized.current = true; } });
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    nav.querySelectorAll('a').forEach(link => observer.observe(link));
    void document.fonts.ready.then(() => { if (alive) schedule(); });
    return () => { alive = false; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [root, activeKey]);
}
