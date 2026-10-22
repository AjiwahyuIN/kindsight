import {useQuery} from '@tanstack/react-query';
import {getDashboardReport,getCampaigns,getDonors} from '../services/dashboard';
import type {ReportFilters} from '../services/dashboard-types';
import type {SampleScenario} from '../services/types';
import {usePrivateScope} from './auth';
export const dashboardKeys={all:['private'] as const};
export function useDashboardReport(filters:ReportFilters){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'dashboard','report',filters],queryFn:({signal})=>getDashboardReport(filters,{signal}),enabled:scope.enabled});}
export function useCampaigns(scenario:SampleScenario){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'dashboard','campaigns',scenario],queryFn:({signal})=>getCampaigns(scenario,{signal}),enabled:scope.enabled});}
export function useDonors(search:string,page:number,scenario:SampleScenario){const scope=usePrivateScope('organization_user');return useQuery({queryKey:[...scope.key,'dashboard','donors',search,page,scenario],queryFn:({signal})=>getDonors(search,page,scenario,{signal}),enabled:scope.enabled});}
