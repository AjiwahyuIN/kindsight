import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { createAuthRepository } from '../repositories/auth.js';
import { createFundraisingRepository } from '../repositories/fundraising.js';
import { createDashboardRepository } from '../repositories/dashboard.js';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import { hashPassword } from '../auth/password.js';

async function fixture(run) {
  const pool=createDatabasePool(readConfig().database);
  const organizationId=randomUUID();
  const adminId=randomUUID(),donorId=randomUUID(),campaignId=randomUUID(),zeroId=randomUUID();
  const email=`${adminId}@example.test`,password=randomBytes(20).toString('hex'),ids=[],tag=`Dashboard fixture ${adminId}`;
  let server;
  try {
    await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[organizationId,'Temporary test organization']);
    await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[adminId,email,'Temporary dashboard test',await hashPassword(password),'organization_user',organizationId]);
    await pool.execute('INSERT INTO donors (organization_id,id,name) VALUES (?,?,?)',[organizationId,donorId,'Temporary dashboard donor']);
    for(const [id,target] of [[campaignId,'0.20'],[zeroId,'0.00']]) await pool.execute('INSERT INTO campaigns (organization_id,id,name,description,target_amount) VALUES (?,?,?,?,?)',[organizationId,id,`${tag} ${id}`,'Temporary fixture',target]);
    const insert=async ({amount='0.10',status='received',received='2026-10-01 00:00:00.000',anonymous=false,archived=false,campaign=campaignId}={})=>{
      const id=randomUUID(); ids.push(id);
      await pool.execute('INSERT INTO donations (organization_id,id,donor_id,campaign_id,amount,status,received_at,archived_at) VALUES (?,?,?,?,?,?,?,?)',[organizationId,id,anonymous?null:donorId,campaign,amount,status,received,archived?'2026-10-02 00:00:00':null]);
      return id;
    };
    server=createApp({auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5175']},fundraising:org=>createFundraisingRepository(pool,org),dashboard:org=>createDashboardRepository(pool,org)}).listen(0,'127.0.0.1');
    await once(server,'listening');
    const base=`http://127.0.0.1:${server.address().port}/api/v1`;
    const headers={'Content-Type':'application/json',Origin:'http://127.0.0.1:5175','X-Kindsight-Request':'1'};
    const login=await fetch(`${base}/auth/login`,{method:'POST',headers,body:JSON.stringify({email,password})});
    assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    const request=async (path,method='GET',body,authenticated=true)=>{
      const response=await fetch(`${base}/app/${path}`,{method,headers:{...headers,...(authenticated?{Cookie:cookie}:{})},...(method!=='GET'?{body:JSON.stringify(body??{})}:{})});
      return {status:response.status,...(response.status===204?{}:await response.json())};
    };
    await run({pool,request,insert,donorId,campaignId,zeroId,tag});
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    for(const id of ids) await pool.execute('DELETE FROM donations WHERE id = ?',[id]);
    await pool.execute('DELETE FROM campaigns WHERE id IN (?,?)',[campaignId,zeroId]);
    await pool.execute('DELETE FROM donors WHERE id = ?',[donorId]);
    await pool.execute('DELETE FROM sessions WHERE admin_id = ?',[adminId]);
    await pool.execute('DELETE FROM admins WHERE id = ?',[adminId]);
    await pool.execute('DELETE FROM organizations WHERE id=?',[organizationId]);
    await pool.end();
  }
}
const query=(campaignId,extra='')=>`from=2026-10-01&to=2026-10-04&campaignId=${campaignId}${extra}`;

test('summary uses received/nonarchived amounts, exact decimals, anonymous counts and exclusive date boundaries',async()=>fixture(async({request,insert,campaignId})=>{
  await insert({amount:'0.10'});
  await insert({amount:'0.20',received:'2026-10-03 23:59:59.999',anonymous:true});
  await insert({amount:'10.00',received:'2026-10-04 00:00:00.000'});
  await insert({amount:'0.20',received:'2026-09-30 23:59:59.999'});
  await insert({amount:'99.00',status:'pending',received:null});
  await insert({amount:'88.00',status:'cancelled',received:null});
  await insert({amount:'77.00',archived:true});
  const result=await request(`dashboard/summary?${query(campaignId)}`);
  assert.equal(result.status,200);
  assert.equal(result.data.totalRaised,'0.30');
  assert.equal(result.data.previousTotalRaised,'0.20');
  assert.equal(result.data.growthPercent,'50.00');
  assert.equal(result.data.averageDonation,'0.15');
  assert.equal(result.data.donationCount,2);
  assert.equal(result.data.knownDonorCount,1);
  assert.equal(result.data.anonymousDonationCount,1);
  assert.equal(result.meta.comparison.from,'2026-09-28');
  assert.equal(result.meta.endExclusive,true);
  assert.equal(result.meta.timeZone,'UTC');
  assert.equal(result.data.unavailableMetrics.forecast.value,null);
}));

test('trend fills empty days/months and its totals match the summary under the same filters',async()=>fixture(async({request,insert,campaignId})=>{
  await insert({amount:'0.01'}); await insert({amount:'0.02',received:'2026-10-03 12:00:00'});
  const summary=await request(`dashboard/summary?${query(campaignId)}`);
  const trend=await request(`dashboard/trend?${query(campaignId)}`);
  assert.equal(trend.status,200);
  assert.deepEqual(trend.data.map(row=>row.totalRaised),['0.01','0.00','0.02']);
  assert.deepEqual(trend.data.map(row=>row.donationCount),[1,0,1]);
  assert.equal(summary.data.totalRaised,'0.03');
  const monthly=await request(`dashboard/trend?from=2026-09-15&to=2026-11-15&campaignId=${campaignId}&interval=month`);
  assert.deepEqual(monthly.data.map(row=>row.bucket),['2026-09-01','2026-10-01','2026-11-01']);
  assert.deepEqual(monthly.data.map(row=>row.totalRaised),['0.00','0.03','0.00']);
  assert.equal(monthly.meta.partialBuckets,'clipped_to_period');
  const empty=await request(`dashboard/summary?from=2020-01-01&to=2020-01-02&campaignId=${campaignId}`);
  assert.equal(empty.data.totalRaised,'0.00'); assert.equal(empty.data.averageDonation,'0.00');
  assert.equal(empty.data.growthPercent,null);
}));

test('lifetime progress exceeds 100 honestly, zero target is unavailable and campaign archiving keeps history',async()=>fixture(async({pool,request,insert,donorId,campaignId,zeroId})=>{
  await insert({amount:'0.30',received:'2025-01-01 00:00:00'});
  await insert({amount:'0.20'});
  let result=await request(`dashboard/campaigns?campaignId=${campaignId}`);
  assert.equal(result.data[0].totalRaised,'0.50');
  assert.equal(result.data[0].progressPercent,'250.00');
  assert.equal(result.meta.scope,'lifetime');
  const zero=await request(`dashboard/campaigns?campaignId=${zeroId}`);
  assert.equal(zero.data[0].progressPercent,null);
  await pool.execute('UPDATE donors SET archived_at=UTC_TIMESTAMP(3) WHERE id=?',[donorId]);
  await pool.execute('UPDATE campaigns SET archived_at=UTC_TIMESTAMP(3) WHERE id=?',[campaignId]);
  result=await request(`dashboard/summary?${query(campaignId)}`);
  assert.equal(result.data.totalRaised,'0.20');
  assert.equal((await request(`dashboard/campaigns?campaignId=${campaignId}`)).meta.total,0);
  assert.equal((await request(`dashboard/campaigns?campaignId=${campaignId}&archived=all`)).data[0].totalRaised,'0.50');
}));

test('CRUD edits and archive/restore immediately change reporting without reseeding or rebuilding',async()=>fixture(async({request,insert,campaignId})=>{
  const id=await insert({amount:'1.00'});
  const total=async()=> (await request(`dashboard/summary?${query(campaignId)}`)).data.totalRaised;
  assert.equal(await total(),'1.00');
  assert.equal((await request(`donations/${id}`,'PATCH',{amount:'2.25'})).status,200);
  assert.equal(await total(),'2.25');
  await request(`donations/${id}`,'DELETE'); assert.equal(await total(),'0.00');
  await request(`donations/${id}/restore`,'POST'); assert.equal(await total(),'2.25');
  await request(`donations/${id}`,'PATCH',{status:'pending'}); assert.equal(await total(),'0.00');
}));

test('dashboard endpoints reject unauthenticated/invalid requests and distinguish missing campaign from empty results',async()=>fixture(async({request,campaignId,insert,tag})=>{
  for(const endpoint of ['summary','trend','campaigns']) {
    assert.equal((await request(`dashboard/${endpoint}`,'GET',undefined,false)).status,401);
    assert.equal((await request(`dashboard/${endpoint}?campaignId=${randomUUID()}`)).status,404);
    assert.equal((await request(`dashboard/${endpoint}?unexpected=value`)).status,400);
  }
  assert.equal((await request('dashboard/summary?from=2026-02-30&to=2026-03-01')).status,400);
  assert.equal((await request('dashboard/trend?interval=hour')).status,400);
  const before=await request('dashboard/summary?from=2026-10-01&to=2026-10-04&campaignId=general');
  await insert({campaign:null,anonymous:true,amount:'7.25'});
  const general=await request('dashboard/summary?from=2026-10-01&to=2026-10-04&campaignId=general');
  assert.equal(BigInt(general.data.totalRaised.replace('.',''))-BigInt(before.data.totalRaised.replace('.','')),725n);
  assert.equal(general.data.knownDonorCount,before.data.knownDonorCount);
  assert.equal(general.data.anonymousDonationCount,before.data.anonymousDonationCount+1);
  const campaigns=await request(`dashboard/campaigns?search=${encodeURIComponent(tag)}&pageSize=1&page=2`);
  assert.equal(campaigns.status,200); assert.equal(campaigns.meta.pages,2); assert.equal(campaigns.data.length,1);
  assert.equal((await request(`dashboard/summary?${query(campaignId)}`)).data.totalRaised,'0.00');
}));
