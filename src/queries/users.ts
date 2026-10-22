import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {usePrivateScope} from './auth';
import {listUsers,getUser,getUserOrganizations,createUser,setUserActive,type UserFilters,type CreateUserInput} from '../services/users';
export function useUsers(filters:UserFilters){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'users',filters],queryFn:({signal})=>listUsers(filters,{signal}),enabled:scope.enabled});}
export function useUserOrganizations(){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'organizations','user-options'],queryFn:({signal})=>getUserOrganizations({signal}),enabled:scope.enabled});}
// Keep credentials out of mutation variables, query results, persistence and broadcasts.
export function useCreateUser(password:()=>string){const client=useQueryClient();return useMutation({mutationFn:(input:CreateUserInput)=>createUser(input,password()),onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
export function useSetUserActive(){const client=useQueryClient();return useMutation({mutationFn:setUserActive,onSuccess:async()=>{await client.invalidateQueries({queryKey:['private']});}});}
export function useReloadUser(){const client=useQueryClient(),scope=usePrivateScope('platform_admin');return (id:string)=>client.fetchQuery({queryKey:[...scope.key,'user',id],queryFn:({signal})=>getUser(id,{signal}),staleTime:0});}
