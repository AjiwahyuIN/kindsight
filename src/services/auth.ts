import { apiRequest } from './api';
import { ServiceError,type ServiceOptions } from './types';
import type { SessionUser,SignInInput } from './auth-types';
import { notifyDataChange } from './sync';
type SessionResponse={data:{user:SessionUser}};
export async function getSession(options:ServiceOptions={}):Promise<SessionUser|null>{try{return(await apiRequest<SessionResponse>('auth/me',options)).data.user;}catch(error){if(error instanceof ServiceError&&error.status===401)return null;throw error;}}
export async function signIn(input:SignInInput):Promise<SessionUser>{const result=await apiRequest<SessionResponse>('auth/login',{method:'POST',body:input});notifyDataChange('session');return result.data.user;}
export async function signOut():Promise<null>{await apiRequest('auth/logout',{method:'POST'});notifyDataChange('session');return null;}
