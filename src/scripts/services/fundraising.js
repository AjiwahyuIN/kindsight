import { apiRequest } from './api.js';
export const listRecords = (entity, query, signal) => apiRequest(`admin/${entity}?${new URLSearchParams(query)}`, {signal});
export const getRecord = (entity,id) => apiRequest(`admin/${entity}/${encodeURIComponent(id)}`);
export const saveRecord = (entity,id,body) => apiRequest(`admin/${entity}${id ? '/' + encodeURIComponent(id) : ''}`, {method:id ? 'PATCH' : 'POST',body});
export const archiveRecord = (entity,id) => apiRequest(`admin/${entity}/${encodeURIComponent(id)}`, {method:'DELETE'});
export const restoreRecord = (entity,id) => apiRequest(`admin/${entity}/${encodeURIComponent(id)}/restore`, {method:'POST'});
