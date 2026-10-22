import { getPartners } from '../services/partners.js';
import { getPartnerGeometry } from '../data/partners.js';

export async function initPartners(root) {
  if (!root) return;
  const viewport = root.querySelector('[data-partners-viewport]');
  const track = root.querySelector('[data-partners-track]');
  const source = root.querySelector('[data-partners-source]');
  const pause = root.querySelector('[data-partners-pause]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function syncMotionPreference() {
    root.dataset.reducedMotion = String(reducedMotion.matches);
    pause.hidden = reducedMotion.matches;
    if (reducedMotion.matches) {
      viewport.tabIndex = 0;
      viewport.setAttribute('aria-label', 'Partner logos. Scroll horizontally to view all organizations.');
    } else {
      viewport.removeAttribute('tabindex');
      viewport.removeAttribute('aria-label');
    }
  }

  function updateCopies() {
    const distance = source.getBoundingClientRect().width;
    if (!distance) return;
    const count = Math.max(2, Math.ceil(viewport.clientWidth / distance) + 1);
    const copies = [...track.children].filter(group => group !== source);
    while (copies.length > count - 1) copies.pop().remove();
    while (copies.length < count - 1) {
      const copy = source.cloneNode(true);
      copy.removeAttribute('data-partners-source');
      copy.removeAttribute('aria-label');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      track.append(copy);
      copies.push(copy);
    }
    // One original set is exactly one cycle, including its trailing gap.
    root.style.setProperty('--loop-distance', `${distance}px`);
    root.style.setProperty('--loop-duration', `${distance / 28}s`);
  }

  try {
    const partners = await getPartners();
    const fragment = document.createDocumentFragment();
    for (const partner of partners) {
      const item = document.createElement('li');
      item.className = 'partners__item';
      const logo = document.createElement('span');
      logo.className = 'partners__logo';
      logo.style.cssText = getPartnerGeometry(partner);
      const image = document.createElement('img');
      image.className = 'partners__image';
      image.src = partner.src;
      image.alt = partner.name;
      image.setAttribute('width', partner.width);
      image.setAttribute('height', partner.height);
      image.decoding = 'async';
      logo.append(image);
      item.append(logo);
      fragment.append(item);
    }
    source.replaceChildren(fragment);
  } catch {
    const notice=root.querySelector('[data-partners-notice]');
    notice.textContent='Saved partner content could not be loaded. Showing default logos; reload to try again.';
    notice.hidden=false;
  }

  root.dataset.paused = 'false';
  updateCopies();
  syncMotionPreference();
  root.dataset.ready = 'true';
  pause.addEventListener('click', () => {
    const paused = root.dataset.paused !== 'true';
    root.dataset.paused = String(paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Resume partner logo animation' : 'Pause partner logo animation');
  });
  reducedMotion.addEventListener('change', syncMotionPreference);
  new ResizeObserver(updateCopies).observe(viewport);
  new IntersectionObserver(([entry]) => {
    root.dataset.offscreen = String(!entry.isIntersecting);
  }).observe(root);
}
