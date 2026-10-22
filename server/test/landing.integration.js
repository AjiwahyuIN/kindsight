import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { createLandingRepository } from '../repositories/landing.js';
import { createAuthRepository } from '../repositories/auth.js';
import { createDatabasePool } from '../config/database.js';
import { readConfig } from '../config/env.js';
import { hashPassword } from '../auth/password.js';
import { landingDefaults } from '../../shared/landing-content.js';
import { heroContent } from '../../src/scripts/data/hero.js';
import { differenceContent } from '../../src/scripts/data/difference.js';
import { partners } from '../../src/scripts/data/partners.js';

test('landing content uses MySQL, protected writes, validation and revision conflicts without editing showcase rows',async()=>{
  const pool=createDatabasePool(readConfig().database),id=randomUUID(),keys={navbar:`qc-${id}-nav`,footer:`qc-${id}-foot`,hero:`qc-${id}-hero`,partners:`qc-${id}-partners`,difference:`qc-${id}-difference`};
  const email=`${id}@example.test`,password=randomBytes(20).toString('hex');let server;
  try {
    for(const [section,key] of Object.entries(keys))await pool.execute('INSERT INTO landing_sections (section_key,content_json) VALUES (?,?)',[key,JSON.stringify(section==='hero'?heroContent:section==='difference'?differenceContent:section==='partners'?partners:landingDefaults[section])]);
    await pool.execute('INSERT INTO admins (id,email,name,password_hash) VALUES (?,?,?,?)',[id,email,'Temporary content test',await hashPassword(password)]);
    server=createApp({landing:createLandingRepository(pool,keys),auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5175']}}).listen(0,'127.0.0.1');await once(server,'listening');
    const base=`http://127.0.0.1:${server.address().port}/api/v1`,headers={'Content-Type':'application/json','X-Kindsight-Request':'1',Origin:'http://127.0.0.1:5175'};
    const login=await fetch(base+'/auth/login',{method:'POST',headers,body:JSON.stringify({email,password})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
    async function request(path,method='GET',body,admin=true,overrides={}){const response=await fetch(base+path,{method,headers:{...headers,...(admin?{Cookie:cookie}:{}),...overrides},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,...await response.json()};}
    for(const section of ['navbar','footer','hero','partners','difference']){
      const publicRecord=await request(`/landing/${section}`,'GET',null,false);assert.equal(publicRecord.status,200);assert.deepEqual(publicRecord.data,landingDefaults[section]);
      assert.equal((await request(`/admin/landing/${section}`,'GET',null,false)).status,401);
      const path=`/admin/landing/${section}`,saved=await request(path),content=structuredClone(saved.data);
      if(section==='navbar'){content.demoLabel='QC demo';content.groups.serve[0].href='#about';}
      else if(section==='footer'){content.heading='QC newsletter';content.groups[0].links[0].href='#about';}
      else if(section==='hero'){content.heading='QC Hero';content.demoLabel='Explore demo';content.overview=[{title:'First QC slide',description:'Updated introduction.'}];}
      else if(section==='difference'){content.label='QC Difference';content.heading.line1='QC heading';content.items.reverse();content.items[0].title='QC support';content.items[0].description='QC description';}
      else{content.items=[{logo:'unicef',name:'UNICEF QC'},{logo:'hoag',name:'Hoag QC'}];}
      const body={content,revision:saved.meta.revision};
      assert.equal((await request(path,'PUT',body,false)).status,401);
      assert.equal((await request(path,'PUT',body,true,{'X-Kindsight-Request':''})).status,403);
      const updated=await request(path,'PUT',body);assert.equal(updated.status,200);assert.deepEqual(updated.data,content);assert.notEqual(updated.meta.revision,saved.meta.revision);
      assert.equal((await request(path,'PUT',body)).status,409);
      assert.deepEqual((await request(`/landing/${section}`,'GET',null,false)).data,content);
      const [[stored]]=await pool.execute('SELECT content_json FROM landing_sections WHERE section_key=?',[keys[section]]);const raw=typeof stored.content_json==='string'?JSON.parse(stored.content_json):stored.content_json;assert.deepEqual(raw,section==='hero'?{...content,preview:heroContent.preview}:section==='difference'?{...content,insight:differenceContent.insight,items:content.items.map(item=>({...item,...(differenceContent.items.find(original=>original.id===item.id).icon?{icon:differenceContent.items.find(original=>original.id===item.id).icon}:{})}))}:content);
      const invalid=structuredClone(content);if(section==='navbar')invalid.company.href='javascript:alert(1)';else if(section==='footer')invalid.legal[0].href='//example.com';else if(section==='hero')invalid.preview={raised:'$999999'};else if(section==='difference')invalid.insight={metrics:[]};else invalid.items[0].logo='../../logo.svg';
      assert.equal((await request(path,'PUT',{content:invalid,revision:updated.meta.revision})).status,400);
      assert.deepEqual((await request(path)).data,content);
    }
    assert.equal((await request('/landing/missions')).status,404);
    assert.equal((await request('/landing/navbar','PUT',{})).status,404);
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    for(const key of Object.values(keys))await pool.execute('DELETE FROM landing_sections WHERE section_key=?',[key]);
    await pool.execute('DELETE FROM sessions WHERE admin_id=?',[id]);await pool.execute('DELETE FROM admins WHERE id=?',[id]);await pool.end();
  }
});
