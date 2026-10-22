import {useSubmitDemoRequest} from '../../queries/demo-requests';
import {homeForUser} from '../../services/auth-utils';
import { useEffect, useRef, useState, useImperativeHandle, type Ref, type KeyboardEvent, type MouseEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, LinkButton } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { useNavigation, useNavbarAccount } from '../../queries/navigation';
import type { NavigationGroup, NavigationItem, AccountScenario } from '../../services/navigation-types';
import type { SampleScenario } from '../../services/types';
import mark from '../../assets/brand/kindsight-mark.svg';
import caret from '../../assets/icons/caret-right.svg';
import utility from '../../assets/icons/navbar-utility.svg';
import '../../styles/components/_navbar.scss';

type Disclosure = NavigationGroup | 'account';
type Preview = { kind: 'demo' | 'navigation'; title: string; description: string };
const labels = { serve: 'Who we Serve', product: 'Product', company: 'Company', resources: 'Resources' };
const groups: NavigationGroup[] = ['serve', 'product', 'resources'];

export type NavbarHandle = { requestDemo: (trigger: HTMLElement) => void };
export function Navbar({ ref }: { ref?: Ref<NavbarHandle> }) {
  const [params] = useSearchParams();
  const navParam = params.get('navState'), accountParam = params.get('account');
  const scenario: SampleScenario = navParam === 'empty' || navParam === 'error' ? navParam : 'success';
  const accountScenario: AccountScenario = accountParam === 'admin' || accountParam === 'error' ? accountParam : 'guest';
  const navigation = useNavigation(scenario);
  const [active, setActive] = useState<Disclosure | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 70rem)').matches);
  const [preview, setPreview] = useState<Preview | null>(null);
  const account = useNavbarAccount(accountScenario, active === 'account');
  const demo = useSubmitDemoRequest();
  const submissionId=useRef(crypto.randomUUID());
  const root = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null), brand = useRef<HTMLAnchorElement>(null);
  const triggers = useRef<Partial<Record<Disclosure, HTMLButtonElement | null>>>({});
  const panels = useRef<Partial<Record<Disclosure, HTMLElement | null>>>({});
  const focusEdge = useRef<'first' | 'last' | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const data = navigation.data;

  function closeDisclosure(restore = false) {
    focusEdge.current = null;
    if (restore && active) triggers.current[active]?.focus();
    setActive(null);
  }
  function closeMenu() { closeDisclosure(); setMobileOpen(false); }
  function openDisclosure(id: Disclosure, edge?: 'first' | 'last') {
    focusEdge.current = edge ?? null;
    setActive(current => current === id && !edge ? null : id);
  }
  function disclosureKey(event: KeyboardEvent<HTMLButtonElement>, id: Disclosure) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault(); openDisclosure(id, event.key === 'ArrowDown' ? 'first' : 'last');
  }
  function openPreview(item: { label: string; description: string }, trigger: HTMLElement, group?: Disclosure, isDemo = false) {
    returnFocus.current = !desktop && root.current?.contains(trigger) ? toggle.current : group ? triggers.current[group] ?? brand.current : trigger;
    closeMenu(); demo.reset(); submissionId.current=crypto.randomUUID();
    setPreview({ kind: isDemo ? 'demo' : 'navigation', title: item.label, description: item.description });
  }

  useImperativeHandle(ref, () => ({ requestDemo(trigger) { openPreview({ label: 'Let’s talk about your mission.', description: 'See how Kindsight can support your fundraising team.' }, trigger, undefined, true); } }));

  useEffect(() => {
    const media = window.matchMedia('(min-width: 70rem)');
    function changed() {
      const focused = document.activeElement;
      const wasToggle = focused === toggle.current;
      const insideMenu = focused instanceof Element && Boolean(focused.closest('#react-site-navigation'));
      const focusedDisclosure = (Object.keys(panels.current) as Disclosure[]).find(id => focused instanceof Node && panels.current[id]?.contains(focused));
      setDesktop(media.matches); setMobileOpen(false); setActive(null); focusEdge.current = null;
      if (insideMenu && !media.matches) toggle.current?.focus();
      if (wasToggle && media.matches) brand.current?.focus();
      else if (focusedDisclosure && media.matches) triggers.current[focusedDisclosure]?.focus();
    }
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

  useEffect(() => {
    if (!active || !focusEdge.current || (active === 'account' && account.isFetching)) return;
    const options = [...(panels.current[active]?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]') ?? [])].filter(element => element.checkVisibility());
    const target = focusEdge.current === 'last' ? options.at(-1) : options[0];
    if (target) { target.focus(); focusEdge.current = null; }
  }, [active, account.isFetching, account.data, account.isError]);

  useEffect(() => {
    function outside(event: Event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!root.current?.contains(target)) closeMenu();
      else if (event.type === 'focusin' && active && target !== triggers.current[active] && !panels.current[active]?.contains(target)) closeDisclosure();
    }
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape' || preview) return;
      if (active) { event.preventDefault(); closeDisclosure(true); }
      else if (!desktop && mobileOpen) { event.preventDefault(); closeMenu(); toggle.current?.focus(); }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [active, desktop, mobileOpen, preview]);

  // Query-param QC scenarios can change without a page reload; reset any open disclosure.
  useEffect(() => { setActive(null); setMobileOpen(false); focusEdge.current = null; }, [scenario, accountScenario]);

  function option(item: NavigationItem, group: NavigationGroup) {
    const contents = <><span className="site-header__option-label">{item.label}</span><span className="site-header__option-description">{item.description}</span></>;
    if (item.href.startsWith('/') || item.href.startsWith('#')) return <Link className="site-header__option" to={item.href} onClick={closeMenu}>{contents}</Link>;
    if (/^https?:\/\//.test(item.href)) return <a className="site-header__option" href={item.href} onClick={closeMenu}>{contents}</a>;
    return <button className="site-header__option" type="button" onClick={event => openPreview(item, event.currentTarget, group)}>{contents}</button>;
  }
  function groupItem(id: NavigationGroup) {
    return <li className="site-header__item" key={id}>
      <button className="site-header__trigger" type="button" ref={element => { triggers.current[id] = element; }}
        aria-expanded={active === id} aria-controls={`react-nav-${id}`} disabled={!data}
        onClick={() => openDisclosure(id)} onKeyDown={event => disclosureKey(event, id)}>
        <span>{data?.labels[id] ?? labels[id]}</span>
        {id === 'product' && (data?.productBadge ?? 'New') && <span className="site-header__badge">{data?.productBadge ?? 'New'}</span>}
        {id !== 'product' && <span className="site-header__caret" aria-hidden="true"><img src={caret} alt="" /></span>}
      </button>
      <ul className="site-header__dropdown" id={`react-nav-${id}`} ref={element => { panels.current[id] = element; }} hidden={active !== id}>
        {data?.groups[id].map(item => <li key={item.id}>{option(item, id)}</li>)}
      </ul>
    </li>;
  }
  async function submitDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo.isPending) return;
    const form = new FormData(event.currentTarget);
    if (!nameInput.current?.value.trim()) {
      nameInput.current?.setCustomValidity('Please enter your name.'); nameInput.current?.reportValidity(); return;
    }
    try {
      await demo.mutateAsync({ requestId: submissionId.current, message: String(form.get('message') ?? ''), name: String(form.get('name') ?? ''), email: String(form.get('email') ?? ''), organization: String(form.get('organization') ?? '') });
      closeButton.current?.focus();
    } catch { /* The mutation error is rendered beside the form. */ }
  }
  useEffect(()=>{if(demo.isSuccess&&preview?.kind==='demo')closeButton.current?.focus();},[demo.isSuccess,preview?.kind]);
  function closePreview() { if (!demo.isPending) setPreview(null); }
  function companyClick(event: MouseEvent<HTMLButtonElement>) {
    if (data) openPreview(data.company, event.currentTarget);
  }

  return <>
    <header className={`site-header${mobileOpen && !desktop ? ' site-header--expanded' : ''}`} ref={root} lang="en">
      <div className="site-header__inner container">
        <Link className="site-header__brand" to="/" aria-label="Kindsight home" ref={brand} onClick={closeMenu}>
          <img className="site-header__mark" src={mark} alt="" aria-hidden="true" /><span className="site-header__wordmark">{data?.brandName ?? 'Kindsight'}</span>
        </Link>
        <button className="site-header__toggle" type="button" ref={toggle} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-controls="react-site-navigation" aria-expanded={!desktop && mobileOpen}
          onClick={() => { closeDisclosure(); setMobileOpen(value => !value); }}><span className="site-header__toggle-lines" aria-hidden="true" /></button>
        <div id="react-site-navigation" className="site-header__menu" hidden={!desktop && !mobileOpen}>
          <nav className="site-header__navigation" aria-label="Main navigation"><ul className="site-header__list">
            {groups.slice(0, 2).map(groupItem)}
            <li className="site-header__item">
              {data?.company.href ? <Link className="site-header__trigger" to={data.company.href} onClick={closeMenu}>{data.labels.company}</Link> :
                <button className="site-header__trigger" type="button" disabled={!data} onClick={companyClick}>{data?.labels.company ?? labels.company}</button>}
            </li>
            {groupItem('resources')}
          </ul></nav>
          <div className="site-header__actions">
            <Button className="site-header__demo" onClick={event => openPreview({ label: 'Let’s talk about your mission.', description: 'See how Kindsight can support your fundraising team.' }, event.currentTarget, undefined, true)}>{data?.demoLabel ?? 'Get a Demo'}</Button>
            <div className="site-header__account">
              <Button className="site-header__utility" variant="light" aria-label={account.data ? `Account menu for ${account.data.name}` : 'Open account menu'} aria-expanded={active === 'account'} aria-controls="react-nav-account"
                ref={element => { triggers.current.account = element; }} icon={<img src={utility} alt="" aria-hidden="true" />}
                onClick={() => openDisclosure('account')} onKeyDown={event => disclosureKey(event, 'account')} />
              <div id="react-nav-account" className="site-header__dropdown site-header__dropdown--account" hidden={active !== 'account'} ref={element => { panels.current.account = element; }}>
                <p className="site-header__account-label" role="status">{account.isFetching ? 'Checking account…' : account.isError ? account.error.message : account.data ? (account.data.role==='platform_admin'?'Internal admin account':'Organization account') : 'You’re not signed in.'}</p>
                {!account.isFetching && !account.isError && (account.data ? <>
                  <p className="site-header__account-name">{account.data.name}</p><p className="site-header__account-email">{account.data.email}</p>
                  <LinkButton to={homeForUser(account.data)} variant="dark" size="sm" onClick={closeMenu}>{account.data.role==='platform_admin'?'Open admin console':'Open workspace'}</LinkButton>
                </> : <LinkButton to="/login" variant="dark" size="sm" onClick={closeMenu}>Sign in</LinkButton>)}
                {account.isError && <button className="site-header__option" type="button" onClick={() => { focusEdge.current = 'first'; void account.refetch(); }}>Try again</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {navigation.isPending && <p className="site-header__notice" role="status">Loading navigation…</p>}
      {navigation.isError && <p className="site-header__notice" role="alert">{navigation.error.message} <Button variant="outline" size="sm" onClick={() => void navigation.refetch()}>Retry navigation</Button></p>}
      {navigation.isSuccess && !data && <p className="site-header__notice" role="status">No navigation content is available in this sample scenario.</p>}
    </header>
    <Dialog dismissible={!demo.isPending} className="site-header__dialog" lang="en" open={preview !== null} onClose={closePreview} returnFocus={returnFocus} initialFocus={preview?.kind === 'demo' ? nameInput : closeButton} aria-labelledby="react-nav-dialog-title" aria-describedby="react-nav-dialog-description">
      <div className="site-header__dialog-header"><p className="site-header__dialog-eyebrow">Kindsight</p><Button variant="light" size="sm" onClick={closePreview} disabled={demo.isPending} ref={closeButton}>Close</Button></div>
      <h2 id="react-nav-dialog-title" className="site-header__dialog-title">{preview?.title}</h2>
      <p id="react-nav-dialog-description" className="site-header__dialog-description">{preview?.description}</p>
      {preview?.kind === 'navigation' && <p className="site-header__preview-note">Navigation preview — the destination page is not part of this showcase yet.</p>}
      {preview?.kind === 'demo' && !demo.isSuccess && <form className="site-header__form" aria-busy={demo.isPending} onSubmit={event => void submitDemo(event)}>
        <p className="site-header__preview-note">Your details will be stored so our team can review your demo request. This does not create an account or book a demo.</p>
        <label className="site-header__field"><span>Full name</span><input className="site-header__input" name="name" autoComplete="name" maxLength={160} disabled={demo.isPending} required ref={nameInput} onInput={event => event.currentTarget.setCustomValidity('')} /></label>
        <label className="site-header__field"><span>Work email</span><input className="site-header__input" type="email" name="email" autoComplete="email" maxLength={254} disabled={demo.isPending} required /></label>
        <label className="site-header__field"><span>Organization (optional)</span><input className="site-header__input" name="organization" autoComplete="organization" maxLength={160} disabled={demo.isPending} /></label>
        <label className="site-header__field"><span>Message (optional)</span><textarea className="site-header__input" name="message" maxLength={2000} rows={3} disabled={demo.isPending} /></label>
        <Button type="submit" disabled={demo.isPending}>{demo.isPending ? 'Sending request…' : 'Request a demo'}</Button>
        {demo.isError && <p className="site-header__feedback" role="alert">{demo.error.message}{'fields' in demo.error&&Object.entries(demo.error.fields as Record<string,string>??{}).map(([field,message])=><span key={field} style={{display:'block'}}>{field}: {message}</span>)}</p>}
      </form>}
      {demo.isSuccess && preview?.kind === 'demo' && <p className="site-header__feedback" role="status">Thank you. Your demo request has been received. Our team can now review it. No email has been sent and no appointment has been scheduled.</p>}
    </Dialog>
  </>;
}
