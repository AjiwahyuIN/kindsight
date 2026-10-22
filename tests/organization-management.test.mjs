import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('organization URL filters normalize and returnTo stays in the correct role',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try{const{parseOrganizationFilters}=await vite.ssrLoadModule('/src/services/organizations.ts');const{safeReturnTo}=await vite.ssrLoadModule('/src/services/auth-utils.ts');
 assert.deepEqual(parseOrganizationFilters(new URLSearchParams('status=inactive&search=+Community+&page=2&pageSize=25')),{status:'inactive',search:'Community',page:2,pageSize:25});
 assert.deepEqual(parseOrganizationFilters(new URLSearchParams('status=unknown&page=NaN&pageSize=300')),{status:'all',search:'',page:1,pageSize:10});
 assert.equal(safeReturnTo('/admin/organizations?status=inactive&page=2',{id:'a',role:'platform_admin',organization:null}),'/admin/organizations?status=inactive&page=2');assert.equal(safeReturnTo('/admin/organizations',{id:'u',role:'organization_user',organization:{id:'org',name:'Org'}}),'/app/dashboard');
 }finally{await vite.close();}
});
