import { getNavigation, previewDemoRequest } from '../services/navigation.js';
import { getOptionalAdminSession } from '../services/auth.js';

export async function initNavbar(root) {
  if (!root) return;

  const toggle = root.querySelector('[data-nav-toggle]');
  const menu = root.querySelector('[data-nav-menu]');
  const disclosures = [...root.querySelectorAll('[data-nav-disclosure]')];
  const panels = [...root.querySelectorAll('[data-nav-panel]')];
  const dialog = document.querySelector('[data-nav-dialog]');
  const form = dialog.querySelector('[data-nav-demo-form]');
  const feedback = dialog.querySelector('[data-nav-demo-feedback]');
  const previewNote = dialog.querySelector('[data-nav-preview-note]');
  const notice = root.querySelector('[data-nav-notice]');
  const desktop = window.matchMedia('(min-width: 70rem)');
  const previews = new Map();
  let activeDisclosure = null;
  let returnFocus = null;
  let accountRequest = 0;
  const accountToggle=disclosures.find(button=>button.dataset.navDisclosure==='account');
  const accountStatus=root.querySelector('[data-nav-account-status]');
  const accountName=root.querySelector('[data-nav-account-name]');
  const accountEmail=root.querySelector('[data-nav-account-email]');
  const dashboardLink=root.querySelector('[data-nav-dashboard]');
  const signInLink=root.querySelector('[data-nav-signin]');
  const accountRetry=root.querySelector('[data-nav-account-retry]');
  async function refreshAccount() {
    const request=++accountRequest;
    accountStatus.textContent='Checking your session…';
    for(const element of [accountName,accountEmail,dashboardLink,signInLink,accountRetry])element.hidden=true;
    accountName.textContent='';accountEmail.textContent='';
    try {
      const session=await getOptionalAdminSession();if(request!==accountRequest)return;
      if(session){
        accountStatus.textContent='Signed in as';accountName.textContent=session.admin.name;accountEmail.textContent=session.admin.email;
        accountName.hidden=false;accountEmail.hidden=false;dashboardLink.hidden=false;
        accountToggle.setAttribute('aria-label',`Account menu for ${session.admin.name}`);
      }else{accountStatus.textContent='You’re not signed in.';signInLink.hidden=false;accountToggle.setAttribute('aria-label','Open account menu');}
    }catch{if(request===accountRequest){accountStatus.textContent='Unable to check your account. Please try again.';accountRetry.hidden=false;accountToggle.setAttribute('aria-label','Open account menu');}}
    finally{if(request===accountRequest)accountToggle.disabled=false;}
  }
  accountRetry.addEventListener('click',async()=>{await refreshAccount();if(activeDisclosure===accountToggle)(dashboardLink.hidden?signInLink.hidden?accountRetry:signInLink:dashboardLink).focus();});

  function closeDisclosure({ restoreFocus = false } = {}) {
    const previous = activeDisclosure;
    panels.forEach(panel => { panel.hidden = true; });
    disclosures.forEach(button => button.setAttribute('aria-expanded', 'false'));
    activeDisclosure = null;
    if (restoreFocus) previous?.focus();
  }

  function setMobileMenu(open, { restoreFocus = false } = {}) {
    closeDisclosure();
    menu.hidden = !desktop.matches && !open;
    toggle.setAttribute('aria-expanded', String(!desktop.matches && open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    root.classList.toggle('site-header--expanded', !desktop.matches && open);
    if (restoreFocus) toggle.focus();
  }

  async function openDisclosure(button, { focusLast = false, focusFirst = false } = {}) {
    const panel = panels.find(item => item.dataset.navPanel === button.dataset.navDisclosure);
    const wasOpen = activeDisclosure === button;
    closeDisclosure();
    if (wasOpen && !focusFirst && !focusLast) return;
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    activeDisclosure = button;
    if(button===accountToggle){await refreshAccount();if(activeDisclosure!==button)return;}
    if (focusFirst || focusLast) {
      const options = [...panel.querySelectorAll('button,a')].filter(option=>option.getClientRects().length&&!option.disabled);
      (focusLast ? options.at(-1) : options[0])?.focus();
    }
  }

  function openDialog(title, description, trigger, isDemo = false) {
    const sourcePanel = trigger.closest('[data-nav-panel]');
    const sourceDisclosure = sourcePanel && disclosures.find(button => button.dataset.navDisclosure === sourcePanel.dataset.navPanel);
    returnFocus = !desktop.matches && root.contains(trigger) && !menu.hidden ? toggle : sourceDisclosure || trigger;
    setMobileMenu(false);
    dialog.querySelector('[data-nav-dialog-title]').textContent = title;
    dialog.querySelector('[data-nav-dialog-description]').textContent = description;
    form.hidden = !isDemo;
    previewNote.hidden = isDemo;
    feedback.hidden = true;
    feedback.textContent = '';
    form.reset();
    dialog.showModal();
    if (isDemo) form.elements.name.focus();
  }

  function requestDemo(trigger) {
    openDialog('Let’s talk about your mission.', 'See how Kindsight can support your fundraising team.', trigger, true);
  }

  toggle.addEventListener('click', () => setMobileMenu(menu.hidden));
  disclosures.forEach(button => {
    button.addEventListener('click', () => openDisclosure(button));
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openDisclosure(button, { focusFirst: event.key === 'ArrowDown', focusLast: event.key === 'ArrowUp' });
      }
    });
  });

  root.addEventListener('click', event => {
    if(event.target.closest('[data-nav-option-link]'))setMobileMenu(false);
    const preview = event.target.closest('[data-nav-preview]');
    if (preview) {
      const item = previews.get(preview.dataset.navPreview);
      if (item) openDialog(item.label, item.description, preview);
    }
    const demo = event.target.closest('[data-nav-demo]');
    if (demo) requestDemo(demo);
  });

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) {
      closeDisclosure();
      if (!desktop.matches) setMobileMenu(false);
    }
  });

  document.addEventListener('focusin', event => {
    if (!root.contains(event.target)) {
      closeDisclosure();
      if (!desktop.matches) setMobileMenu(false);
    } else if (activeDisclosure) {
      const panel = panels.find(item => item.dataset.navPanel === activeDisclosure.dataset.navDisclosure);
      if (event.target !== activeDisclosure && !panel.contains(event.target)) closeDisclosure();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || dialog.open) return;
    if (activeDisclosure) {
      event.preventDefault();
      closeDisclosure({ restoreFocus: true });
    } else if (!desktop.matches && !menu.hidden) {
      event.preventDefault();
      setMobileMenu(false, { restoreFocus: true });
    }
  });

  desktop.addEventListener('change', () => {
    const focusedInMenu = menu.contains(document.activeElement);
    const focusedToggle = document.activeElement === toggle;
    setMobileMenu(false);
    if (!dialog.open && !desktop.matches && focusedInMenu) toggle.focus();
    if (!dialog.open && desktop.matches && focusedToggle) root.querySelector('.site-header__brand').focus();
  });

  dialog.querySelector('[data-nav-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    form.reset();
    (returnFocus?.checkVisibility() ? returnFocus : toggle.checkVisibility() ? toggle : root.querySelector('.site-header__brand')).focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = form.elements.namedItem('name');
    if (!name.value.trim()) {
      name.setCustomValidity('Please enter your name.');
      name.reportValidity();
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await previewDemoRequest(Object.fromEntries(new FormData(form)));
      feedback.textContent = `Thanks, ${result.name}. This demo request was previewed locally. No request has been sent.`;
      feedback.hidden = false;
      form.hidden = true;
      dialog.querySelector('[data-nav-dialog-close]').focus();
    } catch {
      feedback.textContent = 'The preview could not be prepared. Please try again.';
      feedback.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  form.elements.namedItem('name').addEventListener('input', event => event.target.setCustomValidity(''));

  setMobileMenu(false);
  refreshAccount();
  try {
    const data = await getNavigation();
    root.querySelector('[data-nav-brand]').textContent=data.brandName;
    root.querySelector('[data-nav-demo]').textContent=data.demoLabel;
    root.querySelectorAll('[data-nav-label]').forEach(element=>{element.textContent=data.labels[element.dataset.navLabel];});
    root.querySelector('[data-nav-badge]').textContent=data.productBadge;
    root.querySelector('[data-nav-badge]').hidden=!data.productBadge;
    if(data.company.href){
      const button=root.querySelector('[data-nav-preview="company"]'),link=document.createElement('a');
      link.className=button.className;link.textContent=data.labels.company;link.href=data.company.href;link.dataset.navOptionLink='';button.replaceWith(link);
    }
    const template = document.querySelector('[data-nav-option-template]');
    Object.entries(data.groups).forEach(([group, items]) => {
      const panel = panels.find(item => item.dataset.navPanel === group);
      items.forEach(item => {
        previews.set(item.id, item);
        const option = template.content.cloneNode(true);
        const button=option.querySelector('button');
        if(item.href){const link=document.createElement('a');link.className=button.className;link.href=item.href;link.dataset.navOptionLink='';link.append(...button.childNodes);button.replaceWith(link);}
        else button.dataset.navPreview = item.id;
        option.querySelector('.site-header__option-label').textContent = item.label;
        option.querySelector('.site-header__option-description').textContent = item.description;
        panel.append(option);
      });
    });
    previews.set('company', data.company);
    root.querySelectorAll('[data-nav-disclosure]:not([data-nav-disclosure="account"]),[data-nav-preview="company"]').forEach(button => { button.disabled = false; });
  } catch {
    notice.textContent = 'Navigation is unavailable. Please reload to try again.';
    notice.hidden = false;
  }

  return { requestDemo };
}
