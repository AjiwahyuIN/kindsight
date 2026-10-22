import { Router } from 'express';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { RequestError } from '../services/fundraising-validation.js';
import { safeContentHref } from '../../shared/landing-content.js';

type Value = string | number | boolean | null | Value[] | { [key:string]:Value };
type ObjectValue = { [key:string]:Value };
type Schema = {kind:'text'|'object'|'array';fields?:Record<string,Schema>;item?:Schema;variants?:Record<string,Schema>;indexed?:Schema[];min?:number;max?:number;reorder?:boolean;required?:boolean;href?:boolean;stableId?:boolean};
const contract=JSON.parse(readFileSync(new URL('../../shared/react-content.json',import.meta.url),'utf8')) as Record<string,{schema:Schema;defaults:ObjectValue}>;
const keys:Record<string,string>={navbar:'navigation',testimonials:'testimonial'};
const revision=(value:Value)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const object=(value:Value|undefined):ObjectValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const child=(schema:Schema,value:Value,index:number)=>schema.variants?.[String(object(value).id)]??schema.indexed?.[index]??schema.item!;
function pick(schema:Schema,value:Value|undefined,fallback:Value):Value {
 if(schema.kind==='object')return Object.fromEntries(Object.entries(schema.fields!).map(([key,s])=>[key,pick(s,object(value)[key],object(fallback)[key])]));
 if(schema.kind==='array')return (Array.isArray(value)?value:fallback as Value[]).map((v,i)=>pick(child(schema,v,i),v,(fallback as Value[])[i]??(fallback as Value[])[0]));
 return value??fallback;
}
function normalize(section:string,raw:ObjectValue):ObjectValue {
 const source=structuredClone(raw);
 if(section==='difference'&&!Array.isArray(source.heading)){const h=object(source.heading);source.heading=[h.line1,h.line2];}
 return pick(contract[section].schema,source,contract[section].defaults) as ObjectValue;
}
// Merge copy into existing records; preserve legacy illustrations and asset geometry.
function merge(original:Value|undefined,editable:Value):Value {
 if(Array.isArray(editable)){const rows=Array.isArray(original)?original:[];return editable.map((v,i)=>merge(object(v).id?rows.find(row=>object(row).id===object(v).id)??rows[0]:rows[i]??rows[0],v));}
 if(editable&&typeof editable==='object')return {...object(original),...Object.fromEntries(Object.entries(editable).map(([key,value])=>[key,merge(object(original)[key],value)]))};
 return editable;
}
function validate(section:string,input:Value,logos:Set<string>){
 const fields:Record<string,string>={},ids=new Set<string>(),selected=new Set<string>();
 function walk(s:Schema,v:Value|undefined,path:string):Value {
  if(s.kind==='text'){
   if(typeof v!=='string'){fields[path]='Enter text.';return '';}
   const clean=v.trim();if((s.required&&!clean)||clean.length>s.max!||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean))fields[path]='Enter valid text within the allowed length.';
   if(s.href&&!safeContentHref(clean))fields[path]='Use an anchor, local path or http(s) URL without credentials.';
   if(s.stableId){if(!/^[a-z][a-z0-9-]{0,59}$/.test(clean)||ids.has(clean))fields[path]='Use a unique stable ID.';ids.add(clean);}
   if(section==='partners'&&path.endsWith('.logo')){if(!logos.has(clean)||selected.has(clean))fields[path]='Select an available, unique logo.';selected.add(clean);}
   return clean;
  }
  if(s.kind==='array'){
   if(!Array.isArray(v)||v.length<s.min!||v.length>s.max!){fields[path]='Use the allowed number of items.';return [];}
   return v.map((item,i)=>{const id=String(object(item).id);if(s.variants&&(!s.variants[id]||(s.reorder===false&&Object.keys(s.variants)[i]!==id)))fields[`${path}.${i}`]='Keep the approved design items and order.';return walk(child(s,item,i),item,`${path}.${i}`);});
  }
  if(!v||typeof v!=='object'||Array.isArray(v)){fields[path]='Send an object.';return {};}
  for(const key of Object.keys(v))if(!Object.hasOwn(s.fields!,key))fields[`${path?path+'.':''}${key}`]='Unsupported field.';
  return Object.fromEntries(Object.entries(s.fields!).map(([key,c])=>[key,walk(c,v[key],`${path?path+'.':''}${key}`)]));
 }
 const value=walk(contract[section].schema,input,'');
 if(Object.keys(fields).length)throw new RequestError(400,'INVALID_CONTENT','Please correct the highlighted content fields.',fields);
 return value as ObjectValue;
}
type ContentRow=RowDataPacket&{content_json:ObjectValue|string;updated_at:string};
export function createContentRouter(pool:Pool,{admin=false,catalog=async()=>[] as {id:string}[],sectionKeys=keys}:{admin?:boolean;catalog?:()=>Promise<{id:string}[]>;sectionKeys?:Record<string,string>}={}){
 const router=Router();
 const key=(section:string)=>sectionKeys[section]??section;
 async function read(db:Pool|PoolConnection,section:string,lock=false){
  const [rows]=await db.execute<ContentRow[]>(`SELECT content_json,updated_at FROM landing_sections WHERE section_key=?${lock?' FOR UPDATE':''}`,[key(section)]);
  if(!rows[0])throw new RequestError(404,'CONTENT_NOT_FOUND','Landing content is not initialized.',undefined);
  const raw=typeof rows[0].content_json==='string'?JSON.parse(rows[0].content_json) as ObjectValue:rows[0].content_json;
  return {raw,data:normalize(section,raw),meta:{revision:revision(raw),updatedAt:new Date(rows[0].updated_at.replace(' ','T')+'Z').toISOString()}};
 }
 router.param('section',(_request,_response,next,section:string)=>{if(!Object.hasOwn(contract,section))return next(new RequestError(404,'NOT_FOUND','Content section not found.',undefined));next();});
 router.get('/:section',async(request,response)=>{const{data,meta}=await read(pool,String(request.params.section));response.json({data,meta});});
 if(admin)router.put('/:section',async(request,response)=>{
  const section=String(request.params.section),body=request.body;
  if(!body||typeof body!=='object'||Object.keys(body).some(k=>!['content','revision'].includes(k))||typeof body.revision!=='string'||!/^[a-f0-9]{64}$/.test(body.revision))throw new RequestError(400,'INVALID_INPUT','Send content and its current revision.',undefined);
  const content=validate(section,body.content,new Set((await catalog()).map(row=>row.id)));
  const connection=await pool.getConnection();
  try{
   await connection.beginTransaction();const current=await read(connection,section,true);
   if(revision(current.raw)!==body.revision)throw new RequestError(409,'CONTENT_CHANGED','This content changed in another editor. Reload saved content before publishing.',undefined);
   let stored=merge(current.raw,content) as ObjectValue;
   if(section==='difference'&&!Array.isArray(current.raw.heading)){const lines=content.heading as string[];stored.heading={line1:lines[0],line2:lines[1]};}
   await connection.execute('UPDATE landing_sections SET content_json=?,updated_at=CURRENT_TIMESTAMP(3) WHERE section_key=?',[JSON.stringify(stored),key(section)]);
   const{data,meta}=await read(connection,section);await connection.commit();response.json({data,meta});
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
 });
 return router;
}
