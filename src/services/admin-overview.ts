import {apiRequest} from './api';
import type {ServiceOptions} from './types';
export type AdminOverview={organizations:{total:number;active:number};organizationAccounts:{total:number;enabled:number};landingSections:number;updatedAt:string};
export async function getAdminOverview(options:ServiceOptions={}):Promise<AdminOverview>{return (await apiRequest<{data:AdminOverview}>('admin/overview',options)).data;}
