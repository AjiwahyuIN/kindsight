import { apiRequest } from './api.js';
const queryString = filters => new URLSearchParams(Object.entries(filters).filter(([,value])=>value !== undefined && value !== null && value !== '')).toString();
export const getDashboardSummary = (filters={},signal) => apiRequest(`admin/dashboard/summary?${queryString(filters)}`,{signal});
export const getDashboardTrend = (filters={},signal) => apiRequest(`admin/dashboard/trend?${queryString(filters)}`,{signal});
export const getCampaignProgress = (filters={},signal) => apiRequest(`admin/dashboard/campaigns?${queryString(filters)}`,{signal});
