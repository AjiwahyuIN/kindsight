import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('role-aware returnTo cannot cross workspaces; identities include organization and role',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try{
  const{safeReturnTo,sessionIdentity}=await vite.ssrLoadModule('/src/services/auth-utils.ts');
  const user={id:'account',name:'Organization user',email:'test@example.test',role:'organization_user',organization:{id:'org-a',name:'A'}};
  const admin={...user,role:'platform_admin',organization:null};
  assert.equal(safeReturnTo('/admin/content/hero?from=x',user),'/app/dashboard');
  assert.equal(safeReturnTo('/admin/donations?status=received&page=2',user),'/app/donations?status=received&page=2');
  assert.equal(safeReturnTo('/dashboard?from=2026-10-01',admin),'/admin/overview');
  assert.equal(safeReturnTo('/admin/content/hero',admin),'/admin/content/hero');
  for(const raw of ['//untrusted.test','https://untrusted.test','/admin/../dashboard','/admin/unknown','/admin%2fcontent/hero'])assert.equal(safeReturnTo(raw,admin),'/admin/overview');
  assert.notEqual(sessionIdentity(user),sessionIdentity({...user,organization:{id:'org-b',name:'B'}}));assert.notEqual(sessionIdentity(user),sessionIdentity(admin));assert.equal(sessionIdentity(null),'guest');
 }finally{await vite.close();}
});
