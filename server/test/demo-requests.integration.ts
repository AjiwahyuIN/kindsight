import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import type {Server} from 'node:http';
import type {RowDataPacket} from 'mysql2/promise';
import {createApp} from '../app.js';
import {createDemoRequestRouters} from '../react/demo-requests.ts';
import {createAuthRepository} from '../repositories/auth.js';
import {hashPassword} from '../auth/password.js';
import {createDatabasePool} from '../config/database.js';
import {readConfig} from '../config/env.js';
test('public demo submission persists once; only platform admins can search, page and update with revision protection',async()=>{
 const pool=createDatabasePool(readConfig().database),org=randomUUID(),admin=randomUUID(),user=randomUUID(),password=randomBytes(24).toString('hex'),origin='http://127.0.0.1:5176',ids=Array.from({length:12},()=>randomUUID()),marker=randomUUID();let server:Server|undefined;
 const headers={Origin:origin,'Content-Type':'application/json','X-Kindsight-Request':'1'};
 try{
  await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[org,'Isolated demo fixture']);const hash=await hashPassword(password);
  for(const[id,role,organization]of [[admin,'platform_admin',null],[user,'organization_user',org]])await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[id,`${id}@example.test`,'Demo fixture',hash,role,organization]);
  const [[before]]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) total FROM admins');
  server=createApp({demoRequests:createDemoRequestRouters(pool,{submissionLimit:30}),auth:{repository:createAuthRepository(pool),origins:[origin]}}).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api/v1`;
  const request=(path:string,method='GET',body?:unknown,cookie?:string,extra:Record<string,string>={})=>fetch(base+path,{method,headers:{...headers,...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
  async function login(id:string){const response=await request('/auth/login','POST',{email:`${id}@example.test`,password});assert.equal(response.status,200);return response.headers.get('set-cookie')!.split(';')[0];}
  const input={requestId:ids[0],name:' Demo visitor ',email:'VISITOR@example.test',organization:marker,message:'Please show reporting.'};
  assert.equal((await request('/demo-requests','POST',input,undefined,{Origin:'https://untrusted.test'})).status,403);
  assert.equal((await request('/demo-requests','POST',input,undefined,{'X-Kindsight-Request':''})).status,403);
  const response=await request('/demo-requests','POST',input);assert.equal(response.status,201);assert.deepEqual((await response.json()).data,{id:ids[0],received:true});
  assert.equal((await request('/demo-requests','POST',input)).status,201);
  assert.equal((await request('/demo-requests','POST',{...input,message:'changed'})).status,409);
  assert.equal((await request('/demo-requests','POST',{...input,requestId:ids[1],email:'bad'})).status,400);
  for(const field of [{role:'platform_admin'},{status:'closed'},{organization_id:org},{message:'x'.repeat(2001)}])assert.equal((await request('/demo-requests','POST',{...input,requestId:ids[1],...field})).status,400);
  assert.equal((await request('/demo-requests')).status,404);assert.equal((await request(`/demo-requests/${ids[0]}`)).status,404);
  assert.equal((await request('/admin/demo-requests')).status,401);const userCookie=await login(user),adminCookie=await login(admin);
  for(const method of ['GET','PATCH'])assert.equal((await request(`/admin/demo-requests${method==='PATCH'?'/'+ids[0]:''}`,method,method==='PATCH'?{status:'closed'}:undefined,userCookie,{'If-Match':'"1"'})).status,403);
  assert.equal((await request('/admin/demo-requests?status=bad','GET',undefined,adminCookie)).status,400);assert.equal((await request('/admin/demo-requests?page=1&page=2','GET',undefined,adminCookie)).status,400);
  for(let i=1;i<ids.length;i++)assert.equal((await request('/demo-requests','POST',{...input,requestId:ids[i],name:`Visitor ${i}`})).status,201);
  const list=async(page=1,status='all')=>(await (await request(`/admin/demo-requests?search=${marker}&page=${page}&pageSize=10&status=${status}`,'GET',undefined,adminCookie)).json());
  const first=await list(),second=await list(2);assert.equal(first.meta.total,12);assert.equal(first.data.length,10);assert.equal(second.data.length,2);assert.equal(new Set([...first.data,...second.data].map(row=>row.id)).size,12);
  const detail=await request(`/admin/demo-requests/${ids[0]}`,'GET',undefined,adminCookie);assert.equal(detail.headers.get('cache-control'),'no-store');assert.equal((await detail.json()).data.name,'Demo visitor');
  assert.equal((await request(`/admin/demo-requests/${ids[0]}`,'PATCH',{status:'contacted'},adminCookie)).status,428);
  assert.equal((await request(`/admin/demo-requests/${ids[0]}`,'PATCH',{status:'contacted'},adminCookie,{'If-Match':'"1"'})).status,204);
  assert.equal((await request(`/admin/demo-requests/${ids[0]}`,'PATCH',{status:'closed'},adminCookie,{'If-Match':'"1"'})).status,409);
  assert.equal((await list(1,'contacted')).meta.total,1);assert.equal((await list(1,'new')).meta.total,11);
  assert.equal((await request(`/admin/demo-requests/${ids[0]}`,'PATCH',{status:'closed'},adminCookie,{'If-Match':'"2"',Origin:'https://untrusted.test'})).status,403);
  assert.equal((await request(`/admin/demo-requests/${ids[0]}`,'PATCH',{status:'closed'},adminCookie,{'If-Match':'"2"'})).status,204);
  assert.equal((await request(`/admin/demo-requests/${randomUUID()}`,'PATCH',{status:'new'},adminCookie,{'If-Match':'"1"'})).status,404);
  assert.equal((await list(1,'closed')).meta.total,1);assert.equal((await request('/demo-requests','POST',input)).status,201);
  const [[after]]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) total FROM admins');assert.equal(after.total,before.total);
  const [[stored]]=await pool.execute<RowDataPacket[]>('SELECT status,revision,email FROM demo_requests WHERE id=?',[ids[0]]);assert.equal(stored.status,'closed');assert.equal(stored.revision,3);assert.equal(stored.email,'visitor@example.test');
 }finally{
  if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));
  await pool.query('DELETE FROM demo_requests WHERE id IN (?)',[ids]);await pool.execute('DELETE FROM sessions WHERE admin_id IN (?,?)',[admin,user]);await pool.execute('DELETE FROM admins WHERE id IN (?,?)',[admin,user]);await pool.execute('DELETE FROM organizations WHERE id=?',[org]);await pool.end();
 }
});
test('public submissions are rate limited with a JSON response',async()=>{
 const pool=createDatabasePool(readConfig().database),id=randomUUID();const server=createApp({demoRequests:createDemoRequestRouters(pool,{submissionLimit:1}),auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5176']}}).listen(0,'127.0.0.1');await once(server,'listening');
 try{const address=server.address();assert.ok(address&&typeof address!=='string');const send=()=>fetch(`http://127.0.0.1:${address.port}/api/v1/demo-requests`,{method:'POST',headers:{Origin:'http://127.0.0.1:5176','Content-Type':'application/json','X-Kindsight-Request':'1'},body:JSON.stringify({requestId:id,name:'Rate limit fixture',email:'fixture@example.test'})});assert.equal((await send()).status,201);const limited=await send();assert.equal(limited.status,429);assert.equal((await limited.json()).error.code,'DEMO_REQUEST_LIMIT');assert.ok(limited.headers.get('retry-after'));}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await pool.execute('DELETE FROM demo_requests WHERE id=?',[id]);await pool.end();}
});
