import { SectorMorphCard } from './SectorMorphCard';
import { useSectorsMotion } from '../../hooks/useSectorsMotion';
import { Fragment, useRef, useState, type CSSProperties } from 'react';
import { useSectors } from '../../queries/sectors';
import type { SectorCard } from '../../services/landing-sections-types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { SectionLabel, EndBackground } from './LandingSectionParts';
import { useSectionScenario, SectionDataState } from './SectionDataState';
import horizontal from '../../assets/sectors/d4a90.svg';
import vertical from '../../assets/sectors/da6cb.svg';
import '../../styles/components/_landing-end.scss';
export function Sectors() {
  const query = useSectors(useSectionScenario('sectors'));
  const content = query.data;
  const emphasisWords = content?.emphasis.trim().split(/\s+/) ?? [];
  const root = useRef<HTMLElement>(null);
  useSectorsMotion(root, Boolean(content), content?.donation ?? '', content?.percentage ?? '');
  const [selected, setSelected] = useState<SectorCard | null>(null);
  const trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  function open(card: SectorCard, element: HTMLButtonElement) { trigger.current = element; setSelected(card); }
  return <>
    <div className="sectors-scene"><section ref={root} id="sectors" className="sectors" lang="en" aria-labelledby={content ? 'sectors-title' : undefined} aria-label={content ? undefined : 'Sectors'}><EndBackground horizontal={horizontal} vertical={vertical} /><div className="container sectors__content"><SectionDataState name="Sectors" query={query} />{content && <>
      <div className="sectors__header"><SectionLabel>{content.label}</SectionLabel><h2 id="sectors-title" className="sectors__title">{content.heading}</h2><p className="sectors__description"><strong className="sectors__emphasis">{emphasisWords.map((word, i) => <Fragment key={i}>{i > 0 && ' '}<span className="sectors__fill-word" style={{ '--sectors-fill-order': i / Math.max(1, emphasisWords.length - 1) } as CSSProperties}>{word}</span></Fragment>)}</strong>{' '}<span>{content.description.trim()}</span></p></div>
      <div className="sectors__cards-stage"><div className="sectors__cards-canvas" aria-hidden="true" /><div className="sectors__cards">{content.cards.map((card, index) => <SectorMorphCard key={card.id} card={card} index={index} content={content} onExplore={open} />)}</div><div className="sectors__cards-seams" aria-hidden="true"><span /><span /></div></div>
    </>}</div></section><div className="sectors-scene__hold" aria-hidden="true" /><div className="sectors-scene__cards-hold" aria-hidden="true" /><div className="sectors-scene__footer-hold" aria-hidden="true" /></div>
    <Dialog className="landing-preview" lang="en" open={selected !== null} onClose={() => setSelected(null)} initialFocus={close} returnFocus={trigger} aria-labelledby="sector-preview-title" aria-describedby="sector-preview-description sector-preview-note"><Button variant="light" size="sm" ref={close} onClick={() => setSelected(null)}>Close</Button><h2 id="sector-preview-title">{selected?.title}</h2><p id="sector-preview-description">{selected?.description}</p><p id="sector-preview-note">Sample sector overview. Donation and volunteer figures shown on the landing page are illustrative, not live reports.</p></Dialog>
  </>;
}
