import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile,unlink} from 'node:fs/promises';
import {readConfig} from '../config/env.js';
import {createDatabasePool} from '../config/database.js';
import {hashPassword} from '../auth/password.js';
import {showcaseOrganizationId} from './migrations/004-organizations.js';
// Local provisioning only, not public signup or a password reset endpoint.
let pool,wrote=false;
const target=new URL('../../.organization-credentials.local',import.meta.url);
try{
 pool=createDatabasePool(readConfig().database);
 const organizationId=process.env.ORGANIZATION_ID||showcaseOrganizationId;
 const email=(process.env.ORGANIZATION_USER_EMAIL||'team@kindsight.local').trim().toLowerCase();
 const name=(process.env.ORGANIZATION_USER_NAME||'Kindsight Fundraising').trim();
 const password=process.env.ORGANIZATION_USER_PASSWORD||randomBytes(24).toString('base64url');
 if(!/^[a-f0-9-]{36}$/.test(organizationId)||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!name||name.length>120||password.length<12||password.length>128)throw new Error('Provide valid local organization/account settings.');
 const [[organization]]=await pool.execute('SELECT id,name FROM organizations WHERE id=? AND active=TRUE',[organizationId]);
 if(!organization)throw new Error('Select an existing active organization.');
 const [[existing]]=await pool.execute('SELECT role,organization_id FROM admins WHERE email=?',[email]);
 if(existing){if(existing.role!=='organization_user'||existing.organization_id!==organizationId)throw new Error('This email belongs to another role/organization; no account changed.');console.log('Organization user already exists. No password or account data changed.');}
 else{
  await writeFile(target,JSON.stringify({email,password,organization:organization.name,organizationId},null,2)+'\n',{mode:0o600,flag:'wx'});wrote=true;
  await pool.execute('INSERT INTO admins (id,email,name,password_hash,role,organization_id) VALUES (?,?,?,?,?,?)',[randomUUID(),email,name,await hashPassword(password),'organization_user',organizationId]);
  wrote=false;console.log('Organization user created. Credentials saved in .organization-credentials.local (ignored by Git).');
 }
}catch(error){if(wrote)await unlink(target).catch(()=>{});console.error('Organization user provisioning failed:',error.code||error.message);process.exitCode=1;}finally{await pool?.end();}
