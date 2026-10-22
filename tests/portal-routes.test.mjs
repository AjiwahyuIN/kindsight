import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('portal aliases preserve filters/fragments and returnTo remains role restricted',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try{
  const{canonicalPath,isPortalPath}=await vite.ssrLoadModule('/src/services/route-paths.ts');
  const{safeReturnTo,homeForUser}=await vite.ssrLoadModule('/src/services/auth-utils.ts');
  for(const alias of ['/dashboard','/dashboard/','/dashboard.html','/app','/app/'])assert.equal(canonicalPath(alias,'?interval=month&page=2','#chart'),'/app/dashboard?interval=month&page=2#chart');
  for(const entity of ['donors','campaigns','donations']){
   assert.equal(canonicalPath(`/admin/${entity}`,'?search=Community+Care&archived=all&page=2'),`/app/${entity}?search=Community+Care&archived=all&page=2`);
   assert.equal(canonicalPath('/admin.html',`?view=${entity}&status=received&pageSize=25`,'#main-content'),`/app/${entity}?status=received&pageSize=25#main-content`);
   assert.equal(isPortalPath(`/app/${entity}`),true);
  }
  assert.equal(canonicalPath('/content.html','?section=hero','#content-title'),'/admin/content/hero#content-title');
  assert.equal(canonicalPath('/admin.html','?view=unknown'),null);assert.equal(canonicalPath('/admin.html','?view=donors&view=campaigns'),null);assert.equal(canonicalPath('/content.html','?section=unknown'),null);
  assert.equal(canonicalPath('/admin','?from=login'),'/admin/overview?from=login');
  const user={id:'a',name:'A',email:'a@example.test',role:'organization_user',organization:{id:'org',name:'Org'}};
  const admin={...user,role:'platform_admin',organization:null};
  assert.equal(homeForUser(admin),'/admin/overview');assert.equal(safeReturnTo('/admin/overview',user),'/app/dashboard');assert.equal(safeReturnTo('/admin/overview?x=1',admin),'/admin/overview?x=1');
  assert.equal(homeForUser(user),'/app/dashboard');assert.equal(safeReturnTo('/app/donations?status=pending&page=2',user),'/app/donations?status=pending&page=2');
  for(const value of ['/app/content','/app/dashboard/../../admin/content/hero','/admin/content/hero','/app/%2Fdashboard','//other.test','/app/dashboard\\evil'])assert.equal(safeReturnTo(value,user),'/app/dashboard');
  assert.equal(safeReturnTo('/admin.html?view=donors',admin),'/admin/overview');assert.equal(safeReturnTo('/app/dashboard',admin),'/admin/overview');
 }finally{await vite.close();}
});
