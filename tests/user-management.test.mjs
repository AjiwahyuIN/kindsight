import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('user filters validate organization IDs and preserve role-safe returnTo',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try{const {parseUserFilters,generateInitialPassword}=await vite.ssrLoadModule('/src/services/users.ts'),{safeReturnTo}=await vite.ssrLoadModule('/src/services/auth-utils.ts');const org='40000000-0000-4000-8000-000000000001';
 assert.deepEqual(parseUserFilters(new URLSearchParams(`status=inactive&organization=${org}&search=+team+&page=3&pageSize=25`)),{status:'inactive',organization:org,search:'team',page:3,pageSize:25});assert.deepEqual(parseUserFilters(new URLSearchParams('status=other&organization=bad&page=-1&pageSize=999')),{status:'all',organization:'all',search:'',page:1,pageSize:10});
 const first=generateInitialPassword(),second=generateInitialPassword();assert.ok(first.length>=32);assert.notEqual(first,second);
 assert.equal(safeReturnTo('/admin/users?status=inactive',{id:'a',role:'platform_admin',organization:null}),'/admin/users?status=inactive');assert.equal(safeReturnTo('/admin/users',{id:'u',role:'organization_user',organization:{id:org,name:'Org'}}),'/app/dashboard');
 }finally{await vite.close();}
});
