import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {localClientId} from '../services/sync';
import {authKeys} from '../queries/auth';
export function LocalDataSync(){const client=useQueryClient();useEffect(()=>{
 const refresh=()=>{void client.invalidateQueries({queryKey:['landing']});void client.invalidateQueries({queryKey:authKeys.session});void client.invalidateQueries({queryKey:['private']});};
 const resetSession=async()=>{await client.cancelQueries({queryKey:['private']});client.removeQueries({queryKey:['private']});client.setQueryData(authKeys.session,null);await client.invalidateQueries({queryKey:authKeys.session});};
 const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('kindsight-local-data'):null;
 if(channel)channel.onmessage=event=>{if(event.data?.type==='changed'&&event.data.clientId!==localClientId){if(event.data.kind==='session')void resetSession();else refresh();}};
 const expired=()=>{void resetSession();};window.addEventListener('kindsight-session-expired',expired);window.addEventListener('focus',refresh);
 return()=>{channel?.close();window.removeEventListener('focus',refresh);window.removeEventListener('kindsight-session-expired',expired);};
},[client]);return null;}
