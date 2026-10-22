import { landingEndContent } from '../data/landing-end.js';
import { getLandingEndContent, previewNewsletter } from '../services/landing-end.js';

export async function initLandingEnd() {
  const dialog = document.querySelector('#landing-preview');
  if (!dialog) return;
  let content = landingEndContent;
  try { content = await getLandingEndContent(); } catch {
    document.querySelector('#newsletter-status').textContent='Saved footer content could not be loaded. Showing default content; reload to try again.';
  }
  document.querySelectorAll('[data-end-text]').forEach(element => {
    const value = element.dataset.endText.split('.').reduce((value, key) => value?.[key], content);
    if (typeof value === 'string') element.textContent = value;
  });
  let trigger;
  const open = (button, title, description) => {
    trigger = button;
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('#landing-preview-description').textContent = description;
    dialog.showModal();
  };
  document.querySelectorAll('[data-sector-open]').forEach(button => {
    button.addEventListener('click', () => {
      const card = content.sectors.cards.find(card => card.id === button.dataset.sectorOpen);
      open(button, card.title, card.description);
    });
  });
  const footer=document.querySelector('#footer');
  const navigation=footer.querySelector('.site-footer__navigation'),legal=footer.querySelector('.site-footer__legal');
  function footerLink(item){
    const label=typeof item==='string'?item:item.label,href=typeof item==='string'?content.footer.destinations?.[item]:item.href;
    const element=document.createElement(href?'a':'button');element.textContent=label;
    if(href)element.href=href;else{element.type='button';element.dataset.footerPreview=label;element.setAttribute('aria-haspopup','dialog');}
    return element;
  }
  navigation.replaceChildren();legal.replaceChildren();
  for(const group of content.footer.groups){
    const column=document.createElement('div'),title=document.createElement('h3'),list=document.createElement('ul');column.className='site-footer__group';title.textContent=group.title;
    for(const item of group.links){const entry=document.createElement('li');entry.append(footerLink(item));list.append(entry);}column.append(title,list);navigation.append(column);
  }
  content.footer.legal.forEach(item=>legal.append(footerLink(item)));
  footer.addEventListener('click',event=>{const button=event.target.closest('[data-footer-preview]');if(button)open(button,button.dataset.footerPreview,'This page is not available in the current showcase yet.');});
  dialog.querySelector('[data-end-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger?.focus());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  const form = document.querySelector('[data-newsletter]');
  const status = document.querySelector('#newsletter-status');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const result = await previewNewsletter(form.elements.email.value);
      status.textContent = result.message;
      form.reset();
    } catch {
      status.textContent = 'Preview unavailable. Please try again.';
    } finally { button.disabled = false; }
  });
}
