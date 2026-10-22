import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {getEditableContent,getLogoCatalog,saveContent,uploadLogo} from '../services/content';
import type {ContentSection} from '../services/content-types';
import {authKeys,usePrivateScope} from './auth';
export const contentKeys={all:['private'] as const};
export function useEditableContent(section:ContentSection){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'content',section],queryFn:()=>getEditableContent(section),enabled:scope.enabled});}
export function useLogoCatalog(enabled=true){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'content','logo-catalog'],queryFn:getLogoCatalog,enabled:enabled&&scope.enabled});}
export function useSaveContent(){const client=useQueryClient();return useMutation({mutationFn:saveContent,onSuccess:async(_,input)=>{await Promise.all([client.invalidateQueries({queryKey:['private']}),client.invalidateQueries({queryKey:['landing',input.section]})]);},onError:error=>{if('status'in error&&error.status===401)void client.invalidateQueries({queryKey:authKeys.session});}});}
export function useUploadLogo(){const client=useQueryClient();return useMutation({mutationFn:uploadLogo,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
