import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { createAuthRepository } from '../repositories/auth.js';
import { createFundraisingRepository } from '../repositories/fundraising.js';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import { hashPassword } from '../auth/password.js';

async function fixture(run) {
  const pool = createDatabasePool(readConfig().database);
  const organizationId=randomUUID();
  const adminId = randomUUID(), email = `${adminId}@example.test`, password = randomBytes(20).toString('hex');
  const tag = `CRUD-${randomUUID()}`;
  const ids = {donors:[],campaigns:[],donations:[]};
  let server;
  try {
    await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[organizationId,'Temporary test organization']);
    await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?, ?, ?, ?,?,?)',[adminId,email,'Temporary CRUD test',await hashPassword(password),'organization_user',organizationId]);
    server = createApp({auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5175']},fundraising:org=>createFundraisingRepository(pool,org)}).listen(0,'127.0.0.1');
    await once(server,'listening');
    const url = `http://127.0.0.1:${server.address().port}/api/v1`;
    const headers = {'Content-Type':'application/json','X-Kindsight-Request':'1',Origin:'http://127.0.0.1:5175'};
    const login = await fetch(`${url}/auth/login`,{method:'POST',headers,body:JSON.stringify({email,password})});
    assert.equal(login.status,200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    async function request(path,method = 'GET',body,authenticated = true,extra = {}) {
      const response = await fetch(`${url}/app/${path}`,{method,headers:{...headers,...(authenticated ? {Cookie:cookie} : {}),...extra},...(method !== 'GET' ? {body:JSON.stringify(body ?? {})} : {})});
      const payload = response.status === 204 ? null : await response.json();
      return {status:response.status,...payload};
    }
    async function create(entity,body) {
      const response = await request(entity,'POST',body);
      if (response.data?.id) ids[entity].push(response.data.id);
      assert.equal(response.status,201,JSON.stringify(response)); return response.data;
    }
    await run({pool,request,create,tag,ids});
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    for (const entity of ['donations','campaigns','donors']) for (const id of ids[entity]) await pool.execute(`DELETE FROM ${entity} WHERE id = ?`,[id]);
    await pool.execute('DELETE FROM sessions WHERE admin_id = ?',[adminId]);
    await pool.execute('DELETE FROM admins WHERE id = ?',[adminId]);
    await pool.execute('DELETE FROM organizations WHERE id=?',[organizationId]);
    await pool.end();
  }
}

const campaignBody = name => ({name,description:'Local fixture',target_amount:'1000.00',currency:'USD',starts_on:'2026-01-01',ends_on:'2026-12-31',status:'active'});

test('donor create/read/update, literal search, pagination, archive and restore persist in MySQL',async () => fixture(async ({request,create,tag,pool}) => {
  const first = await create('donors',{name:`${tag} O'Neil 100%`,email:'DONOR@example.test'});
  await create('donors',{name:`${tag} Second`}); await create('donors',{name:`${tag} Third`});
  assert.equal(first.email,'donor@example.test');
  const list = await request(`donors?search=${encodeURIComponent(tag)}&pageSize=2`);
  assert.equal(list.meta.total,3); assert.equal(list.meta.pages,2); assert.equal(list.data.length,2);
  assert.equal((await request(`donors?search=${encodeURIComponent(tag)}&pageSize=2&page=2`)).data.length,1);
  assert.equal((await request(`donors?search=${encodeURIComponent(tag + " O'Neil 100%")}`)).meta.total,1);
  assert.equal((await request(`donors/${first.id}`)).data.name,first.name);
  assert.equal((await request(`donors/${first.id}`,'PATCH',{organization:'Updated fixture'})).data.organization,'Updated fixture');
  const [[stored]] = await pool.execute('SELECT organization FROM donors WHERE id = ?',[first.id]);
  assert.equal(stored.organization,'Updated fixture');
  assert.equal((await request(`donors/${first.id}`,'DELETE')).status,204);
  assert.equal((await request(`donors?search=${tag}`)).meta.total,2);
  assert.equal((await request(`donors?search=${tag}&archived=archived`)).meta.total,1);
  assert.equal((await request(`donors/${first.id}`,'PATCH',{name:'blocked'})).status,409);
  assert.equal((await request(`donors/${first.id}/restore`,'POST')).status,200);
  assert.equal((await request(`donors?search=${tag}`)).meta.total,3);
}));

test('campaign validation, exact money, partial edits, status filtering and archive/restore',async () => fixture(async ({request,create,tag}) => {
  const campaign = await create('campaigns',campaignBody(tag));
  const updated = await request(`campaigns/${campaign.id}`,'PATCH',{target_amount:'9999999999999.99',status:'completed'});
  assert.equal(updated.data.target_amount,'9999999999999.99');
  assert.equal((await request(`campaigns?search=${tag}&status=completed`)).meta.total,1);
  for (const body of [
    {...campaignBody(tag),ends_on:'2025-12-31'}, {...campaignBody(tag),starts_on:'2026-02-30'},
    {...campaignBody(tag),target_amount:'1e3'}, {...campaignBody(tag),target_amount:'10000000000000'}, {...campaignBody(tag),currency:'IDR'},
  ]) assert.equal((await request('campaigns','POST',body)).status,400);
  assert.equal((await request(`campaigns/${campaign.id}`,'DELETE')).status,204);
  assert.equal((await request(`campaigns/${campaign.id}/restore`,'POST')).status,200);
}));

test('donations support anonymous/general giving, date/status validation and retain archived relationships',async () => fixture(async ({request,create,tag,pool}) => {
  const donor = await create('donors',{name:tag});
  const campaign = await create('campaigns',campaignBody(tag));
  const donation = await create('donations',{amount:'0.10',status:'received',currency:'USD',received_at:'2026-10-19T10:00:00Z',donor_id:donor.id,campaign_id:campaign.id,note:tag});
  const anonymous = await create('donations',{amount:'0.20',status:'pending',currency:'USD',donor_id:null,campaign_id:null,expected_at:'2026-10-20T12:30:00Z',note:tag});
  assert.equal(anonymous.donor_id,null); assert.equal(anonymous.campaign_id,null);
  assert.equal((await request(`donations?search=${tag}`)).meta.total,2);
  const changed = await request(`donations/${anonymous.id}`,'PATCH',{status:'received',received_at:'2026-10-20T12:30:00Z'});
  assert.equal(changed.data.expected_at,null);
  const [[total]] = await pool.execute('SELECT SUM(amount) AS amount FROM donations WHERE id IN (?, ?)',[donation.id,anonymous.id]);
  assert.equal(total.amount,'0.30');
  await request(`donors/${donor.id}`,'DELETE'); await request(`campaigns/${campaign.id}`,'DELETE');
  const historical = (await request(`donations?search=${tag}`)).data.find(row => row.id === donation.id);
  assert.equal(historical.donor_name,tag); assert.ok(historical.donor_archived_at);
  assert.equal((await request(`donations/${donation.id}`,'PATCH',{note:tag + ' preserved'})).status,200);
  assert.equal((await request('donations','POST',{amount:'1.00',status:'pending',donor_id:donor.id})).status,409);
  assert.equal((await request('donations','POST',{amount:'1.00',status:'pending',campaign_id:campaign.id})).status,409);
  assert.equal((await request('donations','POST',{amount:'1.00',status:'pending',donor_id:randomUUID()})).status,409);
  for (const body of [{amount:'0.00',status:'pending'},{amount:'1.001',status:'pending'},{amount:1,status:'pending'},{amount:'1.00',status:'received'},{amount:'1.00',status:'received',received_at:'2026-02-30T10:00:00Z'}]) {
    assert.equal((await request('donations','POST',body)).status,400);
  }
  assert.equal((await request(`donations/${donation.id}`,'DELETE')).status,204);
  assert.equal((await request(`donations/${donation.id}/restore`,'POST')).status,200);
  assert.equal((await request(`donations/${donation.id}`)).data.amount,'0.10');
}));

test('all CRUD endpoints require auth; mutation origin, IDs, unknown fields and filters are checked',async () => fixture(async ({request,create,tag}) => {
  const id = randomUUID();
  for (const entity of ['donors','campaigns','donations']) {
    for (const [path,method] of [[entity,'GET'],[entity,'POST'],[`${entity}/${id}`,'GET'],[`${entity}/${id}`,'PATCH'],[`${entity}/${id}`,'DELETE'],[`${entity}/${id}/restore`,'POST']]) {
      assert.equal((await request(path,method,{},false)).status,401);
    }
  }
  assert.equal((await request('donors','POST',{name:tag},true,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await request('donors','POST',{name:tag,archived_at:null})).status,400);
  assert.equal((await request('donors/invalid')).status,400);
  assert.equal((await request(`donors/${id}`)).status,404);
  for (const query of ['page=0','pageSize=1000','search[x]=bad','sort=arbitrary','archived=wrong']) assert.equal((await request(`donors?${query}`)).status,400);
  const donor = await create('donors',{name:tag});
  assert.equal((await request(`donors/${donor.id}`,'PATCH',{})).status,400);
}));
