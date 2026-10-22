import { Fragment, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Accordion } from '../ui/Accordion';
import { Button } from '../ui/Button';
import { StatusMessage } from '../ui/StatusMessage';
import { useDifference } from '../../queries/difference';
import type { SampleScenario } from '../../services/types';
import horizontal from '../../assets/difference/grid-horizontal.svg';
import vertical from '../../assets/difference/grid-vertical.svg';
import fade from '../../assets/difference/edge-fade.svg';
import dot from '../../assets/difference/insight-dot.svg';
import community from '../../assets/difference/community.svg';
import '../../styles/components/_difference.scss';
import { useDifferenceMotion } from '../../hooks/useDifferenceMotion';

export function Difference() {
  const [params] = useSearchParams();
  const raw = params.get('differenceState');
  const scenario: SampleScenario = raw === 'empty' || raw === 'error' ? raw : 'success';
  const query = useDifference(scenario);
  const content = query.data;
  const root = useRef<HTMLElement>(null);
  useDifferenceMotion(root, Boolean(content));
  return <section id="difference" className="difference" lang="en" ref={root} aria-labelledby={content ? 'difference-title' : undefined} aria-label={content ? undefined : 'The Kindsight difference'}>
    <div className="difference__background" aria-hidden="true">
      <div className="difference__grid-horizontal"><img src={horizontal} alt="" /></div>
      <div className="difference__grid-vertical"><img src={vertical} alt="" /></div>
      <div className="difference__fade difference__fade--top"><img src={fade} alt="" /></div>
      <div className="difference__fade difference__fade--bottom"><img src={fade} alt="" /></div>
    </div>
    <div className="difference__content container">
      {query.isPending && <StatusMessage kind="loading">Loading Difference content…</StatusMessage>}
      {query.isError && <StatusMessage kind="error" action={<Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry Difference</Button>}>{query.error.message}</StatusMessage>}
      {query.isSuccess && !content && <StatusMessage kind="empty">No Difference content is available in this sample scenario.</StatusMessage>}
      {content && <>
        <div className="difference__header"><h2 id="difference-title" className="difference__title" aria-label={content.heading.join(' ')}>{content.heading.map((line, index) => <Fragment key={index}>{index > 0 && <><br className="difference__title-break" />{' '}</>}<span>{line}</span></Fragment>)}</h2><p className="difference__label">{content.label}</p></div>
        <div className="difference__body">
          <Accordion items={content.items} label={content.label} defaultIcon={community} />
          <figure className="difference__illustration" role="img" aria-label={`Illustrative ${content.insight.title}: ${content.insight.metrics.map(metric => `${metric.label} ${metric.value}`).join(', ')}. Example counts, not live data.`}>
            <div className="difference__insight" aria-hidden="true">
              <p className="difference__insight-title"><img src={dot} alt="" /><span>{content.insight.title}</span></p>
              <div className="difference__metrics">{content.insight.metrics.map(metric => <div className="difference__metric" key={metric.id}><img src={metric.icon} alt="" /><span className="difference__metric-label">{metric.label}</span><span className="difference__metric-value">{metric.value}</span></div>)}</div>
            </div>
          </figure>
        </div>
      </>}
    </div>
  </section>;
}
