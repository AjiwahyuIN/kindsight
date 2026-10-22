import { apiRequest,allPages } from './api';
import type { Entity,ManagedRecord,DonorRecord,CampaignRecord,RecordDraft,RecordFilters } from './fundraising-types';
import type { PageMeta,ServiceOptions } from './types';
import { notifyDataChange } from './sync';
type Row=Record<string,string|null>&{revision:number};
export function managed(entity:Entity,row:Row):ManagedRecord{return {...Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v??''])),kind:entity,id:row.id!,archived:Boolean(row.archived_at),revision:row.revision,createdAt:row.created_at!,updatedAt:row.updated_at!} as ManagedRecord;}
export async function getReferences(options:ServiceOptions={}){const[donors,campaigns]=await Promise.all([allPages<Row>('app/donors?archived=all',options),allPages<Row>('app/campaigns?archived=all',options)]);return{donors:donors.map(row=>managed('donors',row) as DonorRecord),campaigns:campaigns.map(row=>managed('campaigns',row) as CampaignRecord)};}
export async function listRecords(entity:Entity,filters:RecordFilters,options:ServiceOptions={}){
 const params=new URLSearchParams({page:String(filters.page),pageSize:String(filters.pageSize),search:filters.search,archived:filters.archived,...(entity!=='donors'&&filters.status?{status:filters.status}:{})});
 const[result,relations]=await Promise.all([apiRequest<{data:Row[];meta:PageMeta}>(`app/${entity}?${params}`,options),getReferences(options)]);
 return{data:result.data.map(row=>managed(entity,row)),meta:result.meta,relations};
}
export async function saveRecord(input:{entity:Entity;id?:string;revision?:number;draft:RecordDraft}):Promise<ManagedRecord>{const result=await apiRequest<{data:Row}>(`app/${input.entity}${input.id?'/'+input.id:''}`,{method:input.id?'PATCH':'POST',body:input.draft,revision:input.revision});notifyDataChange();return managed(input.entity,result.data);}
export async function setArchived(input:{entity:Entity;id:string;revision:number;archived:boolean}):Promise<ManagedRecord>{const path=`app/${input.entity}/${input.id}`;if(input.archived){await apiRequest(path,{method:'DELETE',revision:input.revision});}else await apiRequest(`${path}/restore`,{method:'POST',revision:input.revision});notifyDataChange();return managed(input.entity,(await apiRequest<{data:Row}>(path)).data);}
