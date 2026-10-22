import {apiRequest} from './api';
import {notifyDataChange} from './sync';
import type {PageMeta,ServiceOptions} from './types';
export const demoStatuses=['new','contacted','closed'] as const;
export type DemoStatus=typeof demoStatuses[number];
export type DemoSubmission={requestId:string;name:string;email:string;organization:string;message:string};
export type DemoRequest={id:string;name:string;email:string;organization:string|null;message:string|null;status:DemoStatus;revision:number;createdAt:string;updatedAt:string};
export type DemoFilters={status:DemoStatus|'all';search:string;page:number;pageSize:number};
export async function submitDemoRequest(input:DemoSubmission){const result=await apiRequest<{data:{id:string;received:true}}>('demo-requests',{method:'POST',body:input});notifyDataChange();return result.data;}
export function listDemoRequests(filters:DemoFilters,options:ServiceOptions={}){return apiRequest<{data:DemoRequest[];meta:PageMeta}>(`admin/demo-requests?${new URLSearchParams(Object.entries(filters).map(([key,value])=>[key,String(value)]))}`,options);}
export async function getDemoRequest(id:string,options:ServiceOptions={}){return (await apiRequest<{data:DemoRequest}>(`admin/demo-requests/${encodeURIComponent(id)}`,options)).data;}
export async function updateDemoStatus({id,status,revision}:{id:string;status:DemoStatus;revision:number}){await apiRequest<void>(`admin/demo-requests/${encodeURIComponent(id)}`,{method:'PATCH',body:{status},revision});notifyDataChange();}
export function parseDemoFilters(params:URLSearchParams):DemoFilters{
 const status=params.get('status')??'all',page=params.get('page')??'1',size=params.get('pageSize')??'10';
 return {status:demoStatuses.includes(status as DemoStatus)?status as DemoStatus:'all',search:(params.get('search')??'').trim().slice(0,160),page:/^[1-9]\d{0,6}$/.test(page)?Number(page):1,pageSize:['10','25','50'].includes(size)?Number(size):10};
}
