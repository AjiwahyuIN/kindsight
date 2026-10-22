import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {createApp} from '../app.js';
import {createAdminOverviewRouter} from '../react/admin-overview.ts';
import {createAuthRepository} from '../repositories/auth.js';
import {hashPassword} from '../auth/password.js';
import {createDatabasePool} from '../config/database.js';
import {readConfig} from '../config/env.js';
import type {RowDataPacket} from 'mysql2/promise';
import type {Server} from 'node:http';
test('admin overview reports live operational counts and rejects guests/organization accounts',async()=>{
 const pool=createDatabasePool(readConfig().database),org=randomUUID(),admin=randomUUID(),user=randomUUID(),password=randomBytes(24).toString('hex'),origin='http://127.0.0.1:5176';let server:Server|undefined;
 try{
  await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[org,'Isolated overview fixture']);
  const hash=await hashPassword(password);
  for(const[id,role,organization]of [[admin,'platform_admin',null],[user,'organization_user',org]])await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[id,`${id}@example.test`,'Overview fixture',hash,role,organization]);
  server=createApp({overview:createAdminOverviewRouter(pool),auth:{repository:createAuthRepository(pool),origins:[origin]}}).listen(0,'127.0.0.1');await once(server,'listening');
  const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api/v1`;
  async function login(id:string){const response=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Kindsight-Request':'1'},body:JSON.stringify({email:`${id}@example.test`,password})});assert.equal(response.status,200);return response.headers.get('set-cookie')!.split(';')[0];}
  assert.equal((await fetch(base+'/admin/overview')).status,401);
  assert.equal((await fetch(base+'/admin/overview',{headers:{Cookie:await login(user)}})).status,403);
  const cookie=await login(admin),read=async()=>{const response=await fetch(base+'/admin/overview',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');return (await response.json()).data;};
  const data=await read();
  const [[organizations]]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) total,SUM(active=TRUE) active FROM organizations');
  const [[accounts]]=await pool.query<RowDataPacket[]>("SELECT COUNT(*) total FROM admins WHERE role='organization_user'");
  assert.deepEqual(data.organizations,{total:Number(organizations.total),active:Number(organizations.active)});assert.equal(data.organizationAccounts.total,Number(accounts.total));assert.ok(Number.isFinite(Date.parse(data.updatedAt)));assert.ok(data.landingSections>=0&&data.landingSections<=10);assert.deepEqual(Object.keys(data).sort(),['landingSections','organizationAccounts','organizations','updatedAt']);
  await pool.execute('UPDATE organizations SET active=FALSE WHERE id=?',[org]);const changed=await read();assert.equal(changed.organizations.total,data.organizations.total);assert.equal(changed.organizations.active,data.organizations.active-1);assert.equal(changed.organizationAccounts.enabled,data.organizationAccounts.enabled-1);
  assert.equal((await fetch(base+'/admin/overview/unknown',{headers:{Cookie:cookie}})).status,404);
 }finally{
  if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));
  await pool.execute('DELETE FROM sessions WHERE admin_id IN (?,?)',[admin,user]);await pool.execute('DELETE FROM admins WHERE id IN (?,?)',[admin,user]);await pool.execute('DELETE FROM organizations WHERE id=?',[org]);await pool.end();
 }
});
