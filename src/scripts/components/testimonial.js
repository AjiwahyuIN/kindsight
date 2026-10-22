import { getTestimonials } from '../services/testimonial.js';

export async function initTestimonial(root) {
  if (!root) return;
  const previous = root.querySelector('[data-testimonial-previous]');
  const next = root.querySelector('[data-testimonial-next]');
  const count = root.querySelector('[data-testimonial-count]');
  const announcement = root.querySelector('[data-testimonial-announcement]');
  let stories = [];
  let index = 0;

  function render(announce = false) {
    const story = stories[index];
    for (const key of ['name', 'rating', 'period', 'quote', 'tagline']) {
      root.querySelector(`[data-testimonial-${key}]`).textContent = story[key];
    }
    const photo = root.querySelector('[data-testimonial-photo]');
    photo.src = story.image;
    photo.alt = story.imageAlt;
    count.textContent = `${String(index + 1).padStart(2, '0')}/${String(stories.length).padStart(2, '0')}`;
    previous.disabled = index === 0;
    next.disabled = index === stories.length - 1;
    if (announce) announcement.textContent = `Story ${index + 1} of ${stories.length}. ${story.name}. ${story.period}. ${story.quote}`;
  }

  function navigate(target, trigger) {
    if (target < 0 || target >= stories.length || target === index) return;
    index = target;
    render(true);
    // Keep focus on a usable control when the clicked arrow reaches a boundary.
    if (trigger?.disabled) (trigger === next ? previous : next).focus();
  }

  previous.disabled = true;
  next.disabled = true;
  try {
    const content = await getTestimonials();
    if (!content.stories.length) throw new Error('No stories');
    stories = content.stories;
    root.querySelector('[data-testimonial-heading]').textContent = content.heading;
    root.querySelector('[data-testimonial-introduction]').textContent = content.introduction;
    render();
  } catch {
    count.textContent = '01/01';
    return; // Keep the original story readable if the service fails.
  }

  previous.addEventListener('click', () => navigate(index - 1, previous));
  next.addEventListener('click', () => navigate(index + 1, next));
  root.querySelector('[data-testimonial-controls]').addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowLeft') target = index - 1;
    if (event.key === 'ArrowRight') target = index + 1;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = stories.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    navigate(target, event.target);
  });
}
