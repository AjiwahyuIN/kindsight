import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useSession, useSignIn, useSignOut } from '../queries/auth';
import { safeReturnTo, homeForUser } from '../services/auth-utils';
import { Button, LinkButton } from '../components/ui/Button';
import type {UserRole} from '../services/auth-types';
import mark from '../assets/brand/kindsight-mark.svg';
import '../styles/pages/_login.scss';
export function LoginPage({role='organization_user'}:{role?:UserRole}) {
  const internal=role==='platform_admin';
  const session = useSession(), login = useSignIn(), logout = useSignOut();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const password = useRef<HTMLInputElement>(null);
  const mismatch=!!session.data&&session.data.role!==role;
  const destination = session.data ? (mismatch?homeForUser(session.data):safeReturnTo(params.get('returnTo'),session.data)) : internal?'/admin/overview':'/app/dashboard';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (login.isPending) return;
    const fields = new FormData(event.currentTarget);
    try {
      const user=await login.mutateAsync({ email: String(fields.get('email') ?? '').trim(), password: String(fields.get('password') ?? '') });
      if (password.current) password.current.value = '';
      setVisible(false); if(user.role===role) navigate(safeReturnTo(params.get('returnTo'),user), { replace: true });
    } catch { if (password.current) { password.current.value = ''; password.current.focus(); } setVisible(false); }
  }
  return <main id="main-content" className="admin-login" tabIndex={-1} lang="en"><title>{internal?'Internal Admin Sign In — Kindsight':'Organization Sign In — Kindsight'}</title><div className="admin-login__shell">
    <aside className="admin-login__intro"><Link className="admin-login__brand" to="/" aria-label="Kindsight home"><img src={mark} alt="" width={32} height={32} /><span>Kindsight</span></Link><div className="admin-login__message"><p className="admin-login__eyebrow">Built around your mission</p><h1 className="admin-login__headline">A little insight.<br />A greater impact.</h1><p className="admin-login__description">Bring your fundraising work together, and focus on the people who move your mission forward.</p></div><p className="admin-login__caption">Care. Community. Commitment.</p></aside>
    <section className="admin-login__panel" aria-labelledby="login-title"><div className="admin-login__content"><p className="admin-login__eyebrow">Kindsight / {internal?'Internal admin':'Organization'}</p><h2 id="login-title" className="admin-login__title">Welcome back.</h2><p className="admin-login__subtitle">{internal?'Manage the Kindsight website and platform.':'Sign in to your organization’s fundraising workspace.'}</p>
      <p className="admin-login__status" role="status">{session.isPending ? 'Checking your session…' : login.isPending ? 'Signing in…' : session.data ? 'Your session is active.' : params.get('signedOut') === '1' ? 'You have signed out.' : internal?'Use your internal admin account.':'Use your organization account.'}</p>
      {session.isError && <><p className="admin-login__error" role="alert">{session.error.message}</p><Button variant="outline" onClick={() => void session.refetch()}>Try again</Button></>}
      {session.isSuccess && (session.data ? <div className="admin-login__account"><div className="admin-login__success-mark" aria-hidden="true">✓</div><h3 className="admin-login__account-title">{mismatch?'This account uses a different workspace.':'You’re signed in.'}</h3>{mismatch&&<p className="admin-login__subtitle">{internal?'Your organization account cannot access internal administration.':'Your internal admin account does not have an organization workspace.'}</p>}<dl className="admin-login__identity"><dt>Name</dt><dd>{session.data.name}</dd><dt>Email</dt><dd>{session.data.email}</dd></dl><LinkButton to={destination}>Open your workspace</LinkButton><Button variant="outline" disabled={logout.isPending} onClick={()=>logout.mutate()}>{logout.isPending?'Signing out…':'Sign out to switch accounts'}</Button>{logout.isError&&<p role="alert" className="admin-login__error">{logout.error.message}</p>}</div> : <>
        <form className="admin-login__form" onSubmit={event => void submit(event)} aria-busy={login.isPending}><div className="admin-login__field"><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} placeholder="you@example.com" disabled={login.isPending} /></div><div className="admin-login__field"><label htmlFor="admin-password">Password</label><div className="admin-login__password"><input id="admin-password" ref={password} name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={128} aria-describedby="login-error" disabled={login.isPending} /><button className="admin-login__visibility" type="button" aria-controls="admin-password" aria-pressed={visible} disabled={login.isPending} onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button></div></div><p id="login-error" className="admin-login__error" role="alert">{login.isError ? login.error.message : ''}</p><Button className="admin-login__submit" type="submit" disabled={login.isPending}>{login.isPending ? 'Signing in…' : 'Sign in'}</Button></form><Link className="admin-login__back" to={internal?'/login':'/admin/login'}>{internal?'Organization sign in':'Internal admin sign in'}</Link>
      </>)}<Link className="admin-login__back" to="/">Back to Kindsight</Link>
    </div></section>
  </div></main>;
}
