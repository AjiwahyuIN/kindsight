import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {usePrivateScope} from './auth';
import {listOrganizations,getOrganization,createOrganization,setOrganizationActive,type OrganizationFilters} from '../services/organizations';
export function useOrganizations(filters:OrganizationFilters){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'organizations',filters],queryFn:({signal})=>listOrganizations(filters,{signal}),enabled:scope.enabled});}
export function useCreateOrganization(){const client=useQueryClient();return useMutation({mutationFn:createOrganization,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
export function useSetOrganizationActive(){const client=useQueryClient();return useMutation({mutationFn:setOrganizationActive,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
export function useReloadOrganization(){const client=useQueryClient(),scope=usePrivateScope('platform_admin');return (id:string)=>client.fetchQuery({queryKey:[...scope.key,'organization',id],queryFn:({signal})=>getOrganization(id,{signal}),staleTime:0});}
