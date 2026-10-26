import { useSlidingNav } from '../../hooks/useSlidingNav';
import { useRef,useState,type Dispatch,type SetStateAction } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useSession,useSignOut } from '../../queries/auth';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import mark from '../../assets/brand/kindsight-mark.svg';
import '../../styles/pages/_admin.scss';
import '../../styles/pages/_admin-overview.scss';
export type AdminContext={setDirty:Dispatch<SetStateAction<boolean>>;ignoreUnsaved:boolean};
export function AdminLayout(){
  const location=useLocation();
  const navigation=useRef<HTMLElement>(null);
  useSlidingNav(navigation,location.pathname);
  const session=useSession(),logout=useSignOut();
  const [dirty,setDirty]=useState(false),[confirm,setConfirm]=useState(false),[leaving,setLeaving]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null),keep=useRef<HTMLButtonElement>(null);
  function signOut(){setConfirm(false);setLeaving(true);logout.mutate(undefined,{onError:()=>setLeaving(false)});}
  return <main id="main-content" className="admin-workspace" tabIndex={-1} lang="en"><header className="admin-workspace__header"><Link className="admin-workspace__brand" to="/" aria-label="Kindsight home"><img src={mark} alt="" width={28} height={28}/><span>Kindsight</span></Link><div className="admin-workspace__account"><span className="admin-console__identity"><strong>Internal admin</strong><span>{session.data?.name}</span><span>{session.data?.email}</span></span><Link to="/">View website</Link><Button variant="outline" size="sm" ref={trigger} disabled={logout.isPending} onClick={()=>{if(dirty)setConfirm(true);else signOut();}}>{logout.isPending?'Signing out…':'Sign out'}</Button></div></header>{logout.isError&&<p role="alert">{logout.error.message}</p>}<div className="admin-workspace__content"><nav ref={navigation} className="admin-workspace__tabs admin-console__nav" aria-label="Internal administration"><span className="admin-workspace__tab-indicator" aria-hidden="true" /><NavLink className="admin-workspace__tab" to="/admin/overview">Overview</NavLink><NavLink className="admin-workspace__tab" to="/admin/demo-requests">Demo requests</NavLink><NavLink className="admin-workspace__tab" to="/admin/organizations">Organizations</NavLink><NavLink className="admin-workspace__tab" to="/admin/users">Users</NavLink><Link className="admin-workspace__tab" to="/admin/content/navbar" aria-current={location.pathname.startsWith('/admin/content/')?'page':undefined}>Landing content</Link></nav><Outlet context={{setDirty,ignoreUnsaved:leaving} satisfies AdminContext}/></div><Dialog className="admin-confirm" open={confirm} onClose={()=>setConfirm(false)} initialFocus={keep} returnFocus={trigger} aria-labelledby="signout-discard-title"><h2 id="signout-discard-title">Discard changes and sign out?</h2><p>Your changes have not been saved. Keep editing, or discard them and end your session.</p><div className="admin-editor__actions"><Button size="sm" variant="outline" ref={keep} onClick={()=>setConfirm(false)}>Keep editing</Button><Button size="sm" variant="dark" onClick={signOut}>Discard and sign out</Button></div></Dialog></main>;
}
