import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {createApp} from '../app.js';
import {createAuthRepository} from '../repositories/auth.js';
import {createFundraisingRepository} from '../repositories/fundraising.js';
import {createDashboardRepository} from '../repositories/dashboard.js';
import {createLandingRepository} from '../repositories/landing.js';
import {createPartnerLogoRepository} from '../repositories/partner-logos.js';
import {hashPassword} from '../auth/password.js';
import {createDatabasePool} from '../config/database.js';
import {readConfig} from '../config/env.js';
const origin='http://127.0.0.1:5176',headers={Origin:origin,'Content-Type':'application/json','X-Kindsight-Request':'1'};
test('two organizations isolate every ledger path; platform admin cannot bypass scope; revocation is persistent',async()=>{
 const pool=createDatabasePool(readConfig().database),orgA=randomUUID(),orgB=randomUUID(),userA=randomUUID(),userB=randomUUID(),admin=randomUUID(),password=randomBytes(24).toString('hex');let server;
 try{
  for(const org of [orgA,orgB])await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[org,`Isolated fixture ${org}`]);
  const hash=await hashPassword(password);
  for(const[id,role,org]of [[userA,'organization_user',orgA],[userB,'organization_user',orgB],[admin,'platform_admin',null]])await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[id,`${id}@example.test`,'Temporary scope fixture',hash,role,org]);
  server=createApp({auth:{repository:createAuthRepository(pool),origins:[origin]},fundraising:org=>createFundraisingRepository(pool,org),dashboard:org=>createDashboardRepository(pool,org),landing:createLandingRepository(pool),logos:createPartnerLogoRepository(pool)}).listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  async function login(id){const response=await fetch(base+'/auth/login',{method:'POST',headers,body:JSON.stringify({email:`${id}@example.test`,password})});assert.equal(response.status,200);const body=await response.json();assert.equal(body.data.user.id,id);assert.equal('password_hash'in body.data.user,false);return response.headers.get('set-cookie').split(';')[0];}
  const cookieA=await login(userA),cookieB=await login(userB),cookieAdmin=await login(admin);
  async function request(cookie,path,method='GET',body,extra={}){const response=await fetch(base+path,{method,headers:{...headers,...(cookie?{Cookie:cookie}:{}),...extra},...(!['GET','HEAD'].includes(method)?{body:JSON.stringify(body??{})}:{})});return {status:response.status,...(response.status===204?{}:await response.json())};}
  const period='from=2026-10-01&to=2026-11-01';
  const donorA=await request(cookieA,'/app/donors','POST',{name:'Identical donor'}),donorB=await request(cookieB,'/app/donors','POST',{name:'Identical donor'});assert.equal(donorA.status,201);assert.equal(donorB.status,201);
  const campaignBody={name:'Identical campaign',description:'Fixture',target_amount:'10.00',status:'active'};
  const campaignA=await request(cookieA,'/app/campaigns','POST',campaignBody),campaignB=await request(cookieB,'/app/campaigns','POST',campaignBody);assert.equal(campaignA.status,201);assert.equal(campaignB.status,201);
  const gift={amount:'1.25',status:'received',received_at:'2026-10-20T12:00:00Z',donor_id:donorA.data.id,campaign_id:campaignA.data.id};
  const donationA=await request(cookieA,'/app/donations','POST',gift);assert.equal(donationA.status,201);
  assert.equal((await request(cookieB,'/app/donations','POST',{...gift,donor_id:donorB.data.id,campaign_id:campaignB.data.id,amount:'9.50'})).status,201);
  for(const[cookie,org,donor,campaign,total]of [[cookieA,orgA,donorA,campaignA,'1.25'],[cookieB,orgB,donorB,campaignB,'9.50']]){
   const me=await request(cookie,'/auth/me');assert.equal(me.data.user.organization.id,org);assert.equal(me.data.user.role,'organization_user');
   for(const entity of ['donors','campaigns','donations']){const list=await request(cookie,`/app/${entity}?archived=all&pageSize=1`);assert.equal(list.meta.total,1);assert.equal(list.data[0].organization_id,org);assert.equal((await request(cookie,`/app/${entity}?page=2&pageSize=1`)).data.length,0);}
   assert.equal((await request(cookie,'/app/donors?search=Identical')).data[0].id,donor.data.id);
   const summary=await request(cookie,`/app/dashboard/summary?${period}`);assert.equal(summary.data.totalRaised,total);
   const trend=await request(cookie,`/app/dashboard/trend?${period}&interval=month`);assert.equal(trend.data[0].totalRaised,total);
   const campaigns=await request(cookie,'/app/dashboard/campaigns?archived=all');assert.equal(campaigns.meta.total,1);assert.equal(campaigns.data[0].id,campaign.data.id);assert.equal(campaigns.data[0].totalRaised,total);
   for(const path of ['/admin/landing/hero','/admin/content/hero','/admin/organizations','/admin/users','/admin/donors','/admin/dashboard/summary'])assert.equal((await request(cookie,path)).status,403);
   assert.equal((await request(cookie,'/admin/partner-logos','POST',{})).status,403);
  }
  for(const[entity,id]of [['donors',donorB.data.id],['campaigns',campaignB.data.id]])for(const[method,suffix,body]of [['GET',''],['PATCH','',{name:'Cross tenant'}],['DELETE',''],['POST','/restore',{}]])assert.equal((await request(cookieA,`/app/${entity}/${id}${suffix}`,method,body)).status,404);
  const otherDonation=(await request(cookieB,'/app/donations')).data[0];
  for(const[method,suffix,body]of [['GET',''],['PATCH','',{amount:'1.00'}],['DELETE',''],['POST','/restore',{}]])assert.equal((await request(cookieA,`/app/donations/${otherDonation.id}${suffix}`,method,body)).status,404);
  assert.equal((await request(cookieA,`/app/dashboard/summary?${period}&campaignId=${campaignB.data.id}`)).status,404);
  assert.equal((await request(cookieA,'/app/donations','POST',{...gift,donor_id:donorB.data.id})).status,409);
  assert.equal((await request(cookieA,'/app/donations','POST',{...gift,campaign_id:campaignB.data.id})).status,409);
  for(const field of ['organization_id','role'])assert.equal((await request(cookieA,'/app/donors','POST',{name:'Forged',[field]:orgB})).status,400);
  assert.equal((await request(cookieA,`/app/donors?organization_id=${orgB}`)).status,400);
  assert.equal((await request(cookieA,'/app/donors','GET',undefined,{'X-Organization-Id':orgB})).data[0].organization_id,orgA);
  await assert.rejects(pool.execute('INSERT INTO donations (id,organization_id,donor_id,campaign_id,amount) VALUES (?,?,?,?,?)',[randomUUID(),orgA,donorB.data.id,campaignA.data.id,'1.00']),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  await assert.rejects(pool.execute('UPDATE admins SET organization_id=NULL WHERE id=?',[userA]),e=>e.code==='ER_CHECK_CONSTRAINT_VIOLATED');
  const archived=await request(cookieA,`/app/donations/${donationA.data.id}`,'DELETE',{}, {'If-Match':'"1"'});assert.equal(archived.status,204);
  assert.equal((await request(cookieA,`/app/dashboard/summary?${period}`)).data.totalRaised,'0.00');assert.equal((await request(cookieB,`/app/dashboard/summary?${period}`)).data.totalRaised,'9.50');
  assert.equal((await request(cookieA,`/app/donations/${donationA.data.id}/restore`,'POST',{}, {'If-Match':'"1"'})).status,409);
  assert.equal((await request(cookieA,`/app/donations/${donationA.data.id}/restore`,'POST',{}, {'If-Match':'"2"'})).status,200);
  assert.equal((await request(cookieAdmin,'/admin/landing/hero')).status,200);
  assert.equal((await request(cookieAdmin,'/app/donors')).status,403);assert.equal((await request(cookieAdmin,'/app/dashboard/summary')).status,403);
  assert.equal((await request(cookieAdmin,'/admin/donors')).status,404);assert.equal((await request(cookieAdmin,'/admin/dashboard/summary')).status,404);
  assert.equal((await request(null,'/app/donors')).status,401);assert.equal((await request(null,'/admin/landing/hero')).status,401);
  await pool.execute('UPDATE organizations SET active=FALSE WHERE id=?',[orgA]);assert.equal((await request(cookieA,'/app/donors')).status,401);
  assert.equal((await request(null,'/auth/login','POST',{email:`${userA}@example.test`,password})).status,401);
  const [[sessions]]=await pool.execute('SELECT COUNT(*) AS total FROM sessions WHERE admin_id=?',[userA]);assert.equal(sessions.total,0);
  await pool.execute('UPDATE organizations SET active=TRUE WHERE id=?',[orgA]);assert.equal((await request(cookieA,'/auth/me')).status,401);assert.equal((await request(cookieB,'/app/donors')).status,200);
  const renewed=await login(userA);await pool.execute('UPDATE admins SET active=FALSE WHERE id=?',[userA]);assert.equal((await request(renewed,'/auth/me')).status,401);
  assert.throws(()=>createFundraisingRepository(pool));assert.throws(()=>createDashboardRepository(pool));
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  for(const table of ['donations','campaigns','donors'])await pool.execute(`DELETE FROM ${table} WHERE organization_id IN (?,?)`,[orgA,orgB]);
  await pool.execute('DELETE FROM sessions WHERE admin_id IN (?,?,?)',[userA,userB,admin]);await pool.execute('DELETE FROM admins WHERE id IN (?,?,?)',[userA,userB,admin]);await pool.execute('DELETE FROM organizations WHERE id IN (?,?)',[orgA,orgB]);await pool.end();
 }
});
