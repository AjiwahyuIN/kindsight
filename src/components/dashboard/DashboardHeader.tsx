import { useEffect, useRef, useState } from 'react';
import { useSlidingNav } from '../../hooks/useSlidingNav';
import { Link, NavLink, useLocation } from 'react-router';
import { useSession, useSignOut } from '../../queries/auth';
import { DashboardIcon } from './DashboardIcon';
import profile from '../../assets/images/hero/profile.png';
export type Explanation = { title: string; description: string };
export function DashboardHeader() {
  const session = useSession(), logout = useSignOut();
  const { pathname } = useLocation();
  const navigation = useRef<HTMLElement>(null);
  useSlidingNav(navigation, pathname);
  const [open, setOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null), toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => { if (event.target instanceof Node && !area.current?.contains(event.target)) setOpen(false); };
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  async function signOut() { try { await logout.mutateAsync(); } catch { /* Render the mutation error in the menu. */ } }
  return <header className="dashboard-shell__topbar"><div className="dashboard-shell__brand-column"><Link className="dashboard-shell__brand" to="/" aria-label="Kindsight home"><DashboardIcon name="brand" size="brand" /><span>Kindsight</span></Link><p className="portal-layout__organization">{session.data?.organization?.name}</p></div><div className="dashboard-shell__nav-scroller"><nav ref={navigation} className="dashboard-shell__navigation" aria-label="Organization navigation"><span className="portal-layout__navigation-indicator" aria-hidden="true" />{(['dashboard','donors','campaigns','donations'] as const).map(page=><NavLink className="portal-layout__navigation-link" key={page} to={`/app/${page}`} end onClick={()=>setOpen(false)}>{page.charAt(0).toUpperCase()+page.slice(1)}</NavLink>)}</nav></div><div className="dashboard-shell__utilities">
    <div className="dashboard-shell__account-area" ref={area}><button className="dashboard-shell__profile" type="button" ref={toggle} aria-label="Open account menu" aria-expanded={open} aria-controls="dashboard-account" onClick={() => setOpen(value => !value)}><span className="dashboard-shell__portrait"><img src={profile} alt="" /></span><span className="dashboard-shell__profile-copy"><strong>{session.data?.name}</strong><span>{session.data?.email}</span></span></button><section id="dashboard-account" className="dashboard-shell__account" aria-label="Account menu" hidden={!open}><p className="dashboard-shell__account-label">Organization account</p><strong>{session.data?.name}</strong><p className="dashboard-shell__account-email">{session.data?.email}</p><Link to="/app/donors" onClick={()=>setOpen(false)}>Manage fundraising</Link><Link to="/" onClick={()=>setOpen(false)}>Visit website</Link><p>{session.data?.organization?.name}</p><button type="button" disabled={logout.isPending} onClick={() => void signOut()}>{logout.isPending ? 'Signing out…' : 'Sign out'}</button>{logout.isError && <p role="alert">{logout.error.message}</p>}</section></div>
  </div></header>;
}
