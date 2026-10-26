import { useLayoutEffect, useRef } from 'react';
import { cents } from '../../services/dashboard-utils';

const group = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
function format(value: bigint) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}$${group.format(absolute / 100n)}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function RaisedAmount({ value, viewKey }: { value: string; viewKey: string }) {
  const formatted = format(cents(value));
  const root = useRef<HTMLSpanElement>(null);
  const previous = useRef<{ key: string; value: string } | null>(null);
  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { key: viewKey, value: formatted };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const animate = !last || (last.key !== viewKey && last.value !== formatted);
    const animations: Animation[] = [];
    let started = false;
    const frame = requestAnimationFrame(() => { started = true; });
    if (animate && !motion.matches) {
      const oldDigits = (last?.value ?? '').replace(/\D/g, '');
      const tracks = root.current?.querySelectorAll<HTMLElement>('[data-raised-digit]') ?? [];
      tracks.forEach((track, index) => {
        const target = Number(track.dataset.raisedDigit);
        const source = Number(oldDigits[oldDigits.length - tracks.length + index] ?? '0');
        animations.push(track.animate([
          { transform: `translateY(-${source}em)` },
          { transform: `translateY(-${10 + target}em)` },
        ], { duration: 1050, delay: 90 + index * 35, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
      });
    }
    const stop = () => { if (motion.matches) animations.forEach(animation => animation.cancel()); };
    motion.addEventListener('change', stop);
    return () => {
      cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel());
      motion.removeEventListener('change', stop);
      if (!started) previous.current = last;
    };
  }, [formatted, viewKey]);
  const digits = (text: string, prefix: string) => [...text].map((character, index) => /\d/.test(character)
    ? <span className="dashboard-raised__digit" key={`${prefix}-${text.length - index}`}><span className="dashboard-raised__digit-track" data-raised-digit={character} style={{ transform: `translateY(-${character}em)` }}>{Array.from({ length: 20 }, (_, digit) => <span key={digit}>{digit % 10}</span>)}</span></span>
    : <span key={`${prefix}-symbol-${index}`}>{character}</span>);
  const [whole, fraction] = formatted.split('.');
  return <p className="dashboard-raised__amount"><span className="sr-only">Total raised in USD: {formatted}</span><span ref={root} className="dashboard-raised__amount-visual" aria-hidden="true">{digits(whole, 'whole')}<span className="dashboard-raised__fraction">.{digits(fraction, 'fraction')}</span></span></p>;
}
