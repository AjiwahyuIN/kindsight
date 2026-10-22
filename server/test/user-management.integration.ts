import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import type {Server} from 'node:http';
import type {RowDataPacket} from 'mysql2/promise';
import {createApp} from '../app.js';
import {createUsersRouter} from '../react/users.ts';
import {createOrganizationsRouter} from '../react/organizations.ts';
import {createAuthRepository} from '../repositories/auth.js';
import {createFundraisingRepository} from '../repositories/fundraising.js';
import {hashPassword} from '../auth/password.js';
import {createDatabasePool} from '../config/database.js';
import {readConfig} from '../config/env.js';
test('managed users have immutable scope, safe provisioning, revision protection and permanent session revocation',async()=>{
 const pool=createDatabasePool(readConfig().database),org=randomUUID(),otherOrg=randomUUID(),admin=randomUUID(),ids=Array.from({length:12},()=>randomUUID()),failed=randomUUID(),marker=randomUUID(),password=randomBytes(24).toString('hex'),adminPassword=randomBytes(24).toString('hex'),origin='http://127.0.0.1:5176';let server:Server|undefined;
 try{
  for(const[id,name]of [[org,'User fixture'],[otherOrg,'Inactive fixture']])await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[id,name]);await pool.execute('UPDATE organizations SET active=FALSE WHERE id=?',[otherOrg]);
  await pool.execute('INSERT INTO admins (id,name,email,password_hash) VALUES (?,?,?,?)',[admin,'Platform fixture',`${admin}@example.test`,await hashPassword(adminPassword)]);
  const repository=createAuthRepository(pool);server=createApp({users:createUsersRouter(pool),organizations:createOrganizationsRouter(pool),fundraising:id=>createFundraisingRepository(pool,id),auth:{repository,origins:[origin]}}).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api/v1`;
  const headers={Origin:origin,'Content-Type':'application/json','X-Kindsight-Request':'1'};
  const request=(path:string,method='GET',body?:unknown,cookie?:string,extra:Record<string,string>={})=>fetch(base+path,{method,headers:{...headers,...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
  async function login(id:string,secret=password){const response=await request('/auth/login','POST',{email:`${id}@example.test`,password:secret});assert.equal(response.status,200);return response.headers.get('set-cookie')!.split(';')[0];}
  const cookie=await login(admin,adminPassword),input={requestId:ids[0],name:`${marker} User`,email:`${ids[0]}@example.test`,organizationId:org,initialPassword:password};
  assert.equal((await request('/admin/users')).status,401);assert.equal((await request('/users')).status,404);
  for(const extra of [{Origin:'https://untrusted.test'},{'X-Kindsight-Request':''}] as Record<string,string>[])assert.equal((await request('/admin/users','POST',input,cookie,extra)).status,403);
  const response=await request('/admin/users','POST',input,cookie);assert.equal(response.status,201);const created=(await response.json()).data;assert.equal(created.id,ids[0]);assert.equal(created.organization.id,org);assert.equal(created.enabled,true);assert.equal(created.revision,1);assert.ok(!JSON.stringify(created).includes(password));assert.deepEqual(Object.keys(created).sort(),['active','email','enabled','id','name','organization','revision']);
  assert.equal((await request('/admin/users','POST',input,cookie)).status,201);
  assert.equal((await request('/admin/users','POST',{...input,name:'Changed'},cookie)).status,409);
  const [[stored]]=await pool.execute<RowDataPacket[]>('SELECT password_hash,role,organization_id FROM admins WHERE id=?',[ids[0]]);assert.notEqual(stored.password_hash,password);assert.match(stored.password_hash,/^scrypt-v1\$/);assert.equal(stored.role,'organization_user');
  assert.equal((await request('/admin/users','POST',{...input,requestId:failed,email:input.email.toUpperCase()},cookie)).status,409);
  for(const field of [{role:'platform_admin'},{active:false},{organization_id:otherOrg},{initialPassword:'short'},{email:'bad'},{name:' '},{initialPassword:12345}])assert.equal((await request('/admin/users','POST',{...input,requestId:failed,...field},cookie)).status,400);
  assert.equal((await request('/admin/users','POST',{...input,requestId:failed,email:`${failed}@example.test`,organizationId:otherOrg},cookie)).status,409);
  assert.equal((await request('/admin/users','POST',{...input,requestId:failed,email:`${failed}@example.test`,organizationId:randomUUID()},cookie)).status,404);
  const userCookie=await login(ids[0]),secondSession=await login(ids[0]);
  assert.equal((await request('/admin/users','GET',undefined,userCookie)).status,403);assert.equal((await request('/admin/users','POST',{...input,requestId:failed},userCookie)).status,403);assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:false},userCookie,{'If-Match':'"1"'})).status,403);
  assert.equal((await request(`/admin/users/${admin}`,'GET',undefined,cookie)).status,404);assert.equal((await request(`/admin/users/${admin}`,'PATCH',{active:false},cookie,{'If-Match':'"1"'})).status,404);
  for(let i=1;i<ids.length;i++){assert.equal((await request('/admin/users','POST',{...input,requestId:ids[i],name:`${marker} User ${i}`,email:`${ids[i]}@example.test`},cookie)).status,201);}
  const otherCookie=await login(ids[1]);
  const list=async(page=1,status='all')=>(await (await request(`/admin/users?organization=${org}&search=${marker}&page=${page}&pageSize=10&status=${status}`,'GET',undefined,cookie)).json());
  const first=await list(),second=await list(2);assert.equal(first.meta.total,12);assert.equal(first.data.length,10);assert.equal(second.data.length,2);assert.equal(new Set([...first.data,...second.data].map(row=>row.id)).size,12);assert.ok(!JSON.stringify(first).includes('password_hash'));
  for(const query of ['page=1&page=2','organization=invalid','pageSize=1000','status=blocked','role=platform_admin'])assert.equal((await request('/admin/users?'+query,'GET',undefined,cookie)).status,400);
  const detail=await request(`/admin/users/${ids[0]}`,'GET',undefined,cookie);assert.equal(detail.headers.get('cache-control'),'no-store');
  for(const field of [{role:'platform_admin'},{organizationId:otherOrg},{initialPassword:'new password value'},{name:'Changed'}])assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:false,...field},cookie,{'If-Match':'"1"'})).status,400);
  assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:false},cookie)).status,428);
  assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:false},cookie,{'If-Match':'"1"'})).status,204);
  const [[sessions]]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) total FROM sessions WHERE admin_id=?',[ids[0]]);assert.equal(sessions.total,0);
  for(const value of [userCookie,secondSession])assert.equal((await request('/auth/me','GET',undefined,value)).status,401);
  assert.equal((await request('/auth/me','GET',undefined,otherCookie)).status,200);
  assert.equal((await request('/auth/login','POST',{email:input.email,password})).status,401);
  assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:true},cookie,{'If-Match':'"1"'})).status,409);
  assert.equal((await list(1,'inactive')).meta.total,1);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false},cookie,{'If-Match':'"1"'})).status,204);
  assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:true},cookie,{'If-Match':'"2"'})).status,409);
  const blocked=await list(1,'active');assert.equal(blocked.meta.total,11);assert.equal(blocked.data[0].enabled,false);assert.equal(blocked.data[0].organization.active,false);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:true},cookie,{'If-Match':'"2"'})).status,204);
  assert.equal((await request(`/admin/users/${ids[0]}`,'PATCH',{active:true},cookie,{'If-Match':'"2"'})).status,204);assert.equal((await request('/auth/me','GET',undefined,userCookie)).status,401);
  const renewed=await login(ids[0]);assert.equal((await request('/app/donors','GET',undefined,renewed)).status,200);assert.equal((await request('/app/donors','GET',undefined,cookie)).status,403);
  const [[unchanged]]=await pool.execute<RowDataPacket[]>('SELECT password_hash FROM admins WHERE id=?',[ids[0]]);assert.equal(unchanged.password_hash,stored.password_hash);
  const db=await pool.getConnection();try{await db.beginTransaction();await db.execute('SELECT id FROM organizations WHERE id=? FOR UPDATE',[org]);await db.execute('SELECT id FROM admins WHERE id=? FOR UPDATE',[ids[0]]);const delayed=repository.saveSession({hash:randomBytes(32).toString('hex'),adminId:ids[0],expiresAt:new Date(Date.now()+60000)});await db.execute('UPDATE admins SET active=FALSE,revision=revision+1 WHERE id=?',[ids[0]]);await db.execute('DELETE FROM sessions WHERE admin_id=?',[ids[0]]);await db.commit();assert.equal(await delayed,false);}finally{db.release();}
  assert.equal((await request(`/admin/users/${ids[0]}`,'DELETE',{},cookie)).status,404);
 }finally{
  if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));await pool.query('DELETE FROM sessions WHERE admin_id IN (?)',[[admin,...ids,failed]]);await pool.query('DELETE FROM admins WHERE id IN (?)',[[admin,...ids,failed]]);await pool.execute('DELETE FROM organizations WHERE id IN (?,?)',[org,otherOrg]);await pool.end();
 }
});
