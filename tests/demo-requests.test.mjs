import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('demo inbox URL filters and admin returnTo validate without crossing role boundaries',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try{const{parseDemoFilters}=await vite.ssrLoadModule('/src/services/demo-requests.ts');const{safeReturnTo}=await vite.ssrLoadModule('/src/services/auth-utils.ts');
 assert.deepEqual(parseDemoFilters(new URLSearchParams('status=closed&search=+Ada+&page=3&pageSize=25')),{status:'closed',search:'Ada',page:3,pageSize:25});
 assert.deepEqual(parseDemoFilters(new URLSearchParams('status=evil&page=-1&pageSize=999')),{status:'all',search:'',page:1,pageSize:10});assert.equal(parseDemoFilters(new URLSearchParams({search:'x'.repeat(170)})).search.length,160);
 const admin={id:'a',role:'platform_admin',organization:null};const user={id:'u',role:'organization_user',organization:{id:'org',name:'Org'}};
 assert.equal(safeReturnTo('/admin/demo-requests?status=new&page=2',admin),'/admin/demo-requests?status=new&page=2');assert.equal(safeReturnTo('/admin/demo-requests?status=new',user),'/app/dashboard');assert.equal(safeReturnTo('/admin/demo-requests/unknown',admin),'/admin/overview');
 }finally{await vite.close();}
});
