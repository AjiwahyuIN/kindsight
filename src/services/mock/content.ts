import { partnerLogos } from '../../data/partners';
import type { ContentMap, ContentSection, JsonObject } from '../content-types';
import { validateContent } from '../content-schema';
import { ServiceError, type ServiceOptions } from '../types';
import { requireMockAdmin } from './require-admin';
import { notifyLocalChange, transact } from './store';
export async function getPublicContent<K extends ContentSection>(section: K,{signal}:ServiceOptions={}):Promise<ContentMap[K]> { signal?.throwIfAborted();return transact(state=>state.content[section].content as unknown as ContentMap[K]); }
export async function getEditableContent(section: ContentSection) { await requireMockAdmin();return transact(state=>state.content[section]); }
export async function getLogoCatalog() { return transact(state=>[...partnerLogos,...state.uploads]); }
export async function saveContent(input:{section:ContentSection;content:JsonObject;revision:number}) {
  await requireMockAdmin();
  const result=await transact(state=>{
    const saved=state.content[input.section];
    if(saved.revision!==input.revision)throw new ServiceError('This section changed in another editor. Reload saved content to get the latest revision. Your draft is preserved.','CONFLICT',409);
    const checked=validateContent(input.section,input.content,[...partnerLogos,...state.uploads]);
    if(Object.keys(checked.errors).length)throw new ServiceError('Please correct the highlighted fields.','VALIDATION',400,checked.errors);
    state.content[input.section]={content:checked.content,revision:saved.revision+1};return state.content[input.section];
  },true);notifyLocalChange();return result;
}
export async function uploadLogo(input:{name:string;file:File}) {
  await requireMockAdmin();const name=input.name.trim(),file=input.file;
  if(!name||name.length>100||file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new ServiceError('Choose PNG, JPG or WebP up to 2 MB and enter an organization name.','INVALID_LOGO',400);
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const matches=file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!matches)throw new ServiceError('The file contents do not match the selected image type.','INVALID_LOGO',400);
  let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(file);}catch{throw new ServiceError('This image could not be decoded.','INVALID_LOGO',400);}
  const {width,height}=bitmap;bitmap.close();
  if(width<1||height<1||width>4096||height>4096)throw new ServiceError('Logo dimensions must be between 1 and 4096 pixels.','INVALID_LOGO',400);
  const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new ServiceError('Could not read the selected file.','UPLOAD_FAILED',400));reader.readAsDataURL(file);});
  const logo={id:`upload-${crypto.randomUUID()}`,name,src,width,height,builtin:false};
  await transact(state=>{state.uploads.push(logo);return logo;},true);notifyLocalChange();return logo;
}
