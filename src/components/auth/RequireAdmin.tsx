import {Navigate,Outlet,useLocation} from 'react-router';
import {useSession} from '../../queries/auth';
import {sessionIdentity,homeForUser} from '../../services/auth-utils';
import type {UserRole} from '../../services/auth-types';
import {StatusMessage} from '../ui/StatusMessage';
import {Button,LinkButton} from '../ui/Button';
export function RequireAdmin({role}:{role:UserRole}){
 const session=useSession(),location=useLocation();
 if(session.isPending||(!session.data&&session.isFetching))return <div className="container"><StatusMessage kind="loading">Checking your session…</StatusMessage></div>;
 if(session.isError)return <div className="container"><StatusMessage kind="error" action={<Button onClick={()=>void session.refetch()}>Try again</Button>}>{session.error.message}</StatusMessage></div>;
 if(!session.data)return <Navigate replace to={`${role==='platform_admin'?'/admin/login':'/login'}?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`}/>;
 if(session.data.role!==role)return <main id="main-content" className="container" tabIndex={-1}><title>Access denied — Kindsight</title><StatusMessage kind="error">This account cannot access this workspace.</StatusMessage><LinkButton to={homeForUser(session.data)}>Open your workspace</LinkButton></main>;
 return <Outlet key={sessionIdentity(session.data)}/>;
}
