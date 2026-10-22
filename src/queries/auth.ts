import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {getSession,signIn,signOut} from '../services/auth';
import {sessionIdentity} from '../services/auth-utils';
import type {SessionUser} from '../services/auth-types';
import {queryClient} from '../app/query-client';
export const authKeys={session:['auth','session'] as const};
async function clearPrivate(){await queryClient.cancelQueries({queryKey:['private']});queryClient.removeQueries({queryKey:['private']});}
export function useSession(enabled=true){return useQuery({queryKey:authKeys.session,queryFn:async({signal})=>{
 const user=await getSession({signal});const previous=queryClient.getQueryData<SessionUser|null>(authKeys.session);
 if(sessionIdentity(previous)!==sessionIdentity(user))await clearPrivate();return user;
},enabled,staleTime:0,refetchOnWindowFocus:true});}
export function usePrivateScope(role:SessionUser['role']){const session=useSession();return{key:['private',session.data?.id??'guest',session.data?.organization?.id??'platform'] as const,enabled:session.data?.role===role};}
export function useSignIn(){const client=useQueryClient();return useMutation({mutationFn:signIn,onSuccess:async user=>{await clearPrivate();client.setQueryData(authKeys.session,user);}});}
export function useSignOut(){const client=useQueryClient();return useMutation({mutationFn:signOut,onSuccess:async()=>{await clearPrivate();client.setQueryData(authKeys.session,null);}});}
