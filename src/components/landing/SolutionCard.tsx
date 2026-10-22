import { Button } from '../ui/Button';
import type { SolutionProduct } from '../../services/landing-sections-types';
import caret from '../../assets/solutions/caret-right.svg';
import gem from '../../assets/solutions/gem.svg';
import '../../styles/components/_solution-card.scss';
export function SolutionCard({ product, onLearn }: { product: SolutionProduct; onLearn: (trigger: HTMLButtonElement) => void }) {
  return <article className={`solution-card${product.featured ? ' solution-card--featured' : ''}`} data-solution={product.id} aria-labelledby={`solution-${product.id}-title`}>
    <div className="solution-card__content"><div className="solution-card__icon" aria-hidden="true"><span className="solution-card__icon-slot"><img className={`solution-card__symbol--${product.id}`} src={product.icon} alt="" /></span></div>
      <div className="solution-card__details"><div className="solution-card__copy"><h3 className="solution-card__title" id={`solution-${product.id}-title`}>{product.title}</h3><p className="solution-card__description">{product.description}</p></div>
        {product.cta && <Button className="solution-card__cta" aria-label={`Learn more about ${product.title}`} aria-haspopup="dialog" aria-controls="solution-overview" endIcon={<img src={caret} alt="" aria-hidden="true" />} onClick={event => onLearn(event.currentTarget)}>{product.cta}</Button>}
      </div>
    </div>
    {product.image && <div className="solution-card__visual"><img className="solution-card__photo" src={product.image.src} alt={product.image.alt} width={772} height={1024} loading="lazy" decoding="async" /><div className="solution-card__badge"><img src={gem} alt="" aria-hidden="true" /><p className="solution-card__badge-copy"><strong>{product.image.badge.value}</strong>{' '}<span>{product.image.badge.label}</span><br /><span>{product.image.badge.detail}</span></p></div></div>}
  </article>;
}
