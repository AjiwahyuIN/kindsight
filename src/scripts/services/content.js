import { apiRequest } from './api.js';
export const getPublicContent=async section=>(await apiRequest(`landing/${section}`)).data;
export const getEditableContent=section=>apiRequest(`admin/landing/${section}`);
export const saveLandingContent=(section,content,revision)=>apiRequest(`admin/landing/${section}`,{method:'PUT',body:{content,revision}});
