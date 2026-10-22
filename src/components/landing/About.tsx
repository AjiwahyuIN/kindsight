import { useRef } from 'react';
import { useAboutMotion } from '../../hooks/useAboutMotion';
import { useAbout } from '../../queries/about';
import { StatCard } from '../ui/StatCard';
import { HeadingLines, GridBackground } from './LandingSectionParts';
import { useSectionScenario, SectionDataState } from './SectionDataState';
import horizontal from '../../assets/about/grid-horizontal.svg';
import vertical from '../../assets/about/grid-vertical.svg';
import cards from '../../assets/about/grid-cards.svg';
import top from '../../assets/about/fade-top.svg';
import bottom from '../../assets/about/fade-bottom.svg';
import marker from '../../assets/about/section-marker.svg';
import '../../styles/components/_about.scss';
export function About() {
  const query = useAbout(useSectionScenario('about'));
  const content = query.data;
  const root = useRef<HTMLElement>(null);
  useAboutMotion(root, Boolean(content?.statistics.length));
  return <section ref={root} id="about" className="about" lang="en" aria-labelledby={content ? 'about-title' : undefined} aria-label={content ? undefined : 'About Kindsight'}>
    <GridBackground section="about" horizontal={horizontal} vertical={vertical} cards={cards} top={top} bottom={bottom} />
    <div className="about__content container"><SectionDataState name="About" query={query} />{content && <>
      <div className="about__header"><p className="about__label"><img src={marker} alt="" aria-hidden="true" /><span>{content.label}</span></p><h2 id="about-title" className="about__title" aria-label={content.heading.join(' ')}><HeadingLines lines={content.heading} section="about" /></h2><p className="about__description">{content.description}</p></div>
      <div className="about__statistics-stage"><div className="about__statistics-panel" aria-hidden="true" /><dl className="about__statistics" aria-label="Kindsight at a glance">{content.statistics.map(stat => <StatCard key={stat.id} {...stat} />)}</dl></div>
    </>}</div>
  </section>;
}
