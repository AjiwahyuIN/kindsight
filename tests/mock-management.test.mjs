import { test,after,beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cacheDir=await mkdtemp(join(tmpdir(),'kindsight-management-test-'));
const vite=await createServer({configFile:false,cacheDir,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'),storage=new Map();
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}});
after(async()=>{await vite.close();await rm(cacheDir,{recursive:true,force:true});if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;});
const store=await vite.ssrLoadModule('/src/services/mock/store.ts');
const auth=await vite.ssrLoadModule('/src/services/mock/auth.ts');
const crud=await vite.ssrLoadModule('/src/services/mock/fundraising.ts');
const cms=await vite.ssrLoadModule('/src/services/mock/content.ts');
const schema=await vite.ssrLoadModule('/src/services/content-schema.ts');
const {getDashboardReport,getCampaigns}=await vite.ssrLoadModule('/src/services/mock/dashboard.ts');
const {contentDefaults}=await vite.ssrLoadModule('/src/data/content.ts');
const {partnerLogos}=await vite.ssrLoadModule('/src/data/partners.ts');
const filters={page:1,pageSize:10,search:'',archived:'active',status:''};
const donorDraft={name:'Test Donor',email:'test@example.test',phone:'',organization:'Test Organization'};
const donationDraft={donor_id:'',campaign_id:'education',amount:'25.55',status:'received',received_at:'2026-10-20T12:30:00.000Z',expected_at:'',note:'Test'};
const period={from:'2026-10-01',to:'2026-11-01',interval:'day',scenario:'success'};
beforeEach(async()=>{store.useMemoryStoreForTests();storage.clear();await auth.signIn({email:'admin@example.test',password:'KindsightDemo1!'});});
test('create/edit/conflict/archive/restore donor preserves data and stable revision',async()=>{
  const row=await crud.saveRecord({entity:'donors',draft:donorDraft});
  const changed=await crud.saveRecord({entity:'donors',id:row.id,revision:row.revision,draft:{...donorDraft,name:'Updated donor'}});
  await assert.rejects(crud.saveRecord({entity:'donors',id:row.id,revision:row.revision,draft:donorDraft}),error=>error.code==='CONFLICT');
  const archived=await crud.setArchived({entity:'donors',id:row.id,revision:changed.revision,archived:true});
  await assert.rejects(crud.saveRecord({entity:'donors',id:row.id,revision:archived.revision,draft:donorDraft}),error=>error.code==='ARCHIVED');
  assert.equal((await crud.listRecords('donors',{...filters,search:'Updated'})).data.length,0);
  assert.equal((await crud.listRecords('donors',{...filters,search:'Updated',archived:'archived'})).data.length,1);
  const restored=await crud.setArchived({entity:'donors',id:row.id,revision:archived.revision,archived:false});assert.equal(restored.name,'Updated donor');
});
test('donation mutation changes summary, trend and lifetime campaign consistently',async()=>{
  const gift=await crud.saveRecord({entity:'donations',draft:donationDraft});
  let report=await getDashboardReport(period);assert.equal(report.summary.totalRaised,'5275.55');assert.equal(report.summary.anonymousDonationCount,2);
  assert.equal(report.trend.find(point=>point.bucket==='2026-10-20').totalRaised,'25.55');
  assert.equal((await getCampaigns('success'))[0].totalRaised,'5025.55');
  await crud.setArchived({entity:'donations',id:gift.id,revision:gift.revision,archived:true});
  report=await getDashboardReport(period);assert.equal(report.summary.totalRaised,'5250.00');
});
test('status normalization and exact amount validation reject invalid money/dates',async()=>{
  for(const amount of ['0','-1','1e3','10.123','10000000000000'])await assert.rejects(crud.saveRecord({entity:'donations',draft:{...donationDraft,amount}}));
  await assert.rejects(crud.saveRecord({entity:'donations',draft:{...donationDraft,received_at:''}}));
  const pending=await crud.saveRecord({entity:'donations',draft:{...donationDraft,status:'pending',amount:'10.1'}});assert.equal(pending.amount,'10.10');assert.equal(pending.received_at,'');
  await assert.rejects(crud.saveRecord({entity:'campaigns',draft:{name:'Dates',description:'',target_amount:'0',starts_on:'2026-02-30',ends_on:'2026-02-01',status:'active'}}));
});
test('archived relations are retained for history but cannot be assigned to new donations',async()=>{
  const references=await crud.getReferences(),donor=references.donors[0];
  const existing=await crud.saveRecord({entity:'donations',draft:{...donationDraft,donor_id:donor.id}});
  await crud.setArchived({entity:'donors',id:donor.id,revision:donor.revision,archived:true});
  await assert.rejects(crud.saveRecord({entity:'donations',draft:{...donationDraft,donor_id:donor.id}}));
  const edited=await crud.saveRecord({entity:'donations',id:existing.id,revision:existing.revision,draft:{...donationDraft,donor_id:donor.id,note:'Historical edit'}});assert.equal(edited.donor_id,donor.id);
  const campaigns=await getCampaigns('success'),campaign=references.campaigns[0];
  await crud.setArchived({entity:'campaigns',id:campaign.id,revision:campaign.revision,archived:true});
  assert.equal((await getDashboardReport(period)).summary.totalRaised,'5275.55');assert.ok(campaigns.length>(await getCampaigns('success')).length);
});
test('lists apply archive/status/search and paginate a consistent snapshot',async()=>{
  const first=await crud.listRecords('donors',filters),second=await crud.listRecords('donors',{...filters,page:2});
  assert.equal(first.meta.total,12);assert.equal(second.data.length,2);
  assert.equal(new Set([...first.data,...second.data].map(row=>row.id)).size,12);
  assert.equal((await crud.listRecords('donations',{...filters,status:'received'})).data.length,3);
  assert.equal((await crud.listRecords('donations',{...filters,search:'Avery'})).data[0].donor_id,'donor-1');
  assert.equal((await crud.listRecords('donations',{...filters,search:'Anonymous'})).data.length,1);
  await assert.rejects(crud.listRecords('donors',{...filters,page:0}));
});
test('all ten section defaults validate and remain structurally compatible',()=>{
  for(const [section,content]of Object.entries(contentDefaults)){
    const checked=schema.validateContent(section,structuredClone(content),[...partnerLogos]);assert.deepEqual(checked.errors,{},section);
  }
});
test('CMS publish persists revisions, rejects unsafe links and protects fixed fields',async()=>{
  const before=await cms.getEditableContent('hero'),draft=structuredClone(before.content);draft.socialProof='Updated social proof';
  const saved=await cms.saveContent({section:'hero',content:draft,revision:before.revision});assert.equal(saved.revision,before.revision+1);assert.equal((await cms.getPublicContent('hero')).socialProof,'Updated social proof');
  await assert.rejects(cms.saveContent({section:'hero',content:draft,revision:before.revision}),error=>error.code==='CONFLICT');
  const navigation=await cms.getEditableContent('navbar');navigation.content.groups.serve[0].href='javascript:alert(1)';
  await assert.rejects(cms.saveContent({section:'navbar',content:navigation.content,revision:navigation.revision}),error=>Boolean(error.fields['groups.serve.0.href']));
  const difference=await cms.getEditableContent('difference');difference.content.insight.metrics[0].value='999';
  await assert.rejects(cms.saveContent({section:'difference',content:difference.content,revision:difference.revision}));
});
test('partners reject duplicate/unknown assets; draft does not publish until save',async()=>{
  const original=await cms.getEditableContent('partners'),draft=structuredClone(original.content);draft.items[1].logo=draft.items[0].logo;
  await assert.rejects(cms.saveContent({section:'partners',content:draft,revision:original.revision}));
  draft.items[1].logo='missing-file';await assert.rejects(cms.saveContent({section:'partners',content:draft,revision:original.revision}));
  assert.deepEqual(await cms.getPublicContent('partners'),original.content);
});
test('unauthed mutations cannot change local data',async()=>{
  await auth.signOut();await assert.rejects(crud.saveRecord({entity:'donors',draft:donorDraft}),error=>error.status===401);
  const hero=await cms.getPublicContent('hero');await assert.rejects(cms.saveContent({section:'hero',content:hero,revision:1}),error=>error.status===401);
});
