import {apiRequest} from './api';
import {notifyDataChange} from './sync';
import type {ServiceOptions,PageMeta} from './types';
export type ManagedOrganization={id:string;name:string;active:boolean;revision:number;accounts:number};
export type OrganizationFilters={status:'all'|'active'|'inactive';search:string;page:number;pageSize:number};
export function parseOrganizationFilters(params:URLSearchParams):OrganizationFilters{
 const status=params.get('status')??'all',page=params.get('page')??'1',size=params.get('pageSize')??'10';
 return {status:status==='active'||status==='inactive'?status:'all',search:(params.get('search')??'').trim().slice(0,160),page:/^[1-9]\d{0,6}$/.test(page)?Number(page):1,pageSize:['10','25','50'].includes(size)?Number(size):10};
}
export function listOrganizations(filters:OrganizationFilters,options:ServiceOptions={}){return apiRequest<{data:ManagedOrganization[];meta:PageMeta}>(`admin/organizations?${new URLSearchParams(Object.entries(filters).map(([key,value])=>[key,String(value)]))}`,options);}
export async function getOrganization(id:string,options:ServiceOptions={}){return (await apiRequest<{data:ManagedOrganization}>(`admin/organizations/${encodeURIComponent(id)}`,options)).data;}
export async function createOrganization(input:{requestId:string;name:string}){const result=await apiRequest<{data:ManagedOrganization}>('admin/organizations',{method:'POST',body:input});notifyDataChange();return result.data;}
export async function setOrganizationActive(input:{id:string;active:boolean;revision:number}){await apiRequest<void>(`admin/organizations/${encodeURIComponent(input.id)}`,{method:'PATCH',body:{active:input.active},revision:input.revision});notifyDataChange();}
