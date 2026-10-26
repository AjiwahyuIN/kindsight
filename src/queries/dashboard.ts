import {useQuery} from '@tanstack/react-query';
import {getDashboardReport,getCampaigns,getDonors} from '../services/dashboard';
import type {DashboardReport,ReportFilters} from '../services/dashboard-types';
import type {SampleScenario} from '../services/types';
import {usePrivateScope} from './auth';
export const dashboardKeys={all:['private'] as const};
export function previousScopedReport(previous:DashboardReport|undefined,previousKey:readonly unknown[]|undefined,scopeKey:readonly unknown[],enabled:boolean){
 return enabled&&previousKey?.[0]==='private'&&previousKey[1]===scopeKey[1]&&previousKey[2]===scopeKey[2]&&previousKey[3]==='dashboard'&&previousKey[4]==='report'?previous:undefined;
}
export function useDashboardReport(filters:ReportFilters){
 const scope=usePrivateScope('organization_user');
 const query=useQuery({queryKey:[...scope.key,'dashboard','report',filters],queryFn:({signal})=>getDashboardReport(filters,{signal}),enabled:scope.enabled,
  placeholderData:(previous,previousQuery)=>previousScopedReport(previous,previousQuery?.queryKey,scope.key,scope.enabled),
 });
 return {...query,scopeKey:JSON.stringify(scope.key)};
}
export function useCampaigns(scenario:SampleScenario){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'dashboard','campaigns',scenario],queryFn:({signal})=>getCampaigns(scenario,{signal}),enabled:scope.enabled});}
export function useDonors(search:string,page:number,scenario:SampleScenario){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'dashboard','donors',search,page,scenario],queryFn:({signal})=>getDonors(search,page,scenario,{signal}),enabled:scope.enabled});}
