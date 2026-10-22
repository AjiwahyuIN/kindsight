import {Router} from 'express';
import type {Pool,RowDataPacket,ResultSetHeader} from 'mysql2/promise';
import {rateLimit} from 'express-rate-limit';
import {RequestError,validateId} from '../services/fundraising-validation.js';
const statuses=['new','contacted','closed'];
const invalid=(message:string,fields?:Record<string,string>)=>new RequestError(400,'INVALID_DEMO_REQUEST',message,fields);
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw invalid('Send a valid request.');return value as Record<string,unknown>;}
function details(value:unknown){
 const body=object(value),fields:Record<string,string>={};
 if(Object.keys(body).some(key=>!['requestId','name','email','organization','message'].includes(key)))throw invalid('Send supported fields only.');
 const text=(key:string,max:number,required=false)=>{const raw=body[key]??'';if(typeof raw!=='string'||raw.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)){fields[key]=`Enter valid text up to ${max} characters.`;return ''; }const clean=raw.trim();if(required&&!clean)fields[key]='This field is required.';return clean;};
 const name=text('name',160,true),email=text('email',254,true).toLowerCase(),organization=text('organization',160),message=text('message',2000);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fields.email='Enter a valid email address.';
 const id=validateId(body.requestId);
 if(Object.keys(fields).length)throw invalid('Please correct the highlighted fields.',fields);
 return {id,name,email,organization:organization||null,message:message||null};
}
type DemoRow=RowDataPacket&{id:string;name:string;email:string;organization:string|null;message:string|null;status:string;revision:number;created_at:Date|string;updated_at:Date|string};
const iso=(date:Date|string)=>date instanceof Date?date.toISOString():new Date(date.replace(' ','T')+'Z').toISOString();
const serialize=(row:DemoRow)=>({id:row.id,name:row.name,email:row.email,organization:row.organization,message:row.message,status:row.status,revision:row.revision,createdAt:iso(row.created_at),updatedAt:iso(row.updated_at)});
export function createDemoRequestRouters(pool:Pool,{submissionLimit=5}:{submissionLimit?:number}={}){
 const publicRouter=Router(),admin=Router();
 publicRouter.post('/',rateLimit({windowMs:15*60*1000,limit:submissionLimit,standardHeaders:'draft-8',legacyHeaders:false,handler:(_request,response)=>response.status(429).json({error:{code:'DEMO_REQUEST_LIMIT',message:'Too many requests. Please try again in 15 minutes.'}})}),async(request,response,next)=>{
  try{
   const input=details(request.body);
   // The same submission ID can be retried after an interrupted response, without inserting twice.
   try{await pool.execute('INSERT INTO demo_requests (id,name,email,organization,message) VALUES (?,?,?,?,?)',[input.id,input.name,input.email,input.organization,input.message]);}
   catch(error){
    if((error as {code?:string}).code!=='ER_DUP_ENTRY')throw error;
    const [[previous]]=await pool.execute<DemoRow[]>('SELECT name,email,organization,message FROM demo_requests WHERE id=?',[input.id]);
    if(!previous||previous.name!==input.name||previous.email!==input.email||previous.organization!==input.organization||previous.message!==input.message)throw new RequestError(409,'SUBMISSION_CHANGED','This submission changed. Start a new request.',undefined);
   }
   // Never expose the existing record or its current internal workflow status publicly.
   response.status(201).json({data:{id:input.id,received:true}});
  }catch(error){next(error);}
 });
 admin.get('/',async(request,response,next)=>{
  try{
   const query=request.query;
   if(Object.keys(query).some(key=>!['status','search','page','pageSize'].includes(key)))throw invalid('Unsupported filters.');
   const single=(key:string,fallback:string)=>{const raw=query[key];if(raw===undefined)return fallback;if(typeof raw!=='string')throw invalid('Invalid filter.');return raw;};
   const status=single('status','all'),search=single('search','').trim(),pageText=single('page','1'),sizeText=single('pageSize','10');
   if(!['all',...statuses].includes(status)||search.length>160||!/^\d{1,7}$/.test(pageText)||Number(pageText)<1||!['10','25','50'].includes(sizeText))throw invalid('Invalid filters or pagination.');
   const page=Number(pageText),pageSize=Number(sizeText),values:string[]=[];let where='WHERE 1=1';
   if(status!=='all'){where+=' AND status=?';values.push(status);}
   if(search){where+=' AND (LOCATE(?,name)>0 OR LOCATE(?,email)>0 OR LOCATE(?,COALESCE(organization,\'\'))>0)';values.push(search,search,search);}
   const connection=await pool.getConnection();
   try{
    await connection.beginTransaction();
    const [[count]]=await connection.execute<RowDataPacket[]>(`SELECT COUNT(*) total FROM demo_requests ${where}`,values);
    const [rows]=await connection.query<DemoRow[]>(`SELECT id,name,email,organization,message,status,revision,created_at,updated_at FROM demo_requests ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,[...values,pageSize,(page-1)*pageSize]);
    await connection.commit();
    response.json({data:rows.map(serialize),meta:{total:Number(count.total),pages:Math.max(1,Math.ceil(Number(count.total)/pageSize)),page,pageSize}});
   }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  }catch(error){next(error);}
 });
 admin.get('/:id',async(request,response,next)=>{try{const id=validateId(request.params.id);const [[row]]=await pool.execute<DemoRow[]>('SELECT id,name,email,organization,message,status,revision,created_at,updated_at FROM demo_requests WHERE id=?',[id]);if(!row)throw new RequestError(404,'NOT_FOUND','Demo request not found.',undefined);response.json({data:serialize(row)});}catch(error){next(error);}});
 admin.patch('/:id',async(request,response,next)=>{
  try{
   const id=validateId(request.params.id),body=object(request.body);
   if(Object.keys(body).length!==1||!statuses.includes(String(body.status)))throw invalid('Choose a valid status.');
   const match=request.get('If-Match');if(!match||!/^"[1-9]\d{0,9}"$/.test(match))throw new RequestError(428,'REVISION_REQUIRED','Reload this request before updating its status.',undefined);
   const revision=Number(match.slice(1,-1));
   const [result]=await pool.execute<ResultSetHeader>('UPDATE demo_requests SET status=?,revision=revision+1 WHERE id=? AND revision=?',[String(body.status),id,revision]);
   if(!result.affectedRows){const [[exists]]=await pool.execute<RowDataPacket[]>('SELECT id FROM demo_requests WHERE id=?',[id]);throw new RequestError(exists?409:404,exists?'REVISION_CONFLICT':'NOT_FOUND',exists?'Another admin updated this request. Reload the latest version before saving.':'Demo request not found.',undefined);}
   response.status(204).end();
  }catch(error){next(error);}
 });
 return {public:publicRouter,admin};
}
