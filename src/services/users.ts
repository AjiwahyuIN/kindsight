import {apiRequest} from './api';
import {notifyDataChange} from './sync';
import {listOrganizations,type ManagedOrganization} from './organizations';
import type {ServiceOptions,PageMeta} from './types';
export type ManagedUser={id:string;name:string;email:string;active:boolean;revision:number;organization:{id:string;name:string;active:boolean};enabled:boolean};
export type UserFilters={status:'all'|'active'|'inactive';organization:string;search:string;page:number;pageSize:number};
export type CreateUserInput={requestId:string;name:string;email:string;organizationId:string};
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
export function parseUserFilters(params:URLSearchParams):UserFilters{const status=params.get('status')??'all',page=params.get('page')??'1',size=params.get('pageSize')??'10',organization=params.get('organization')??'all';return {status:status==='active'||status==='inactive'?status:'all',organization:uuid.test(organization)?organization:'all',search:(params.get('search')??'').trim().slice(0,160),page:/^[1-9]\d{0,6}$/.test(page)?Number(page):1,pageSize:['10','25','50'].includes(size)?Number(size):10};}
export function listUsers(filters:UserFilters,options:ServiceOptions={}){return apiRequest<{data:ManagedUser[];meta:PageMeta}>(`admin/users?${new URLSearchParams(Object.entries(filters).map(([key,value])=>[key,String(value)]))}`,options);}
export async function getUser(id:string,options:ServiceOptions={}){return (await apiRequest<{data:ManagedUser}>(`admin/users/${encodeURIComponent(id)}`,options)).data;}
export async function createUser(input:CreateUserInput,initialPassword:string){const result=await apiRequest<{data:ManagedUser}>('admin/users',{method:'POST',body:{...input,initialPassword}});notifyDataChange();return result.data;}
export async function setUserActive(input:{id:string;active:boolean;revision:number}){await apiRequest<void>(`admin/users/${encodeURIComponent(input.id)}`,{method:'PATCH',body:{active:input.active},revision:input.revision});notifyDataChange();}
export async function getUserOrganizations(options:ServiceOptions={}):Promise<ManagedOrganization[]>{const rows:ManagedOrganization[]=[];let page=1,pages=1;do{const result=await listOrganizations({status:'all',search:'',page,pageSize:50},options);rows.push(...result.data);pages=result.meta.pages;page++;}while(page<=pages);return rows;}
// Created only for an explicit submission, held in memory until the dialog closes.
export function generateInitialPassword(){return Array.from(crypto.getRandomValues(new Uint8Array(24)),value=>value.toString(16).padStart(2,'0')).join('');}
