import { apiRequest } from './api';
import { contentToWire,contentFromWire } from './content-wire';
import type { ContentMap,ContentSection,ContentDocument,JsonObject } from './content-types';
import type { PartnerLogo } from './partners-types';
import type { ServiceOptions } from './types';
import { partnerLogos } from '../data/partners';
import { notifyDataChange } from './sync';
type WireResponse={data:JsonObject;meta:{revision:string}};
const document=(section:ContentSection,response:WireResponse):ContentDocument=>({content:contentFromWire(section,response.data),revision:response.meta.revision});
export async function getPublicContent<K extends ContentSection>(section:K,options:ServiceOptions={}):Promise<ContentMap[K]>{return document(section,await apiRequest<WireResponse>(`content/${section}`,options)).content as unknown as ContentMap[K];}
export async function getEditableContent(section:ContentSection):Promise<ContentDocument>{return document(section,await apiRequest<WireResponse>(`admin/content/${section}`));}
function logoAsset(logo:PartnerLogo):PartnerLogo{return partnerLogos.find(item=>item.id===logo.id)??logo;}
export async function getLogoCatalog():Promise<PartnerLogo[]>{return(await apiRequest<{data:PartnerLogo[]}>('partner-logos')).data.map(logoAsset);}
export async function saveContent(input:{section:ContentSection;content:JsonObject;revision:number|string}):Promise<ContentDocument>{const result=await apiRequest<WireResponse>(`admin/content/${input.section}`,{method:'PUT',body:{content:contentToWire(input.section,input.content),revision:input.revision}});notifyDataChange();return document(input.section,result);}
export async function uploadLogo(input:{name:string;file:File}):Promise<PartnerLogo>{const body=new FormData();body.set('name',input.name);body.set('logo',input.file);const result=await apiRequest<{data:PartnerLogo}>('admin/partner-logos',{method:'POST',body});notifyDataChange();return logoAsset(result.data);}
