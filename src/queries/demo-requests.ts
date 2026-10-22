import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {usePrivateScope} from './auth';
import {getDemoRequest,submitDemoRequest,listDemoRequests,updateDemoStatus,type DemoFilters} from '../services/demo-requests';
export function useDemoRequests(filters:DemoFilters){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'demo-requests',filters],queryFn:({signal})=>listDemoRequests(filters,{signal}),enabled:scope.enabled});}
export function useSubmitDemoRequest(){const client=useQueryClient();return useMutation({mutationFn:submitDemoRequest,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
export function useUpdateDemoStatus(){const client=useQueryClient();return useMutation({mutationFn:updateDemoStatus,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}

export function useReloadDemoRequest(){const client=useQueryClient(),scope=usePrivateScope('platform_admin');return (id:string)=>client.fetchQuery({queryKey:[...scope.key,'demo-request',id],queryFn:({signal})=>getDemoRequest(id,{signal}),staleTime:0});}
