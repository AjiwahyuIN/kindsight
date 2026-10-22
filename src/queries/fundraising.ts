import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {getReferences,listRecords,saveRecord,setArchived} from '../services/fundraising';
import type {Entity,RecordFilters} from '../services/fundraising-types';
import {authKeys,usePrivateScope} from './auth';
export const fundraisingKeys={all:['private'] as const};
export function useRecords(entity:Entity,filters:RecordFilters){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'fundraising',entity,filters],queryFn:({signal})=>listRecords(entity,filters,{signal}),enabled:scope.enabled});}
export function useReferences(enabled=true){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'fundraising','references'],queryFn:({signal})=>getReferences({signal}),enabled:enabled&&scope.enabled});}
function useMutationOptions(){const client=useQueryClient();return{onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});},onError:(error:Error)=>{if('status'in error&&error.status===401)void client.invalidateQueries({queryKey:authKeys.session});}};}
export function useRecordMutation(){return useMutation({mutationFn:saveRecord,...useMutationOptions()});}
export function useArchiveMutation(){return useMutation({mutationFn:setArchived,...useMutationOptions()});}
