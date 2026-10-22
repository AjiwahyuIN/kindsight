import { useTestimonialsMotion } from '../../hooks/useTestimonialsMotion';
import { Fragment, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { useTestimonials } from '../../queries/testimonials';
import type { TestimonialsContent } from '../../services/landing-sections-types';
import { Button } from '../ui/Button';
import { useSectionScenario, SectionDataState } from './SectionDataState';
import top from '../../assets/testimonial/corner-top.svg';
import bottom from '../../assets/testimonial/corner-bottom.svg';
import rule from '../../assets/testimonial/rule.svg';
import dot from '../../assets/testimonial/label-dot.svg';
import stars from '../../assets/testimonial/stars.svg';
import previousIcon from '../../assets/testimonial/arrow-previous.svg';
import nextIcon from '../../assets/testimonial/arrow-next.svg';
import quote from '../../assets/testimonial/quote.svg';
import '../../styles/components/_testimonial.scss';
function Ornament({ corner }: { corner: string }) {
  return <div className="testimonial__ornament" aria-hidden="true"><img src={corner} alt="" /><span className="testimonial__rule"><img src={rule} alt="" /></span><img src={corner} alt="" /></div>;
}
type StoryTransition = { from: number; to: number; direction: 1 | -1 };
const slideClass = (current: boolean) => `testimonial__slide${current ? ' testimonial__slide--current' : ''}`;
function Stories({ content }: { content: TestimonialsContent }) {
  const [selected, setSelected] = useState(0);
  const [announced, setAnnounced] = useState<number | null>(null);
  const [transition, setTransition] = useState<StoryTransition | null>(null);
  const inFlight = useRef<StoryTransition | null>(null);
  const index = Math.min(selected, content.stories.length - 1);
  const announcedStory = announced === null ? undefined : content.stories[announced];
  const carousel = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLButtonElement>(null), next = useRef<HTMLButtonElement>(null);
  const quoteText = useRef<HTMLQuoteElement>(null);
  useLayoutEffect(() => {
    const group = quoteText.current;
    if (!group) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      // All stories participate in grid sizing. Measure every paragraph before
      // writing, so both scroll reveal and carousel use its actual wrapped lines.
      const lines = [...group.querySelectorAll('p')].map(paragraph => {
        const words = [...paragraph.querySelectorAll<HTMLElement>('.testimonial__quote-word')];
        const positions = words.map(word => word.offsetTop);
        const tops = [...new Set(positions)].sort((a, b) => a - b);
        return words.map((word, wordIndex) => ({ word, ratio: tops.indexOf(positions[wordIndex]) / Math.max(1, tops.length - 1) }));
      });
      lines.flat().forEach(({ word, ratio }) => {
        word.style.setProperty('--testimonial-quote-line', String(ratio));
        word.dataset.lineRatio = String(ratio);
      });
    };
    measure();
    void document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => { active = false; observer.disconnect(); };
  }, [content.stories]);
  useLayoutEffect(() => {
    if (!transition || !carousel.current) return;
    const { from, to, direction } = transition;
    if (!content.stories[from] || !content.stories[to]) {
      inFlight.current = null;
      setTransition(null);
      setAnnounced(null);
      return;
    }
    inFlight.current = transition;
    const host = carousel.current;
    const part = (storyIndex: number, name: string) => host.querySelectorAll<HTMLElement>(`[data-story-index="${storyIndex}"][data-story-part="${name}"]`);
    const oldQuote = part(from, 'quote'), newQuote = part(to, 'quote');
    const oldWords = oldQuote[0].querySelectorAll('.testimonial__quote-motion');
    const newWords = newQuote[0].querySelectorAll('.testimonial__quote-motion');
    const oldPhoto = part(from, 'portrait'), newPhoto = part(to, 'portrait');
    const oldMeta = part(from, 'meta'), newMeta = part(to, 'meta');
    const oldCount = part(from, 'count'), newCount = part(to, 'count');
    let active = true;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeline: gsap.core.Timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => {
        if (!active) return;
        inFlight.current = null;
        setTransition(null);
        setAnnounced(to);
      } });
      const lineStagger = (_word: number, element: HTMLElement) => Number(element.closest<HTMLElement>('.testimonial__quote-word')?.dataset.lineRatio ?? 0) * 0.2;
      gsap.set([oldQuote, newQuote, oldPhoto, newPhoto, oldMeta, newMeta, oldCount, newCount], { autoAlpha: 1 });
      gsap.set(oldPhoto, { zIndex: 1 });
      gsap.set(newPhoto, { zIndex: 2 });
      timeline.to(oldWords, { yPercent: -110 * direction, opacity: 0, duration: 0.38, stagger: lineStagger }, 0)
        .fromTo(newWords, { yPercent: 110 * direction, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: lineStagger }, 0.55)
        .to(oldPhoto[0].querySelector('img'), { xPercent: -10 * direction, scale: 1.02, duration: 1.05 }, 0.16)
        .fromTo(newPhoto, { clipPath: direction === 1 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', xPercent: 8 * direction }, { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, duration: 1.1 }, 0.16)
        .fromTo(newPhoto[0].querySelector('img'), { scale: 1.05, xPercent: 0 }, { scale: 1, duration: 1.25, ease: 'power2.out' }, 0.16)
        .to(oldMeta, { autoAlpha: 0, y: -8 * direction, duration: 0.25, stagger: 0.025 }, 0.08)
        .fromTo(newMeta, { autoAlpha: 0, y: 12 * direction }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.72)
        .to(oldCount, { yPercent: -110 * direction, duration: 0.65 }, 0.3)
        .fromTo(newCount, { yPercent: 110 * direction }, { yPercent: 0, duration: 0.8 }, 0.3);
    }, host);
    // Resolve to the chosen story if wrapping/breakpoints or motion preferences
    // change mid-transition; no abandoned transform or delayed state update.
    const finish = () => timeline.progress(1);
    window.addEventListener('resize', finish);
    motion.addEventListener('change', finish);
    return () => {
      active = false;
      window.removeEventListener('resize', finish);
      motion.removeEventListener('change', finish);
      context.revert();
      inFlight.current = null;
    };
  }, [transition, content.stories]);
  const focusAfterRender = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    focusAfterRender.current?.focus({ preventScroll: true });
    focusAfterRender.current = null;
  }, [index]);
  function navigate(target: number, trigger: HTMLButtonElement | null) {
    if (inFlight.current || target < 0 || target >= content.stories.length || target === index) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAnnounced(target);
    else {
      const change: StoryTransition = { from: index, to: target, direction: target > index ? 1 : -1 };
      inFlight.current = change;
      setTransition(change);
    }
    setSelected(target);
    if (target === 0 && (trigger === previous.current || document.activeElement === previous.current)) focusAfterRender.current = next.current;
    if (target === content.stories.length - 1 && (trigger === next.current || document.activeElement === next.current)) focusAfterRender.current = previous.current;
  }
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' || !event.isPrimary || (event.target as Element).closest('button, a') || inFlight.current) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const x = event.clientX - start.x, y = event.clientY - start.y;
    if (Math.abs(x) >= 48 && Math.abs(x) > Math.abs(y) * 1.4) navigate(index + (x < 0 ? 1 : -1), null);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let target: number;
    switch (event.key) {
      case 'ArrowLeft': target = index - 1; break;
      case 'ArrowRight': target = index + 1; break;
      case 'Home': target = 0; break;
      case 'End': target = content.stories.length - 1; break;
      default: return;
    }
    event.preventDefault(); navigate(target, event.target as HTMLButtonElement);
  }
  return <>
    <div ref={carousel} className="testimonial__content testimonial__carousel" aria-busy={Boolean(transition)}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
      <div className="testimonial__left">
        <div className="testimonial__intro">
          <h2 id="testimonial-title" className="testimonial__heading"><img src={dot} alt="" aria-hidden="true" /><span>{content.heading}</span></h2>
          <p className="testimonial__description">{content.introduction}</p>
        </div>
        <div className="testimonial__identity">
          <div className="testimonial__author">
            <div className="testimonial__portrait">
              <div className="testimonial__portrait-reveal testimonial__stack">
                {content.stories.map((story, i) => <div key={story.id} className={`${slideClass(i === index)} testimonial__portrait-slide`} data-story-index={i} data-story-part="portrait" aria-hidden={i !== index}>
                  <img src={story.image} alt={story.imageAlt} width={1200} height={784} loading="lazy" decoding="async" draggable={false} />
                </div>)}
              </div>
            </div>
            <div className="testimonial__meta">
              <div className="testimonial__byline">
                <div className="testimonial__rating">
                  <span className="testimonial__stack">{content.stories.map((story, i) =>
                    <span key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="meta" aria-hidden={i !== index}>{story.rating}</span>)}
                  </span>
                  <img src={stars} alt="" aria-hidden="true" />
                </div>
                <p className="testimonial__name testimonial__stack">{content.stories.map((story, i) =>
                  <span key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="meta" aria-hidden={i !== index}>{story.name}</span>)}
                </p>
              </div>
              <p className="testimonial__count">
                <span className="testimonial__counter testimonial__stack">{content.stories.map((story, i) =>
                  <span key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="count" aria-hidden={i !== index}>{String(i + 1).padStart(2, '0')}</span>)}
                </span>/{String(content.stories.length).padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="testimonial__controls" role="group" aria-label="Story navigation" onKeyDown={onKeyDown}>
            <Button variant="light" size="sm" ref={previous} className="testimonial__arrow testimonial__arrow--previous"
              aria-label="Previous testimonial" aria-disabled={Boolean(transition) || index === 0} disabled={index === 0}
              onClick={event => navigate(index - 1, event.currentTarget)} icon={<img src={previousIcon} alt="" aria-hidden="true" />} />
            <Button variant="light" size="sm" ref={next} className="testimonial__arrow"
              aria-label="Next testimonial" aria-disabled={Boolean(transition) || index === content.stories.length - 1} disabled={index === content.stories.length - 1}
              onClick={event => navigate(index + 1, event.currentTarget)} icon={<img src={nextIcon} alt="" aria-hidden="true" />} />
          </div>
        </div>
      </div>
      <div className="testimonial__story">
        <div className="testimonial__story-heading">
          <img src={quote} alt="" aria-hidden="true" />
          <p className="testimonial__period testimonial__stack">{content.stories.map((story, i) =>
            <span key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="meta" aria-hidden={i !== index}>{story.period}</span>)}
          </p>
        </div>
        <div className="testimonial__quote-group">
          <blockquote ref={quoteText} className="testimonial__quote testimonial__stack">
            {content.stories.map((story, i) => <p key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="quote" aria-hidden={i !== index}>
              {story.quote.split(/\s+/).map((word, wordIndex) => <Fragment key={wordIndex}>{wordIndex > 0 && ' '}
                <span className="testimonial__quote-word"><span><span className="testimonial__quote-motion">{word}</span></span></span>
              </Fragment>)}
            </p>)}
          </blockquote>
          <p className="testimonial__tagline testimonial__stack">{content.stories.map((story, i) =>
            <span key={story.id} className={slideClass(i === index)} data-story-index={i} data-story-part="meta" aria-hidden={i !== index}>{story.tagline}</span>)}
          </p>
        </div>
      </div>
    </div>
    <p className="testimonial__announcement" role="status" aria-atomic="true">{announcedStory && announced !== null ? `Story ${announced + 1} of ${content.stories.length}. ${announcedStory.name}. ${announcedStory.period}. ${announcedStory.quote}` : ''}</p>
  </>;
}
export function Testimonials() {
  const scenario = useSectionScenario('testimonials');
  const query = useTestimonials(scenario);
  const content = query.data;
  const available = content && content.stories.length > 0;
  const root = useRef<HTMLElement>(null);
  useTestimonialsMotion(root, Boolean(available));
  return <section ref={root} id="testimonials" className="testimonial testimonial--viewport" lang="en" aria-roledescription="carousel" aria-labelledby={available ? 'testimonial-title' : undefined} aria-label={available ? undefined : 'Testimonials'}><div className="testimonial__panel"><div className="testimonial__handoff-top"><Ornament corner={top} /></div><SectionDataState name="Testimonials" query={query} empty={content?.stories.length === 0} />{available && <Stories key={scenario} content={content} />}<div className="testimonial__handoff-rule"><Ornament corner={bottom} /></div></div></section>;
}
