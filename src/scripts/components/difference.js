import { getDifferenceContent } from '../services/difference.js';
import { initAccordion } from './accordion.js';

export async function initDifference(root) {
  if (!root) return;
  try {
    const content = await getDifferenceContent();
    root.querySelector('[data-difference-label]').textContent = content.label;
    root.querySelectorAll('[data-difference-heading]').forEach((element, index) => {
      element.textContent = content.heading[index];
    });
    const accordion=root.querySelector('[data-accordion]');
    accordion.setAttribute('aria-label',content.label);
    content.items.forEach((item,index) => {
      const element=[...accordion.querySelectorAll('[data-accordion-item]')].find(element=>element.dataset.accordionItem===item.id);
      if (!element) return;
      accordion.append(element);
      const open=index===0;
      element.dataset.open=String(open);
      element.querySelector('[data-accordion-trigger]').setAttribute('aria-expanded',String(open));
      element.querySelector('[data-accordion-panel]').hidden=!open;
      element.querySelector('[data-accordion-title]').textContent = item.title;
      element.querySelector('[data-accordion-description]').textContent = item.description;
    });
    root.querySelector('[data-difference-insight-title]').textContent = content.insight.title;
    root.querySelectorAll('[data-difference-metric]').forEach(element => {
      const metric = content.insight.metrics.find(metric => metric.id === element.dataset.differenceMetric);
      if (!metric) return;
      element.querySelector('[data-difference-metric-label]').textContent = metric.label;
      element.querySelector('[data-difference-metric-value]').textContent = metric.value;
    });
    root.querySelector('[data-difference-illustration]').setAttribute('aria-label',
      `Illustrative ${content.insight.title}: ${content.insight.metrics.map(metric => `${metric.label} ${metric.value}`).join(', ')}. Example counts, not live data.`);
  } catch {
    const notice=root.querySelector('[data-difference-notice]');
    notice.textContent='Saved difference content could not be loaded. Showing default content; reload to try again.';
    notice.hidden=false;
  }
  initAccordion(root.querySelector('[data-accordion]'));
}
