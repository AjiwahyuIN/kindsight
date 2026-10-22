import { useMissions } from '../../queries/missions';
import { Fragment, useLayoutEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { useMissionsMotion } from '../../hooks/useMissionsMotion';
import { SectionLabel, EndBackground } from './LandingSectionParts';
import { useSectionScenario, SectionDataState } from './SectionDataState';
import horizontal from '../../assets/missions/41c40.svg';
import vertical from '../../assets/missions/39007.svg';
import photo from '../../assets/missions/165b2.png';
import pointer from '../../assets/missions/9a65f.svg';
import '../../styles/components/_landing-end.scss';
// Both strokes and the marker share the same 200-degree circular path.
const gaugePath = 'M26.807877 163.664133 A119 119 0 1 1 261.192123 163.664133';
export function Missions({ children }: { children?: ReactNode }) {
  const query = useMissions(useSectionScenario('missions'));
  const content = query.data;
  const root = useRef<HTMLElement>(null);
  useMissionsMotion(root, Boolean(content), content?.growth ?? '');
  const percent = content?.growth.match(/^(\d{1,3}(?:\.\d{1,2})?)%$/);
  const pointerAngle = percent && Number(percent[1]) <= 100 ? Number(percent[1]) * 2 : 100;
  const emphasisWords = content?.emphasis.split(/\s+/) ?? [];
  useLayoutEffect(() => {
    const title = root.current?.querySelector<HTMLElement>('.missions__title');
    const section = root.current;
    const header = section?.querySelector<HTMLElement>('.missions__header');
    const container = section?.querySelector<HTMLElement>('.missions__content');
    if (!title || !section || !header || !container) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const words = [...title.querySelectorAll<HTMLElement>('.missions__title-word')];
      const positions = words.map(word => word.offsetTop);
      const lines = [...new Set(positions)].sort((a, b) => a - b);
      // Keep the decorative divider below the header at every viewport height.
      const dividerTop = header.getBoundingClientRect().bottom - section.getBoundingClientRect().top + 16;
      words.forEach((word, i) => word.style.setProperty('--missions-title-line', String(lines.indexOf(positions[i]) / Math.max(1, lines.length - 1))));
      section.style.setProperty('--missions-grid-horizontal-top', `${dividerTop}px`);
      section.closest<HTMLElement>('.missions-scene')?.style.setProperty('--missions-grid-horizontal-top', `${dividerTop}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(title);
    observer.observe(container);
    observer.observe(section);
    void document.fonts.ready.then(measure);
    return () => { active = false; observer.disconnect(); section.style.removeProperty('--missions-grid-horizontal-top'); section.closest<HTMLElement>('.missions-scene')?.style.removeProperty('--missions-grid-horizontal-top'); };
  }, [content?.heading]);
  return <div className="missions-scene"><section ref={root} id="missions" className="missions" lang="en" aria-labelledby={content ? 'missions-title' : undefined} aria-label={content ? undefined : 'Missions'}><div className="missions__surface"><EndBackground horizontal={horizontal} vertical={vertical} /></div><div className="container missions__content"><SectionDataState name="Missions" query={query} />{content && <>
    <div className="missions__header"><SectionLabel>{content.label}</SectionLabel><h2 id="missions-title" className="missions__title">{content.heading.split(/\s+/).map((word, i) => <Fragment key={i}>{i > 0 && <>{word.startsWith('(') && <br className="missions__title-break" />}{' '}</>}<span className="missions__title-word"><span>{word}</span></span></Fragment>)}</h2></div>
    <div className="missions__body"><div className="missions__copy"><p className="missions__description"><span>{content.introduction.trim()}</span>{' '}<strong className="missions__emphasis">{emphasisWords.map((word, i) => <Fragment key={i}>{i > 0 && ' '}<span className="missions__fill-word" style={{ '--missions-fill-order': i / Math.max(1, emphasisWords.length - 1) } as CSSProperties}>{word}</span></Fragment>)}</strong></p><div className="missions__benefits">{content.benefits.map((benefit, index) => <div className="missions__benefit" key={benefit.icon}><div className={`missions__icon${index === 1 ? ' missions__icon--peach' : ''}`}><img src={benefit.icon} alt="" aria-hidden="true" /></div><p>{benefit.description}</p></div>)}</div></div>
      <figure className="missions__visual" role="img" aria-label={`People working together to support their community. Illustrative donor metrics: ${content.donors} plus donors and ${content.growth} growth; sample data.`}><img className="missions__photo" src={photo} alt="" loading="lazy" /><div className="missions__metric" aria-hidden="true"><div className="missions__metric-heading"><p className="missions__donors"><span>{content.donors}</span><span>+</span></p><p>{content.donorLabel}</p></div><div className="missions__gauge">
        <svg className="missions__dial" viewBox="0 0 288 186" aria-hidden="true">
          <path className="missions__gauge-track" d={gaugePath} />
          <path className="missions__gauge-fill" d={gaugePath} pathLength="100" strokeDasharray="100" strokeDashoffset={100 - pointerAngle / 2} />
          <g className="missions__pointer-orbit" transform={`rotate(${pointerAngle} 144 143)`}>
            <circle className="missions__gauge-hub" cx="26.807877" cy="163.664133" r="10.5" />
            <image href={pointer} x="22.782182" y="159.638563" width="8.05139" height="8.05114" transform="rotate(-10 26.807877 163.664133)" />
          </g>
        </svg>
        <div className="missions__gauge-copy"><strong>{percent ? <><span key={content.growth} className="missions__growth-value" style={{ width: `${percent[1].length}ch` }}>{percent[1]}</span>%</> : content.growth}</strong><p>{content.growthLabel}</p></div></div></div></figure>
    </div>
  </>}</div></section><div className="missions-scene__hold" aria-hidden="true" />{children}</div>;
}
