import { getAboutContent } from '../services/about.js';

export async function initAbout(root) {
  if (!root) return;
  try {
    const content = await getAboutContent();
    root.querySelector('[data-about-label]').textContent = content.label;
    root.querySelectorAll('[data-about-heading]').forEach((element, index) => {
      element.textContent = content.heading[index];
    });
    root.querySelector('[data-about-description]').textContent = content.description;
    root.querySelectorAll('[data-stat-card]').forEach(element => {
      const statistic = content.statistics.find(statistic => statistic.id === element.dataset.statCard);
      if (!statistic) return;
      element.querySelector('[data-stat-label]').textContent = statistic.label;
      element.querySelector('[data-stat-value]').textContent = statistic.value;
      element.querySelector('[data-stat-suffix]').textContent = statistic.suffix;
    });
  } catch {
    // Preserve the complete Pug-rendered content if the service is unavailable.
  }
}
