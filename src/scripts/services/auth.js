import {apiRequest} from './api.js';
function legacyAccount(data){
 if(data.user?.role!=='platform_admin')throw Object.assign(new Error('Use the React organization portal to access fundraising.'),{status:403,code:'FORBIDDEN'});
 return {admin:data.user};
}
export const getAdminSession=async()=>legacyAccount((await apiRequest('auth/me')).data);
export async function getOptionalAdminSession(){try{return await getAdminSession();}catch(error){if([401,403].includes(error.status))return null;throw error;}}
export const signIn=async(email,password)=>legacyAccount((await apiRequest('auth/login',{method:'POST',body:{email,password}})).data);
export const signOut=()=>apiRequest('auth/logout',{method:'POST'});
