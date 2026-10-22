import { getHeroContent } from '../services/landing.js';

export async function initHero(root, { requestDemo }) {
  if (!root) return;

  const dialog = document.querySelector('[data-hero-dialog]');
  const previous = dialog.querySelector('[data-hero-previous]');
  const next = dialog.querySelector('[data-hero-next]');
  const title = dialog.querySelector('[data-hero-step-title]');
  const description = dialog.querySelector('[data-hero-step-description]');
  const count = dialog.querySelector('[data-hero-step-count]');
  const overviewTrigger = root.querySelector('[data-hero-overview]');
  let steps = [];
  let index = 0;

  function renderStep() {
    title.textContent = steps[index].title;
    description.textContent = steps[index].description;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    previous.disabled = index === 0;
    next.querySelector('.button__label').textContent = index === steps.length - 1 ? 'Done' : 'Next';
  }

  root.querySelector('[data-hero-demo]').addEventListener('click', event => requestDemo(event.currentTarget));
  overviewTrigger.disabled = true;
  try {
    const data = await getHeroContent();
    root.querySelectorAll('[data-hero-text]').forEach(element => {
      element.textContent = data[element.dataset.heroText];
    });
    root.querySelector('#hero-title').setAttribute('aria-label', `${data.heading} ${data.connector} ${data.highlight}`);
    root.querySelector('[data-hero-demo] .button__label').textContent=data.demoLabel;
    overviewTrigger.querySelector('.button__label').textContent=data.overviewLabel;
    steps = data.overview;
    overviewTrigger.disabled = false;
  } catch {
    const notice = root.querySelector('[data-hero-notice]');
    notice.textContent = 'Saved Hero content could not be loaded. Showing default copy; reload to try again. The overview is unavailable.';
    notice.hidden = false;
  }

  overviewTrigger.addEventListener('click', () => {
    index = 0;
    renderStep();
    dialog.showModal();
  });
  previous.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    renderStep();
    if (previous.disabled) next.focus();
  });
  next.addEventListener('click', () => {
    if (index === steps.length - 1) dialog.close();
    else { index += 1; renderStep(); }
  });
  dialog.querySelector('[data-hero-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => overviewTrigger.focus());
}
