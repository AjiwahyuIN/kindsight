import type { CSSProperties } from 'react';
import type { SectorCard, SectorsContent } from '../../services/landing-sections-types';
import healthcare from '../../assets/sectors/Frame 594.png';
import education from '../../assets/sectors/Frame 553.png';
import plus from '../../assets/sectors/badba.svg';
import arrow from '../../assets/sectors/f9b89.svg';
import learn from '../../assets/sectors/5f810.svg';

const photos: Record<string, string> = { healthcare, education };

export function SectorMorphCard({ card, index, content, onExplore }: {
  card: SectorCard; index: number; content: SectorsContent;
  onExplore: (card: SectorCard, trigger: HTMLButtonElement) => void;
}) {
  const match = content.percentage.match(/^(\d{1,3}(?:\.\d{1,2})?)%$/);
  const percentage = match && Number(match[1]) <= 100 ? Number(match[1]) : 0;
  return <div className={`sector-card-column sector-morph${index === 1 ? ' sector-morph--top' : ''}`} style={{ '--sector-active': index === 0 ? 1 : 0 } as CSSProperties}>
    <span className="sector-card-column__number sector-morph__number" aria-hidden="true"><span className="sector-morph__number-reveal">{String(index + 1).padStart(2, '0')}</span></span>
    <article className="sector-card sector-morph__card" aria-labelledby={`sector-${card.id}-title`}>
      <div className="sector-morph__body" aria-hidden="true" />
      <div className="sector-morph__photo"><img src={photos[card.id] ?? card.image} alt="" loading="lazy" decoding="async" /></div>
      <h3 id={`sector-${card.id}-title`} className="sector-morph__title"><span className="sector-morph__title-reveal">{card.title}</span></h3>
      <button className="sector-morph__open" type="button" aria-label={`Explore ${card.title}`} aria-haspopup="dialog" onClick={event => onExplore(card, event.currentTarget)}>
        <img className="sector-morph__plus" src={card.icon ?? plus} alt="" /><img className="sector-morph__arrow" src={arrow} alt="" />
      </button>
      <p className="sector-morph__description"><span className="sector-morph__description-reveal">{card.description}</span></p>
      <div className="sector-feature__metrics sector-morph__metrics" inert={index !== 0} aria-hidden={index !== 0} role="group" aria-label="Illustrative sample metrics"><div className="sector-morph__metrics-reveal">
        <p className="sector-feature__label">Total Donation</p><p className="sector-feature__amount"><span className="sector-morph__static-value">{content.donation}</span><span key={content.donation} className="sector-morph__amount-value" aria-hidden="true">{content.donation}</span></p>
        <div className="sector-feature__bar" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
        <div className="sector-feature__caption"><span>{content.volunteers}</span><span className="sector-morph__percentage"><span className="sector-morph__static-value">{content.percentage}</span><span key={content.percentage} className="sector-morph__percentage-value" aria-hidden="true">{content.percentage}</span></span></div>
        <button className="sector-feature__learn" type="button" aria-haspopup="dialog" aria-label={`Learn more about ${card.title}`} onClick={event => onExplore(card, event.currentTarget)}>Learn More<img src={learn} alt="" /></button>
      </div></div>
    </article>
  </div>;
}
