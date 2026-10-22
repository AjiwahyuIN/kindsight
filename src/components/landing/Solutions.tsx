import { useRef, useState } from 'react';
import { useSolutionsMotion } from '../../hooks/useSolutionsMotion';
import { useSolutions } from '../../queries/solutions';
import type { SolutionsContent } from '../../services/landing-sections-types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { SolutionCard } from './SolutionCard';
import { HeadingLines, GridBackground } from './LandingSectionParts';
import { useSectionScenario, SectionDataState } from './SectionDataState';
import horizontal from '../../assets/solutions/grid-horizontal.svg';
import vertical from '../../assets/solutions/grid-vertical.svg';
import cards from '../../assets/solutions/grid-cards.svg';
import fade from '../../assets/solutions/edge-fade.svg';
import marker from '../../assets/solutions/section-marker.svg';
import '../../styles/components/_solutions.scss';
export function Solutions() {
  const query = useSolutions(useSectionScenario('solutions'));
  const content = query.data;
  const root = useRef<HTMLElement>(null);
  useSolutionsMotion(root, Boolean(content?.products.length));
  const [overview, setOverview] = useState<SolutionsContent['overview'] | null>(null);
  const trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  return <>
    <section ref={root} id="solutions" className="solutions" lang="en" aria-labelledby={content ? 'solutions-title' : undefined} aria-label={content ? undefined : 'Solutions'}>
      <GridBackground section="solutions" horizontal={horizontal} vertical={vertical} cards={cards} top={fade} />
      <div className="solutions__content container"><SectionDataState name="Solutions" query={query} />{content && <>
        <div className="solutions__header"><p className="solutions__label"><img src={marker} alt="" aria-hidden="true" /><span>{content.label}</span></p><div className="solutions__intro"><h2 id="solutions-title" className="solutions__title" aria-label={content.heading.join(' ')}><HeadingLines lines={content.heading} section="solutions" /></h2><p className="solutions__description">{content.description}</p></div></div>
        <div className="solutions__stage"><div className="solutions__panel" aria-hidden="true" /><div className="solutions__cards">{content.products.map(product => <SolutionCard key={product.id} product={product} onLearn={element => { trigger.current = element; setOverview(content.overview); }} />)}</div></div>
      </>}</div>
    </section>
    <Dialog id="solution-overview" className="solutions-overview" lang="en" open={overview !== null} onClose={() => setOverview(null)} initialFocus={close} returnFocus={trigger} aria-labelledby="solution-overview-title" aria-describedby="solution-overview-description solution-overview-note">
      <div className="solutions-overview__header"><p className="solutions-overview__eyebrow">Kindsight / Solutions</p><Button variant="light" size="sm" ref={close} onClick={() => setOverview(null)}>Close</Button></div>
      <h2 id="solution-overview-title" className="solutions-overview__title">{overview?.title}</h2><p id="solution-overview-description" className="solutions-overview__description">{overview?.description}</p><ul className="solutions-overview__topics">{overview?.topics.map(topic => <li key={topic.title}><h3>{topic.title}</h3><p>{topic.description}</p></li>)}</ul><p id="solution-overview-note" className="solutions-overview__note">{overview?.note}</p>
    </Dialog>
  </>;
}
