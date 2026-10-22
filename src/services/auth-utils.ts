import type {SessionUser} from './auth-types';
import {canonicalPath,isPortalPath,isAdminPath} from './route-paths';
export const homeForUser=(user:SessionUser)=>user.role==='platform_admin'?'/admin/overview':'/app/dashboard';
export const sessionIdentity=(user:SessionUser|null|undefined)=>user?`${user.id}:${user.role}:${user.organization?.id??'platform'}`:'guest';
export function safeReturnTo(raw:string|null,user?:SessionUser){
 const fallback=user?homeForUser(user):'/app/dashboard';
 if(!raw||!raw.startsWith('/')||raw.startsWith('//')||/[\\\u0000-\u001f]/.test(raw))return fallback;
 const url=new URL(raw,'https://kindsight.invalid');if(url.origin!=='https://kindsight.invalid')return fallback;
 const canonical=canonicalPath(url.pathname,url.search,url.hash);if(!canonical)return fallback;
 const target=new URL(canonical,url.origin),portal=isPortalPath(target.pathname),content=isAdminPath(target.pathname);
 if(user?(user.role==='platform_admin'?!content:!portal):!portal&&!content)return fallback;
 return target.pathname+target.search+target.hash;
}
