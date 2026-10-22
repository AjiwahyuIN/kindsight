export const localClientId=globalThis.crypto.randomUUID();
export function notifyDataChange(kind:'data'|'session'='data'){if(typeof BroadcastChannel==='undefined')return;const channel=new BroadcastChannel('kindsight-local-data');channel.postMessage({type:'changed',kind,clientId:localClientId});channel.close();}
