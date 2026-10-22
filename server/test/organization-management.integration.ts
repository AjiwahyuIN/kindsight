import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import type {Server} from 'node:http';
import type {RowDataPacket} from 'mysql2/promise';
import {createApp} from '../app.js';
import {createOrganizationsRouter} from '../react/organizations.ts';
import {createAdminOverviewRouter} from '../react/admin-overview.ts';
import {createAuthRepository} from '../repositories/auth.js';
import {createFundraisingRepository} from '../repositories/fundraising.js';
import {hashPassword} from '../auth/password.js';
import {createDatabasePool} from '../config/database.js';
import {readConfig} from '../config/env.js';
test('organization management enforces admin access, revisions, session revocation and preserved history',async()=>{
 const pool=createDatabasePool(readConfig().database),org=randomUUID(),otherOrg=randomUUID(),admin=randomUUID(),user=randomUUID(),otherUser=randomUUID(),donor=randomUUID(),campaign=randomUUID(),donation=randomUUID(),password=randomBytes(24).toString('hex'),origin='http://127.0.0.1:5176',marker=randomUUID();const created=[org];let server:Server|undefined;
 try{
  await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[otherOrg,'Untouched fixture']);const hash=await hashPassword(password);
  await pool.execute('INSERT INTO admins (id,email,name,password_hash) VALUES (?,?,?,?)',[admin,`${admin}@example.test`,'Management fixture',hash]);
  const repository=createAuthRepository(pool);
  server=createApp({organizations:createOrganizationsRouter(pool),overview:createAdminOverviewRouter(pool),fundraising:id=>createFundraisingRepository(pool,id),auth:{repository,origins:[origin]}}).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api/v1`;
  const headers={Origin:origin,'Content-Type':'application/json','X-Kindsight-Request':'1'};
  const request=(path:string,method='GET',body?:unknown,cookie?:string,extra:Record<string,string>={})=>fetch(base+path,{method,headers:{...headers,...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
  async function login(id:string){const response=await request('/auth/login','POST',{email:`${id}@example.test`,password});assert.equal(response.status,200);return response.headers.get('set-cookie')!.split(';')[0];}
  assert.equal((await request('/admin/organizations')).status,401);const adminCookie=await login(admin);
  const post=await request('/admin/organizations','POST',{requestId:org,name:`  ${marker} Primary  `},adminCookie);assert.equal(post.status,201);assert.deepEqual((await post.json()).data,{id:org,name:`${marker} Primary`,active:true,revision:1,accounts:0});
  assert.equal((await request('/admin/organizations','POST',{requestId:org,name:`${marker} Primary`},adminCookie)).status,201);
  assert.equal((await request('/admin/organizations','POST',{requestId:org,name:'Changed'},adminCookie)).status,409);
  for(const name of ['   ','x'.repeat(161),'bad\nname'])assert.equal((await request('/admin/organizations','POST',{requestId:org,name},adminCookie)).status,400);
  assert.equal((await request('/admin/organizations','POST',{requestId:org,name:'No',role:'platform_admin'},adminCookie)).status,400);
  for(const[id,organization]of [[user,org],[otherUser,otherOrg]])await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[id,`${id}@example.test`,'Scoped fixture',hash,'organization_user',organization]);
  await pool.execute('INSERT INTO donors (id,name,organization_id) VALUES (?,?,?)',[donor,'History fixture',org]);await pool.execute('INSERT INTO campaigns (id,name,description,target_amount,organization_id) VALUES (?,?,?,?,?)',[campaign,'History fixture','','1.00',org]);await pool.execute('INSERT INTO donations (id,donor_id,campaign_id,amount,organization_id) VALUES (?,?,?,?,?)',[donation,donor,campaign,'1.00',org]);
  const cookie=await login(user),otherCookie=await login(otherUser);
  for(const[path,method,input]of [['/admin/organizations','GET',undefined],['/admin/organizations','POST',{requestId:randomUUID(),name:'Forbidden'}],[`/admin/organizations/${org}`,'GET',undefined],[`/admin/organizations/${org}`,'PATCH',{active:false}]] as const)assert.equal((await request(path,method,input,cookie,{'If-Match':'"1"'})).status,403);
  const listResponse=await request(`/admin/organizations?search=${marker}&pageSize=10&page=1&status=active`,'GET',undefined,adminCookie);assert.equal(listResponse.headers.get('cache-control'),'no-store');const list=await listResponse.json();assert.equal(list.meta.total,1);assert.equal(list.data[0].accounts,1);
  for(const query of ['status=evil','page=1&page=2','page=-1','pageSize=1000','role=platform_admin'])assert.equal((await request('/admin/organizations?'+query,'GET',undefined,adminCookie)).status,400);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false},adminCookie)).status,428);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false},adminCookie,{'If-Match':'"1"',Origin:'https://untrusted.test'})).status,403);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false},adminCookie,{'If-Match':'"1"','X-Kindsight-Request':''})).status,403);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false,organization_id:otherOrg},adminCookie,{'If-Match':'"1"'})).status,400);
  const overview=async()=>(await (await request('/admin/overview','GET',undefined,adminCookie)).json()).data;const before=await overview();
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:false},adminCookie,{'If-Match':'"1"'})).status,204);
  const [[sessions]]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) total FROM sessions WHERE admin_id=?',[user]);assert.equal(sessions.total,0); // Check before auth middleware can prune anything.
  assert.equal((await overview()).organizations.active,before.organizations.active-1);assert.equal((await overview()).organizationAccounts.enabled,before.organizationAccounts.enabled-1);
  assert.equal((await request('/auth/me','GET',undefined,cookie)).status,401);assert.equal((await request('/auth/me','GET',undefined,otherCookie)).status,200);
  assert.equal((await request('/auth/login','POST',{email:`${user}@example.test`,password})).status,401);
  assert.equal(await repository.saveSession({hash:randomBytes(32).toString('hex'),adminId:user,expiresAt:new Date(Date.now()+60000)}),false);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:true},adminCookie,{'If-Match':'"1"'})).status,409);
  assert.equal((await request(`/admin/organizations/${org}`,'PATCH',{active:true},adminCookie,{'If-Match':'"2"'})).status,204);
  assert.equal((await request('/auth/me','GET',undefined,cookie)).status,401);await login(user);
  const [[history]]=await pool.execute<RowDataPacket[]>('SELECT amount,donor_id,campaign_id FROM donations WHERE id=?',[donation]);assert.equal(history.amount,'1.00');assert.equal(history.donor_id,donor);assert.equal(history.campaign_id,campaign);
  assert.equal((await request('/app/donations','GET',undefined,adminCookie)).status,403);
  assert.equal((await request(`/admin/organizations/${randomUUID()}`,'PATCH',{active:false},adminCookie,{'If-Match':'"1"'})).status,404);
  // A login verified just before deactivation cannot insert a session after the org lock is released.
  const db=await pool.getConnection();try{await db.beginTransaction();await db.execute('SELECT id FROM organizations WHERE id=? FOR UPDATE',[org]);const delayed=repository.saveSession({hash:randomBytes(32).toString('hex'),adminId:user,expiresAt:new Date(Date.now()+60000)});await db.execute('UPDATE organizations SET active=FALSE,revision=revision+1 WHERE id=?',[org]);await db.execute('DELETE FROM sessions WHERE admin_id=?',[user]);await db.commit();assert.equal(await delayed,false);}finally{db.release();}
  for(let i=0;i<11;i++){const id=randomUUID();created.push(id);await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[id,`${marker} Page ${i}`]);}
  const page=async(n:number)=>(await (await request(`/admin/organizations?search=${marker}&page=${n}&pageSize=10`,'GET',undefined,adminCookie)).json());const first=await page(1),second=await page(2);assert.equal(first.meta.total,12);assert.equal(first.data.length,10);assert.equal(second.data.length,2);assert.equal(new Set([...first.data,...second.data].map(row=>row.id)).size,12);
  assert.equal((await request(`/admin/organizations/${org}`,'DELETE',{},adminCookie)).status,404);
 }finally{
  if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));
  await pool.execute('DELETE FROM donations WHERE id=?',[donation]);await pool.execute('DELETE FROM campaigns WHERE id=?',[campaign]);await pool.execute('DELETE FROM donors WHERE id=?',[donor]);await pool.execute('DELETE FROM sessions WHERE admin_id IN (?,?,?)',[admin,user,otherUser]);await pool.execute('DELETE FROM admins WHERE id IN (?,?,?)',[admin,user,otherUser]);await pool.query('DELETE FROM organizations WHERE id IN (?)',[[...created,otherOrg]]);await pool.end();
 }
});
