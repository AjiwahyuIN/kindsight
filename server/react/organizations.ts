import {Router} from 'express';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {RequestError,validateId} from '../services/fundraising-validation.js';
type OrganizationRow=RowDataPacket&{id:string;name:string;active:number;revision:number;accounts:number};
const project=(row:OrganizationRow)=>({id:row.id,name:row.name,active:Boolean(row.active),revision:row.revision,accounts:Number(row.accounts)});
const invalid=(message:string,fields?:Record<string,string>)=>new RequestError(400,'INVALID_ORGANIZATION',message,fields);
function body(value:unknown,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||Object.keys(value).some(key=>!keys.includes(key)))throw invalid('Send supported fields only.');return value as Record<string,unknown>;}
const columns="o.id,o.name,o.active,o.revision,(SELECT COUNT(*) FROM admins a WHERE a.organization_id=o.id AND a.role='organization_user') AS accounts";
export function createOrganizationsRouter(pool:Pool){
 const router=Router();
 router.get('/',async(request,response,next)=>{
  try{
   if(Object.keys(request.query).some(key=>!['status','search','page','pageSize'].includes(key)))throw invalid('Unsupported filters.');
   const param=(key:string,fallback:string)=>{const value=request.query[key];if(value===undefined)return fallback;if(typeof value!=='string')throw invalid('Invalid filters.');return value;};
   const status=param('status','all'),search=param('search','').trim(),pageText=param('page','1'),sizeText=param('pageSize','10');
   if(!['all','active','inactive'].includes(status)||search.length>160||! /^[1-9]\d{0,6}$/.test(pageText)||!['10','25','50'].includes(sizeText))throw invalid('Invalid filters or pagination.');
   const values:(string|number)[]=[],page=Number(pageText),pageSize=Number(sizeText);let where='WHERE 1=1';
   if(status!=='all'){where+=' AND o.active=?';values.push(status==='active'?1:0);}
   if(search){where+=' AND LOCATE(?,o.name)>0';values.push(search);}
   const db=await pool.getConnection();
   try{await db.beginTransaction();const [[count]]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) total FROM organizations o ${where}`,values);const [rows]=await db.query<OrganizationRow[]>(`SELECT ${columns} FROM organizations o ${where} ORDER BY o.created_at DESC,o.id DESC LIMIT ? OFFSET ?`,[...values,pageSize,(page-1)*pageSize]);await db.commit();response.json({data:rows.map(project),meta:{total:Number(count.total),pages:Math.max(1,Math.ceil(Number(count.total)/pageSize)),page,pageSize}});}catch(error){await db.rollback();throw error;}finally{db.release();}
  }catch(error){next(error);}
 });
 router.get('/:id',async(request,response,next)=>{try{const id=validateId(request.params.id);const [[row]]=await pool.execute<OrganizationRow[]>(`SELECT ${columns} FROM organizations o WHERE o.id=?`,[id]);if(!row)throw new RequestError(404,'NOT_FOUND','Organization not found.',undefined);response.json({data:project(row)});}catch(error){next(error);}});
 router.post('/',async(request,response,next)=>{
  try{
   const input=body(request.body,['requestId','name']),id=validateId(input.requestId);
   if(typeof input.name!=='string'||!input.name.trim()||input.name.length>160||/[\u0000-\u001f\u007f]/.test(input.name))throw invalid('Enter a valid organization name.',{name:'Enter 1–160 characters without control characters.'});
   const name=input.name.trim();
   try{await pool.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[id,name]);}
   catch(error){if((error as {code?:string}).code!=='ER_DUP_ENTRY')throw error;const [[existing]]=await pool.execute<OrganizationRow[]>('SELECT name FROM organizations WHERE id=?',[id]);if(!existing||existing.name!==name)throw new RequestError(409,'SUBMISSION_CHANGED','This submission changed. Close and start a new organization.',undefined);}
   const [[row]]=await pool.execute<OrganizationRow[]>(`SELECT ${columns} FROM organizations o WHERE o.id=?`,[id]);response.status(201).json({data:project(row)});
  }catch(error){next(error);}
 });
 router.patch('/:id',async(request,response,next)=>{
  try{
   const id=validateId(request.params.id),input=body(request.body,['active']);if(typeof input.active!=='boolean')throw invalid('Choose an active or inactive status.');
   const match=request.get('If-Match');if(!match||!/^"[1-9]\d{0,9}"$/.test(match))throw new RequestError(428,'REVISION_REQUIRED','Reload the organization before changing its status.',undefined);
   const db=await pool.getConnection();
   try{
    await db.beginTransaction();const [[row]]=await db.execute<OrganizationRow[]>('SELECT id,active,revision FROM organizations WHERE id=? FOR UPDATE',[id]);
    if(!row)throw new RequestError(404,'NOT_FOUND','Organization not found.',undefined);
    if(row.revision!==Number(match.slice(1,-1)))throw new RequestError(409,'REVISION_CONFLICT','Another admin changed this organization. Reload the latest version before confirming.',undefined);
    await db.execute('UPDATE organizations SET active=?,revision=revision+1 WHERE id=?',[input.active,id]);
    if(!input.active)await db.execute('DELETE FROM sessions WHERE admin_id IN (SELECT id FROM admins WHERE organization_id=?)',[id]);
    await db.commit();response.status(204).end();
   }catch(error){await db.rollback();throw error;}finally{db.release();}
  }catch(error){next(error);}
 });
 return router;
}
