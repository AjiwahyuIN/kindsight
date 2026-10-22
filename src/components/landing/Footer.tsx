import { useFooterMotion } from '../../hooks/useFooterMotion';
import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { useFooter, useNewsletterPreview } from '../../queries/footer';
import type { FooterLink } from '../../services/footer-types';
import type { SampleScenario } from '../../services/types';
import ornament from '../../assets/footer/c810a.svg';
import rule from '../../assets/footer/bf1ae.svg';
import mark from '../../assets/footer/44669.svg';
import arrow from '../../assets/footer/52599.svg';
import '../../styles/components/_landing-end.scss';

export function Footer() {
  const [params] = useSearchParams();
  const requested = params.get('footerState');
  const scenario: SampleScenario = requested === 'empty' || requested === 'error' ? requested : 'success';
  const footer = useFooter(scenario);
  const newsletter = useNewsletterPreview();
  const [email, setEmail] = useState('');
  const [preview, setPreview] = useState<FooterLink | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const data = footer.data;
  const root = useRef<HTMLElement>(null);
  useFooterMotion(root, Boolean(data));

  function openPreview(item: FooterLink, trigger: HTMLElement) { returnFocus.current = trigger; setPreview(item); }
  function destination(item: FooterLink) {
    if (/^https?:\/\//.test(item.href)) return <a href={item.href}>{item.label}</a>;
    if (item.href.startsWith('/') || item.href.startsWith('#')) return <Link to={item.href} onClick={event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // Keep the approved anchor; until that section is migrated, give an explicit preview.
      if (item.href.startsWith('#') && !document.getElementById(item.href.slice(1))) { event.preventDefault(); openPreview(item, event.currentTarget); }
    }}>{item.label}</Link>;
    return <button type="button" aria-haspopup="dialog" onClick={event => openPreview(item, event.currentTarget)}>{item.label}</button>;
  }
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newsletter.isPending) return;
    try {
      await newsletter.mutateAsync({ email, scenario: params.get('newsletterState') === 'error' ? 'error' : 'success' });
      setEmail('');
    } catch { /* Render the service error; retain the address for a retry. */ }
  }
  function home(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  return <>
    <footer ref={root} id="footer" className="site-footer" lang="en" tabIndex={-1}>
      <div className="site-footer__panel">
        <div className="site-footer__ornament" aria-hidden="true"><img src={ornament} alt="" /><div className="site-footer__rule"><img src={rule} alt="" /></div><img src={ornament} alt="" /></div>
        <Link className="site-footer__brand" to="/" aria-label="Kindsight home" onClick={home}><img src={mark} alt="" /><span>Kindsight</span></Link>
        {footer.isPending && <p className="site-footer__body" role="status">Loading footer content…</p>}
        {footer.isError && <div className="site-footer__body"><div role="alert"><p>{footer.error.message}</p><Button variant="light" size="sm" onClick={() => void footer.refetch()}>Retry footer</Button></div></div>}
        {footer.isSuccess && !data && <p className="site-footer__body" role="status">No footer content is available in this sample scenario.</p>}
        {data && <>
          <div className="site-footer__body">
            <div className="site-footer__newsletter">
              <h2 id="react-newsletter-title">{data.heading.split(/\s+/).map((word, index) => <span key={index}>{index > 0 && ' '}<span className="site-footer__heading-word"><span>{word}</span></span></span>)}</h2>
              <form className="site-footer__form" aria-labelledby="react-newsletter-title" onSubmit={event => void subscribe(event)}>
                <div className="site-footer__email">
                  <label className="sr-only" htmlFor="react-newsletter-email">Your email</label>
                  <input id="react-newsletter-email" type="email" name="email" placeholder="Your email" autoComplete="email" required maxLength={254}
                    aria-describedby="react-newsletter-description react-newsletter-status" value={email} disabled={newsletter.isPending}
                    onChange={event => { setEmail(event.target.value); if (newsletter.isError || newsletter.isSuccess) newsletter.reset(); }} />
                  <button type="submit" aria-label={newsletter.isPending ? 'Preparing newsletter preview' : 'Preview newsletter subscription'} disabled={newsletter.isPending}><img src={arrow} alt="" /></button>
                </div>
                <p id="react-newsletter-description">{data.description}</p>
                <p id="react-newsletter-status" className="site-footer__status" role={newsletter.isError ? 'alert' : 'status'}>
                  {newsletter.isPending ? 'Preparing local preview…' : newsletter.isError ? newsletter.error.message : newsletter.isSuccess ? newsletter.data.message : ''}
                </p>
              </form>
            </div>
            <nav className="site-footer__navigation" aria-label="Footer">
              {data.groups.map(group => <div className="site-footer__group" key={group.title}>
                <h3>{group.title}</h3><ul>{group.links.map((item, index) => <li key={`${item.label}-${index}`}>{destination(item)}</li>)}</ul>
              </div>)}
            </nav>
          </div>
          <div className="site-footer__bottom"><p>{data.copyright}</p><div className="site-footer__legal">{data.legal.map((item, index) => <span key={`${item.label}-${index}`}>{destination(item)}</span>)}</div></div>
        </>}
        <p className="site-footer__wordmark" aria-hidden="true">Kindsight</p>
      </div>
    </footer>
    <Dialog className="landing-preview" lang="en" open={preview !== null} onClose={() => setPreview(null)} returnFocus={returnFocus} initialFocus={closeButton}
      aria-labelledby="react-footer-preview-title" aria-describedby="react-footer-preview-description react-footer-preview-note">
      <Button variant="light" size="sm" onClick={() => setPreview(null)} ref={closeButton}>Close</Button>
      <h2 id="react-footer-preview-title">{preview?.label}</h2>
      <p id="react-footer-preview-description">{preview?.href.startsWith('#') ? 'This section has not been migrated to React yet.' : 'This page is not available in the current showcase yet.'}</p>
      <p id="react-footer-preview-note">Local preview. Detailed content, destinations, and business definitions will be confirmed before API integration.</p>
    </Dialog>
  </>;
}
