import {Router} from 'express';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {hashPassword,verifyPassword} from '../auth/password.js';
import {RequestError,validateId} from '../services/fundraising-validation.js';
type UserRow=RowDataPacket&{id:string;name:string;email:string;active:number;revision:number;organization_id:string;organization_name:string;organization_active:number;role:string;password_hash:string};
const columns='a.id,a.name,a.email,a.active,a.revision,a.organization_id,o.name organization_name,o.active organization_active';
const from="FROM admins a JOIN organizations o ON o.id=a.organization_id";
const project=(row:UserRow)=>({id:row.id,name:row.name,email:row.email,active:Boolean(row.active),revision:row.revision,organization:{id:row.organization_id,name:row.organization_name,active:Boolean(row.organization_active)},enabled:Boolean(row.active&&row.organization_active)});
const invalid=(message:string,fields?:Record<string,string>)=>new RequestError(400,'INVALID_USER',message,fields);
function inputBody(value:unknown,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||Object.keys(value).some(key=>!keys.includes(key)))throw invalid('Send supported fields only.');return value as Record<string,unknown>;}
const orgInactive=()=>new RequestError(409,'ORGANIZATION_INACTIVE','Choose an active organization. Activate the organization before enabling its users.',undefined);
export function createUsersRouter(pool:Pool){
 const router=Router();
 router.get('/',async(request,response,next)=>{
  try{
   if(Object.keys(request.query).some(key=>!['status','organization','search','page','pageSize'].includes(key)))throw invalid('Unsupported filters.');
   const param=(key:string,fallback:string)=>{const value=request.query[key];if(value===undefined)return fallback;if(typeof value!=='string')throw invalid('Invalid filters.');return value;};
   const status=param('status','all'),organization=param('organization','all'),search=param('search','').trim(),pageText=param('page','1'),sizeText=param('pageSize','10');
   if(!['all','active','inactive'].includes(status)||search.length>160||! /^[1-9]\d{0,6}$/.test(pageText)||!['10','25','50'].includes(sizeText))throw invalid('Invalid filters or pagination.');
   if(organization!=='all')validateId(organization);
   const values:(string|number)[]=[],page=Number(pageText),pageSize=Number(sizeText);let where="WHERE a.role='organization_user'";
   if(status!=='all'){where+=' AND a.active=?';values.push(status==='active'?1:0);}
   if(organization!=='all'){where+=' AND a.organization_id=?';values.push(organization);}
   if(search){where+=' AND (LOCATE(?,a.name)>0 OR LOCATE(?,a.email)>0)';values.push(search,search);}
   const db=await pool.getConnection();try{await db.beginTransaction();const [[count]]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) total ${from} ${where}`,values);const[rows]=await db.query<UserRow[]>(`SELECT ${columns} ${from} ${where} ORDER BY a.created_at DESC,a.id DESC LIMIT ? OFFSET ?`,[...values,pageSize,(page-1)*pageSize]);await db.commit();response.json({data:rows.map(project),meta:{total:Number(count.total),pages:Math.max(1,Math.ceil(Number(count.total)/pageSize)),page,pageSize}});}catch(error){await db.rollback();throw error;}finally{db.release();}
  }catch(error){next(error);}
 });
 router.get('/:id',async(request,response,next)=>{try{const id=validateId(request.params.id);const [[row]]=await pool.execute<UserRow[]>(`SELECT ${columns} ${from} WHERE a.id=? AND a.role='organization_user'`,[id]);if(!row)throw new RequestError(404,'NOT_FOUND','User not found.',undefined);response.json({data:project(row)});}catch(error){next(error);}});
 router.post('/',async(request,response,next)=>{
  try{
   const input=inputBody(request.body,['requestId','name','email','organizationId','initialPassword']),id=validateId(input.requestId),organizationId=validateId(input.organizationId),fields:Record<string,string>={};
   const name=typeof input.name==='string'?input.name.trim():'',email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   if(!name||name.length>120||/[\u0000-\u001f\u007f]/.test(name))fields.name='Enter a name of 1–120 characters.';
   if(!email||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fields.email='Enter a valid email address.';
   if(typeof input.initialPassword!=='string'||input.initialPassword.length<12||input.initialPassword.length>128)fields.initialPassword='Use an initial password of 12–128 characters.';
   if(Object.keys(fields).length)throw invalid('Please correct the account fields.',fields);
   const password=input.initialPassword as string,passwordHash=await hashPassword(password),db=await pool.getConnection();
   try{
    await db.beginTransaction();const [[organization]]=await db.execute<RowDataPacket[]>('SELECT active FROM organizations WHERE id=? FOR UPDATE',[organizationId]);
    if(!organization)throw new RequestError(404,'NOT_FOUND','Organization not found.',undefined);if(!organization.active)throw orgInactive();
    const [[existing]]=await db.execute<UserRow[]>('SELECT id,name,email,role,organization_id,password_hash FROM admins WHERE id=? FOR UPDATE',[id]);
    if(existing){if(existing.role!=='organization_user'||existing.organization_id!==organizationId||existing.name!==name||existing.email!==email||!await verifyPassword(password,existing.password_hash))throw new RequestError(409,'SUBMISSION_CHANGED','This submission changed. Close and start a new account.',undefined);}
    else{try{await db.execute("INSERT INTO admins (id,name,email,password_hash,role,organization_id) VALUES (?,?,?,?,'organization_user',?)",[id,name,email,passwordHash,organizationId]);}catch(error){if((error as {code?:string}).code==='ER_DUP_ENTRY')throw new RequestError(409,'EMAIL_IN_USE','This email is already assigned to an account. Use another email.',undefined);throw error;}}
    const [[row]]=await db.execute<UserRow[]>(`SELECT ${columns} ${from} WHERE a.id=? AND a.role='organization_user'`,[id]);await db.commit();response.status(201).json({data:project(row)});
   }catch(error){await db.rollback();throw error;}finally{db.release();}
  }catch(error){next(error);}
 });
 router.patch('/:id',async(request,response,next)=>{
  try{
   const id=validateId(request.params.id),input=inputBody(request.body,['active']);if(typeof input.active!=='boolean')throw invalid('Choose an active or inactive account status.');
   const match=request.get('If-Match');if(!match||!/^"[1-9]\d{0,9}"$/.test(match))throw new RequestError(428,'REVISION_REQUIRED','Reload the user before changing access.',undefined);
   const db=await pool.getConnection();try{
    await db.beginTransaction();const [[scope]]=await db.execute<UserRow[]>("SELECT organization_id FROM admins WHERE id=? AND role='organization_user'",[id]);if(!scope)throw new RequestError(404,'NOT_FOUND','User not found.',undefined);
    const [[organization]]=await db.execute<RowDataPacket[]>('SELECT active FROM organizations WHERE id=? FOR UPDATE',[scope.organization_id]);
    const [[row]]=await db.execute<UserRow[]>("SELECT revision,organization_id FROM admins WHERE id=? AND role='organization_user' FOR UPDATE",[id]);
    if(!row)throw new RequestError(404,'NOT_FOUND','User not found.',undefined);
    if(row.organization_id!==scope.organization_id||row.revision!==Number(match.slice(1,-1)))throw new RequestError(409,'REVISION_CONFLICT','Another admin changed this account. Reload the latest version before confirming.',undefined);
    if(input.active&&!organization?.active)throw orgInactive();
    await db.execute('UPDATE admins SET active=?,revision=revision+1 WHERE id=?',[input.active,id]);if(!input.active)await db.execute('DELETE FROM sessions WHERE admin_id=?',[id]);await db.commit();response.status(204).end();
   }catch(error){await db.rollback();throw error;}finally{db.release();}
  }catch(error){next(error);}
 });
 return router;
}
