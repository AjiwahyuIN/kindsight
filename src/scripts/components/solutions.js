import { getSolutionsContent } from '../services/solutions.js';

export async function initSolutions(root) {
  if (!root) return;
  const dialog = document.querySelector('[data-solutions-dialog]');
  let returnFocus;

  try {
    const content = await getSolutionsContent();
    root.querySelector('[data-solutions-label]').textContent = content.label;
    root.querySelectorAll('[data-solutions-heading]').forEach((element, index) => {
      element.textContent = content.heading[index];
    });
    root.querySelector('[data-solutions-description]').textContent = content.description;
    root.querySelectorAll('[data-solution]').forEach(element => {
      const product = content.products.find(product => product.id === element.dataset.solution);
      if (!product) return;
      element.querySelector('[data-solution-title]').textContent = product.title;
      element.querySelector('[data-solution-description]').textContent = product.description;
      element.querySelector('[data-solution-icon]').src = product.icon;
      const trigger = element.querySelector('[data-solution-learn]');
      if (trigger) {
        trigger.querySelector('.button__label').textContent = product.cta;
        trigger.setAttribute('aria-label', `Learn more about ${product.title}`);
      }
      if (product.image) {
        const image = element.querySelector('[data-solution-photo]');
        image.src = product.image.src;
        image.alt = product.image.alt;
        element.querySelector('[data-solution-badge-value]').textContent = product.image.badge.value;
        element.querySelector('[data-solution-badge-label]').textContent = product.image.badge.label;
        element.querySelector('[data-solution-badge-detail]').textContent = product.image.badge.detail;
      }
    });
    for (const field of ['title', 'description', 'note']) {
      dialog.querySelector(`[data-solutions-overview-${field}]`).textContent = content.overview[field];
    }
    dialog.querySelectorAll('[data-solutions-topic]').forEach((element, index) => {
      const topic = content.overview.topics[index];
      element.querySelector('[data-solutions-topic-title]').textContent = topic.title;
      element.querySelector('[data-solutions-topic-description]').textContent = topic.description;
    });
  } catch {
    // The initial Pug content and sample overview remain usable on service failure.
  }

  root.addEventListener('click', event => {
    const trigger = event.target.closest('[data-solution-learn]');
    if (!trigger || !root.contains(trigger)) return;
    returnFocus = trigger;
    dialog.showModal();
  });
  dialog.querySelector('[data-solutions-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus());
}
