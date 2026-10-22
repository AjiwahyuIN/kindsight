import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp,readdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createApp } from '../app.js';
import { createDatabasePool } from '../config/database.js';
import { readConfig } from '../config/env.js';
import { createAuthRepository } from '../repositories/auth.js';
import { createPartnerLogoRepository } from '../repositories/partner-logos.js';
import { createLandingRepository } from '../repositories/landing.js';
import { hashPassword } from '../auth/password.js';
import { landingDefaults } from '../../shared/landing-content.js';

test('local logo uploads authenticate, normalize raster images, persist, publish and reject unsafe files',async()=>{
  const pool=createDatabasePool(readConfig().database),directory=await mkdtemp(path.join(tmpdir(),'kindsight-logos-'));
  const adminId=randomUUID(),email=`${adminId}@example.test`,password=randomBytes(20).toString('hex'),key=`qc-${adminId}-logos`,created=[];
  let server;
  try {
    await pool.execute('INSERT INTO admins (id,email,name,password_hash) VALUES (?,?,?,?)',[adminId,email,'Upload test',await hashPassword(password)]);
    await pool.execute('INSERT INTO landing_sections (section_key,content_json) VALUES (?,?)',[key,JSON.stringify(landingDefaults.partners)]);
    const repository=createPartnerLogoRepository(pool);
    server=createApp({logos:repository,logoStorage:directory,landing:createLandingRepository(pool,{partners:key}),auth:{repository:createAuthRepository(pool),origins:['http://127.0.0.1:5175']}}).listen(0,'127.0.0.1');
    await once(server,'listening');
    const base=`http://127.0.0.1:${server.address().port}/api/v1`,headers={Origin:'http://127.0.0.1:5175','X-Kindsight-Request':'1'};
    const login=await fetch(base+'/auth/login',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    assert.equal(login.status,200);headers.Cookie=login.headers.get('set-cookie').split(';')[0];
    async function upload(bytes,type='image/png',overrides={}) {
      const body=new FormData();body.append('name','Temporary upload QC');body.append('logo',new Blob([bytes],{type}),'untrusted-name.svg');
      return fetch(base+'/admin/partner-logos',{method:'POST',headers:{...headers,...overrides},body});
    }
    const image=sharp({create:{width:400,height:80,channels:4,background:'#234567'}});
    const png=await image.clone().png().toBuffer();
    assert.equal((await upload(png,'image/png',{Cookie:''})).status,401);
    assert.equal((await upload(png,'image/png',{'X-Kindsight-Request':''})).status,403);
    for(const format of ['png','jpeg','webp']) {
      const response=await upload(await image.clone().toFormat(format).toBuffer(),format==='jpeg'?'image/jpeg':`image/${format}`);
      assert.equal(response.status,201);const {data}=await response.json();created.push(data.id);
      assert.equal(data.name,'Temporary upload QC');assert.equal(data.builtin,false);assert.equal(data.width,400);
      assert.equal(Object.hasOwn(data,'file_name'),false);
      const file=await fetch(base+data.src.replace('/api/v1',''));assert.equal(file.status,200);
      assert.equal(file.headers.get('content-type'),'image/png');assert.equal(file.headers.get('x-content-type-options'),'nosniff');
      assert.equal((await sharp(Buffer.from(await file.arrayBuffer())).metadata()).format,'png');
      const stored=await repository.get(data.id);assert.equal(stored.name,data.name);assert.match(stored.file_name,/^upload-.*\.png$/);
    }
    const catalog=await (await fetch(base+'/partner-logos')).json();assert.ok(created.every(id=>catalog.data.some(logo=>logo.id===id)));
    const saved=await (await fetch(base+'/admin/landing/partners',{headers})).json();
    const content={items:[{logo:created[0],name:'Uploaded organization'}]};
    const updated=await fetch(base+'/admin/landing/partners',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({content,revision:saved.meta.revision})});
    assert.equal(updated.status,200);assert.deepEqual((await (await fetch(base+'/landing/partners')).json()).data,content);
    for(const [bytes,type] of [[Buffer.from('<svg/>'),'image/svg+xml'],[Buffer.from('not an image'),'image/png'],[png,'image/jpeg'],[Buffer.alloc(2*1024*1024+1),'image/png']])assert.ok([400,413].includes((await upload(bytes,type)).status));
    const huge=await sharp({create:{width:4100,height:4100,channels:3,background:'#ffffff'}}).png().toBuffer();
    assert.equal((await upload(huge)).status,400);
    assert.equal((await fetch(base+`/partner-logos/upload-${randomUUID()}/file`)).status,404);
    assert.equal((await readdir(directory)).length,3);
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    for(const id of created)await pool.execute('DELETE FROM partner_logos WHERE id=?',[id]);
    await pool.execute('DELETE FROM landing_sections WHERE section_key=?',[key]);
    await pool.execute('DELETE FROM sessions WHERE admin_id=?',[adminId]);await pool.execute('DELETE FROM admins WHERE id=?',[adminId]);await pool.end();await rm(directory,{recursive:true,force:true});
  }
});
