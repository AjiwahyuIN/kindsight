import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'vite';
import {createUsersRouter} from '../server/react/users.ts';
import {createOrganizationsRouter} from '../server/react/organizations.ts';
import {createDemoRequestRouters} from '../server/react/demo-requests.ts';
import {createAdminOverviewRouter} from '../server/react/admin-overview.ts';
import {createApp} from '../server/app.js';
import {createContentRouter} from '../server/react/content.ts';
import {createAuthRepository} from '../server/repositories/auth.js';
import {createFundraisingRepository} from '../server/repositories/fundraising.js';
import {createDashboardRepository} from '../server/repositories/dashboard.js';
import {createPartnerLogoRepository} from '../server/repositories/partner-logos.js';
import {readConfig} from '../server/config/env.js';
import {createDatabasePool} from '../server/config/database.js';
import {hashPassword} from '../server/auth/password.js';

test('React REST services round trip authenticated MySQL CRUD, reports and all ten CMS sections',async()=>{
 const pool=createDatabasePool(readConfig().database),id=randomUUID(),email=`${id}@example.test`,password=randomBytes(24).toString('hex');
 const storage=await mkdtemp(join(tmpdir(),'kindsight-rest-uploads-'));const uploaded=[];
 const organizationId=randomUUID(),platformId=randomUUID(),demoId=randomUUID(),managedOrgId=randomUUID(),managedUserId=randomUUID();
 const nativeFetch=globalThis.fetch;let server,vite,cookie='';const created={donors:[],campaigns:[],donations:[]},sectionKeys={};
 try{
  await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[organizationId,'Temporary REST organization']);
  await pool.execute('INSERT INTO admins (id,email,name,password_hash) VALUES (?,?,?,?)',[platformId,`${platformId}@example.test`,'Temporary platform admin',await hashPassword(password)]);
  await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[id,email,'Temporary integration admin',await hashPassword(password),'organization_user',organizationId]);
  const [rows]=await pool.query('SELECT section_key,content_json FROM landing_sections');
  for(const row of rows){const section=row.section_key==='navigation'?'navbar':row.section_key==='testimonial'?'testimonials':row.section_key;sectionKeys[section]=`qc-${id}-${section}`;await pool.execute('INSERT INTO landing_sections (section_key,content_json) VALUES (?,?)',[sectionKeys[section],typeof row.content_json==='string'?row.content_json:JSON.stringify(row.content_json)]);}
  const logos=createPartnerLogoRepository(pool);
  server=createApp({users:createUsersRouter(pool),organizations:createOrganizationsRouter(pool),demoRequests:createDemoRequestRouters(pool),overview:createAdminOverviewRouter(pool),auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5176']},fundraising:org=>createFundraisingRepository(pool,org),dashboard:org=>createDashboardRepository(pool,org),logos,logoStorage:storage,content:{public:createContentRouter(pool,{sectionKeys}),admin:createContentRouter(pool,{sectionKeys,admin:true,catalog:()=>logos.list()})}}).listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  globalThis.fetch=async(path,options={})=>{const response=await nativeFetch(new URL(path,base),{...options,headers:{...options.headers,Origin:'http://127.0.0.1:5176',...(cookie?{Cookie:cookie}:{})}});const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return response;};
  vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
  const auth=await vite.ssrLoadModule('/src/services/auth.ts'),crud=await vite.ssrLoadModule('/src/services/fundraising.ts'),cms=await vite.ssrLoadModule('/src/services/content.ts'),reports=await vite.ssrLoadModule('/src/services/dashboard.ts');
  const demo=await vite.ssrLoadModule('/src/services/demo-requests.ts');
  assert.deepEqual(await demo.submitDemoRequest({requestId:demoId,name:'REST demo fixture',email:'demo@example.test',organization:demoId,message:'Reporting walkthrough'}),{id:demoId,received:true});
  assert.equal(await auth.getSession(),null);await assert.rejects(crud.getReferences(),e=>e.status===401);
  assert.equal((await auth.signIn({email,password})).name,'Temporary integration admin');assert.equal((await auth.getSession()).id,id);
  let donor=await crud.saveRecord({entity:'donors',draft:{name:`QC ${id}`,email:'qc@example.test',phone:'',organization:'Test fixture'}});created.donors.push(donor.id);assert.equal(donor.archived,false);assert.equal(donor.revision,1);
  const stale=donor;donor=await crud.saveRecord({entity:'donors',id:donor.id,revision:donor.revision,draft:{name:`Updated ${id}`}});assert.equal(donor.revision,2);
  await assert.rejects(crud.saveRecord({entity:'donors',id:donor.id,revision:stale.revision,draft:{name:'Stale'}}),e=>e.status===409);
  let campaign=await crud.saveRecord({entity:'campaigns',draft:{name:`QC ${id}`,description:'Temporary API fixture',target_amount:'10.00',status:'active',starts_on:'',ends_on:''}});created.campaigns.push(campaign.id);
  const period={from:'2026-10-01',to:'2026-11-01',interval:'day',scenario:'success'};const before=await reports.getDashboardReport(period);
  let donation=await crud.saveRecord({entity:'donations',draft:{donor_id:donor.id,campaign_id:campaign.id,amount:'0.30',status:'received',received_at:'2026-10-20T01:00:00.000Z',expected_at:'',note:'Integration fixture'}});created.donations.push(donation.id);
  const after=await reports.getDashboardReport(period);assert.equal(BigInt(after.summary.totalRaised.replace('.',''))-BigInt(before.summary.totalRaised.replace('.','')),30n);assert.equal(after.summary.donationCount,before.summary.donationCount+1);assert.equal(after.meta.source,'api');assert.equal(after.trend.reduce((total,row)=>total+BigInt(row.totalRaised.replace('.','')),0n),BigInt(after.summary.totalRaised.replace('.','')));
  assert.equal((await reports.getCampaigns('success')).find(row=>row.id===campaign.id).totalRaised,'0.30');
  assert.equal((await crud.listRecords('donations',{page:1,pageSize:10,search:id,archived:'active',status:'received'})).data[0].id,donation.id);
  donation=await crud.setArchived({entity:'donations',id:donation.id,revision:donation.revision,archived:true});assert.equal(donation.archived,true);assert.equal((await reports.getDashboardReport(period)).summary.totalRaised,before.summary.totalRaised);
  await assert.rejects(crud.setArchived({entity:'donations',id:donation.id,revision:1,archived:false}),e=>e.status===409);
  await crud.setArchived({entity:'donations',id:donation.id,revision:donation.revision,archived:false});
  await assert.rejects(cms.getEditableContent('hero'),e=>e.status===403);
  await assert.rejects((await vite.ssrLoadModule('/src/services/admin-overview.ts')).getAdminOverview(),error=>error.status===403);
  await assert.rejects(demo.listDemoRequests({status:'all',search:demoId,page:1,pageSize:10}),error=>error.status===403);
  await auth.signOut();await auth.signIn({email:`${platformId}@example.test`,password});
  const management=await vite.ssrLoadModule('/src/services/organizations.ts');
  const userManagement=await vite.ssrLoadModule('/src/services/users.ts');const initialPassword=randomBytes(24).toString('hex');const newUser=await userManagement.createUser({requestId:managedUserId,name:'REST user fixture',email:`${managedUserId}@example.test`,organizationId},initialPassword);assert.equal(newUser.organization.id,organizationId);assert.equal((await userManagement.listUsers({status:'active',organization:organizationId,search:managedUserId,page:1,pageSize:10})).meta.total,1);await userManagement.setUserActive({id:managedUserId,active:false,revision:1});assert.equal((await userManagement.getUser(managedUserId)).enabled,false);await assert.rejects(userManagement.setUserActive({id:managedUserId,active:true,revision:1}),e=>e.status===409);assert.ok((await userManagement.getUserOrganizations()).some(row=>row.id===organizationId));
  const managed=await management.createOrganization({requestId:managedOrgId,name:`REST management ${managedOrgId}`});assert.equal(managed.accounts,0);await management.setOrganizationActive({id:managed.id,active:false,revision:managed.revision});assert.equal((await management.getOrganization(managed.id)).active,false);assert.equal((await management.listOrganizations({status:'inactive',search:managedOrgId,page:1,pageSize:10})).meta.total,1);await assert.rejects(management.setOrganizationActive({id:managed.id,active:true,revision:1}),e=>e.status===409);
  const platformOverview=await (await vite.ssrLoadModule('/src/services/admin-overview.ts')).getAdminOverview();assert.ok(platformOverview.organizations.total>=1);assert.ok(platformOverview.organizationAccounts.enabled>=1);
  const demoRows=await demo.listDemoRequests({status:'new',search:demoId,page:1,pageSize:10});assert.equal(demoRows.meta.total,1);await demo.updateDemoStatus({id:demoId,status:'contacted',revision:1});assert.equal((await demo.getDemoRequest(demoId)).status,'contacted');await assert.rejects(demo.updateDemoStatus({id:demoId,status:'closed',revision:1}),error=>error.status===409);
  await assert.rejects(crud.getReferences(),e=>e.status===403);
  for(const section of Object.keys(sectionKeys)){
   const saved=await cms.getEditableContent(section);assert.equal(typeof saved.revision,'string');
   let content=structuredClone(saved.content);const field=section==='navbar'?'demoLabel':section==='hero'?'heading':section==='partners'?null:section==='difference'||section==='about'||section==='solutions'||section==='missions'||section==='sectors'?'label':'heading';
   if(field)content[field]+=' QC';else content.items[0].name+=' QC';
   const {validateContent}=await vite.ssrLoadModule('/src/services/content-schema.ts');content=validateContent(section,content,await cms.getLogoCatalog()).content;
   const updated=await cms.saveContent({section,content,revision:saved.revision});assert.deepEqual(updated.content,content);assert.notEqual(updated.revision,saved.revision);
   assert.deepEqual(await cms.getPublicContent(section),content);
   await assert.rejects(cms.saveContent({section,content:saved.content,revision:saved.revision}),e=>e.status===409);
   // Bundled assets are omitted from REST and cannot be injected as database paths.
   const wire=await nativeFetch(`${base}/api/v1/content/${section}`).then(r=>r.json());assert.ok(!JSON.stringify(wire.data).includes('/src/assets/'));
  }
  const image=await readFile(new URL('../src/assets/dashboard/campaign-team-1.png',import.meta.url));
  const upload=await cms.uploadLogo({name:'Temporary REST logo',file:new File([image],'logo.png',{type:'image/png'})});uploaded.push(upload.id);
  assert.ok((await cms.getLogoCatalog()).some(row=>row.id===upload.id));
  const file=await nativeFetch(base+upload.src);assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'image/png');
  const partners=await cms.getEditableContent('partners');partners.content.items=[{logo:upload.id,name:upload.name}];await cms.saveContent({section:'partners',...partners});assert.equal((await cms.getPublicContent('partners')).items[0].logo,upload.id);
  const saved=await cms.getEditableContent('navbar'),bad=structuredClone(saved.content);bad.company.href='javascript:alert(1)';await assert.rejects(cms.saveContent({section:'navbar',content:bad,revision:saved.revision}),e=>e.status===400&&Boolean(e.fields['company.href']));
  const rejected=await nativeFetch(base+'/api/v1/admin/donors',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',Origin:'https://untrusted.test','X-Kindsight-Request':'1'},body:JSON.stringify({name:'Rejected'})});assert.equal(rejected.status,403);
  await auth.signOut();assert.equal(await auth.getSession(),null);
 }finally{
  await pool.execute('DELETE FROM sessions WHERE admin_id=?',[managedUserId]);await pool.execute('DELETE FROM admins WHERE id=?',[managedUserId]);
  await pool.execute('DELETE FROM organizations WHERE id=?',[managedOrgId]);
  await pool.execute('DELETE FROM demo_requests WHERE id=?',[demoId]);
  globalThis.fetch=nativeFetch;await vite?.close();if(server)await new Promise(resolve=>server.close(resolve));
  for(const entity of ['donations','campaigns','donors'])for(const record of created[entity])await pool.execute(`DELETE FROM ${entity} WHERE id=?`,[record]);
  for(const key of Object.values(sectionKeys))await pool.execute('DELETE FROM landing_sections WHERE section_key=?',[key]);
  for(const logo of uploaded)await pool.execute('DELETE FROM partner_logos WHERE id=?',[logo]);await rm(storage,{recursive:true,force:true});
  await pool.execute('DELETE FROM sessions WHERE admin_id IN (?,?)',[id,platformId]);await pool.execute('DELETE FROM admins WHERE id IN (?,?)',[id,platformId]);await pool.execute('DELETE FROM organizations WHERE id=?',[organizationId]);await pool.end();
 }
});
