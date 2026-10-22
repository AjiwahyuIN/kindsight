import {contentSections} from './content-types';
export const portalEntities=['donors','campaigns','donations'] as const;
// Canonicalize only supported aliases; never treat an arbitrary internal URL as authorized.
export function canonicalPath(pathname:string,search='',hash=''):string|null{
 const params=new URLSearchParams(search);let path=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 if(path==='/dashboard'||path==='/dashboard.html'||path==='/app'||path==='/app/')path='/app/dashboard';
 else if(path==='/admin')path='/admin/overview';
 else if(path==='/login.html')path='/login';
 else if(path==='/admin.html'){
  if(params.getAll('view').length>1)return null;
  const entity=params.get('view')??'donors';if(!portalEntities.includes(entity as typeof portalEntities[number]))return null;
  params.delete('view');path=`/app/${entity}`;
 }else if(path==='/content.html'){
  if(params.getAll('section').length>1)return null;
  const section=params.get('section')??'navbar';if(!contentSections.includes(section as typeof contentSections[number]))return null;
  params.delete('section');path=`/admin/content/${section}`;
 }else if(/^\/admin\/(donors|campaigns|donations)\/?$/.test(path))path=path.replace('/admin/','/app/').replace(/\/$/,'');
 const query=params.toString();return `${path}${query?'?'+query:''}${hash}`;
}
export function isPortalPath(pathname:string){return /^\/app\/(dashboard|donors|campaigns|donations)\/?$/.test(pathname);}
export function isContentPath(pathname:string){return contentSections.some(section=>pathname===`/admin/content/${section}`);}

export function isAdminPath(pathname:string){return ['/admin/overview','/admin/demo-requests','/admin/organizations','/admin/users'].includes(pathname)||isContentPath(pathname);}
