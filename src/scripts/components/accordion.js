export function initAccordion(root) {
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const triggers = [...root.querySelectorAll('[data-accordion-trigger]')];

  root.addEventListener('click', event => {
    const selected = event.target.closest('[data-accordion-trigger]');
    if (!selected || !triggers.includes(selected)) return;
    const shouldOpen = selected.getAttribute('aria-expanded') !== 'true';
    for (const trigger of triggers) {
      const open = trigger === selected && shouldOpen;
      trigger.setAttribute('aria-expanded', String(open));
      const item = trigger.closest('[data-accordion-item]');
      item.dataset.open = String(open);
      item.querySelector('[data-accordion-panel]').hidden = !open;
    }
  });

  root.addEventListener('keydown', event => {
    const index = triggers.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % triggers.length;
    if (event.key === 'ArrowUp') next = (index - 1 + triggers.length) % triggers.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = triggers.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    triggers[next].focus();
  });
}
