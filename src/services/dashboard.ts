import { apiRequest,allPages } from './api';
import type { DashboardReport,ReportFilters,CampaignProgress,Donor,Summary,TrendPoint } from './dashboard-types';
import type { SampleScenario,ServiceOptions,PageMeta } from './types';
export async function getDashboardReport(filters:ReportFilters,options:ServiceOptions={}):Promise<DashboardReport>{
 const params=new URLSearchParams({from:filters.from,to:filters.to});
 const[summary,trend]=await Promise.all([apiRequest<{data:Summary;meta:Omit<DashboardReport['meta'],'source'|'interval'>}>(`app/dashboard/summary?${params}`,options),apiRequest<{data:TrendPoint[]}>(`app/dashboard/trend?${params}&interval=${filters.interval}`,options)]);
 return{summary:summary.data,trend:trend.data,meta:{...summary.meta,interval:filters.interval,source:'api'}};
}
export async function getCampaigns(_scenario:SampleScenario,options:ServiceOptions={}):Promise<CampaignProgress[]>{const rows=await allPages<CampaignProgress&{target_amount:string}>('app/dashboard/campaigns?archived=active',options);return rows.map(row=>({...row,targetAmount:row.target_amount}));}
export async function getDonors(search:string,page:number,_scenario:SampleScenario,options:ServiceOptions={}):Promise<{data:Donor[];meta:PageMeta}>{return apiRequest(`app/donors?${new URLSearchParams({search,page:String(page),pageSize:'5',archived:'active'})}`,options);}
