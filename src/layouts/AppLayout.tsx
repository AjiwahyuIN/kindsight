import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Footer } from '../components/landing/Footer';
import { Navbar, type NavbarHandle } from '../components/landing/Navbar';
import { Container } from '../components/ui/Container';
import { useLandingScroll } from '../hooks/useLandingScroll';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';

export function AppLayout() {
  const navbar = useRef<NavbarHandle>(null);
  const requestDemo = (trigger: HTMLElement) => navbar.current?.requestDemo(trigger);
  const { pathname, hash } = useLocation();
  const landingScroll = useLandingScroll(pathname === '/');
  const landingFetching = useIsFetching({ queryKey: ['landing'] });
  const queryClient = useQueryClient();
  const positioned = useRef<string | null>(null);
  useEffect(() => {
    const destination = pathname + hash;
    const alreadyPositioned = positioned.current === destination;
    let frame = 0;
    const position = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pathname === '/' && document.querySelector('.orange-intro')) return;
        // Direct fragments must use the loaded page geometry, not loading placeholders.
        if (pathname === '/' && hash && queryClient.isFetching({ queryKey: ['landing'] })) return;
        let id = hash.slice(1);
        try { id = decodeURIComponent(id); } catch { /* Malformed fragments should not break navigation. */ }
        const target = document.getElementById(hash ? id : 'main-content');
        target?.focus({ preventScroll: true });
        if (landingScroll.current) {
          landingScroll.current.resize();
          const destinationY = hash && target ? target.getBoundingClientRect().top + window.scrollY : 0;
          landingScroll.current.scrollTo(destinationY, { immediate: !hash });
        } else if (hash) target?.scrollIntoView(); else window.scrollTo(0, 0);
        positioned.current = destination;
      });
    };
    const sectorsReady = () => { if (pathname === '/' && ['#missions', '#missions-title', '#sectors', '#sectors-title', '#footer'].includes(hash)) position(); };
    if (!alreadyPositioned) position();
    window.addEventListener('kindsight:sectors-ready', sectorsReady);
    const footerReady = () => { if (pathname === '/' && hash === '#footer') position(); };
    window.addEventListener('kindsight:footer-ready', footerReady);
    window.addEventListener('kindsight:intro-complete', position);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('kindsight:intro-complete', position); window.removeEventListener('kindsight:sectors-ready', sectorsReady); window.removeEventListener('kindsight:footer-ready', footerReady); };
  }, [pathname, hash, landingScroll, landingFetching, queryClient]);
  if (['/dashboard.html','/admin.html','/content.html','/login.html'].includes(pathname) || pathname === '/app' || pathname.startsWith('/app/') || pathname === '/login' || pathname === '/dashboard' || pathname === '/admin' || pathname.startsWith('/admin/')) return <><a className="skip-link" href="#main-content">Lewati ke konten utama</a><Outlet /></>;
  return <>
    <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
    {pathname === '/' && <Navbar ref={navbar} />}
    {pathname === '/' && <main id="main-content" tabIndex={-1}><Outlet context={{ requestDemo }} /></main>}
    {pathname !== '/' && <Container className="spa-shell">
      {pathname !== '/' && <header className="spa-shell__header">
        <p className="spa-shell__brand">Kindsight <span>/ React SPA</span></p>
        <nav className="spa-shell__navigation" aria-label="Navigasi fondasi">
          <NavLink to="/" end>Landing page</NavLink>
          <NavLink to="/foundation">QC fondasi</NavLink>
        </nav>
      </header>}
      {pathname !== '/' && <main id="main-content" tabIndex={-1}><Outlet /></main>}
      <p className="spa-shell__note">Mode data contoh · Fondasi migrasi · API belum terhubung</p>
    </Container>}
    {pathname === '/' && <Footer />}
  </>;
}
