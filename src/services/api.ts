import { ServiceError, type PageMeta, type ServiceOptions } from './types';
export type ResponseData<T> = { data:T; meta?:PageMeta };
export async function apiRequest<T>(path:string,options:ServiceOptions&{method?:string;body?:unknown;revision?:number}={}):Promise<T>{
 const method=options.method??'GET',mutate=!['GET','HEAD'].includes(method),multipart=options.body instanceof FormData;
 let response:Response;
 try{response=await fetch(`/api/v1/${path}`,{method,signal:options.signal,credentials:'same-origin',cache:'no-store',headers:{...(mutate?{'X-Kindsight-Request':'1',...(!multipart?{'Content-Type':'application/json'}:{})}:{}),...(options.revision!==undefined?{'If-Match':`"${options.revision}"`}:{})},...(mutate?{body:multipart?options.body as FormData:JSON.stringify(options.body??{})}:{})});}
 catch(error){if(error instanceof DOMException&&error.name==='AbortError')throw error;throw new ServiceError('Unable to connect to Kindsight. Check the local API and try again.','CONNECTION_ERROR',503);}
 if(response.status===204)return undefined as T;
 let payload;try{payload=await response.json();}catch{throw new ServiceError('The server returned an unexpected response. Please retry.','INVALID_RESPONSE',response.status);}
 if(response.status===401&&!path.startsWith('auth/')&&typeof window!=='undefined')window.dispatchEvent(new Event('kindsight-session-expired'));
 if(!response.ok)throw new ServiceError(payload.error?.message??'The request failed.',payload.error?.code??'REQUEST_FAILED',response.status,payload.error?.fields);
 return payload as T;
}
export async function allPages<T>(path:string,{signal}:ServiceOptions={}):Promise<T[]>{
 const rows:T[]=[];let page=1,pages=1;
 do{const response=await apiRequest<{data:T[];meta:PageMeta}>(`${path}${path.includes('?')?'&':'?'}pageSize=100&page=${page}`,{signal});rows.push(...response.data);pages=response.meta.pages;page++;}while(page<=pages);
 return rows;
}
