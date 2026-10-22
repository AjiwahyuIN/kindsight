import { Chart, BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip, Filler } from 'chart.js';
import { getDashboardTrend, getCampaignProgress } from './services/dashboard.js';
import { listRecords } from './services/fundraising.js';
import '../styles/pages/_dashboard-overview.scss';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip, Filler);
const select = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(Number(value));
const counted = (count,label) => `${count} ${label}${count===1?'':'s'}`;
const utcDate = (value,options) => new Intl.DateTimeFormat('en-US',{...options,timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`));
const chartOptions = {responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}}};

export function createDashboardOverview({explain,unauthorized}) {
  let summary, trendRequest, campaignRequest, donorRequest, trendChart, campaignChart;
  let campaignRows=[], donorPage=1, donorPages=1, donorSearch='';
  const tokens=getComputedStyle(document.documentElement);
  const color=name=>tokens.getPropertyValue(`--color-${name}`).trim();
  const font=tokens.getPropertyValue('--font-family').trim();
  Chart.defaults.font.family=font;
  Chart.defaults.color=color('text-secondary');
  const interval=select('[data-trend-interval]');

  function gauge(canvas,percent) {
    const available=percent !== null;
    const bounded=available ? Math.min(100,Math.max(0,Number(percent))) : 0;
    return new Chart(canvas,{type:'doughnut',data:{datasets:[{data:[bounded,100-bounded],backgroundColor:[color('brand'),color('border')],borderWidth:0,borderRadius:8,hoverOffset:0}]},options:{...chartOptions,rotation:-90,circumference:180,cutout:'86%',events:[],plugins:{legend:{display:false},tooltip:{enabled:false}}}});
  }
  // No stage counts exist yet: a neutral gauge deliberately conveys unavailable data.
  gauge(select('[data-major-chart]'),null);
  for (const button of document.querySelectorAll('[data-dashboard-explain]')) button.addEventListener('click',()=>explain(button.dataset.dashboardExplain,button));

  function clearTrend(message) {
    trendChart?.destroy();trendChart=null;
    select('[data-trend-rows]').replaceChildren();
    select('[data-trend-status]').textContent=message;
    select('[data-raised-chart]').setAttribute('aria-label',message);
  }
  async function loadTrend() {
    if (!summary) return;
    trendRequest?.abort(); const controller=new AbortController();trendRequest=controller;
    clearTrend('Loading trend…');interval.disabled=true;
    try {
      const report=await getDashboardTrend({from:summary.meta.from,to:summary.meta.to,interval:interval.value},controller.signal);
      if (controller !== trendRequest) return;
      const points=report.data, values=points.map(point=>Number(point.totalRaised));
      const hasDonations=points.some(point=>point.donationCount>0);
      select('[data-trend-status]').textContent=hasDonations ? 'Received donations · USD · UTC' : 'No received donations in this period.';
      for (const point of points) {
        const row=document.createElement('tr');
        for (const value of [point.bucket,money(point.totalRaised),String(point.donationCount)]) {const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
        select('[data-trend-rows]').append(row);
      }
      const labels=points.map(point=>utcDate(point.bucket,interval.value==='month'?{month:'short',year:'numeric'}:{month:'short',day:'numeric'}));
      trendChart=new Chart(select('[data-raised-chart]'),{
        type:'bar',data:{labels,datasets:[
          {type:'line',label:'Received',data:values,borderColor:color('brand'),backgroundColor:color('brand'),borderWidth:2,pointRadius:points.length<=12?3:0,pointHoverRadius:5,tension:.35,order:0},
          {label:'Received',data:values,backgroundColor:color('background'),hoverBackgroundColor:'rgba(246,101,21,.25)',borderRadius:10,borderSkipped:false,barPercentage:.9,categoryPercentage:.9,order:1},
        ]},
        options:{...chartOptions,interaction:{mode:'index',intersect:false},layout:{padding:{top:12,left:4,right:4}},scales:{
          x:{border:{display:false},grid:{display:false},ticks:{maxTicksLimit:7,maxRotation:0,font:{size:11},padding:12}},
          y:{display:false,beginAtZero:true,grace:'20%',...(hasDonations?{}:{max:1})},
        },plugins:{legend:{display:false},tooltip:{backgroundColor:color('text'),padding:14,displayColors:true,filter:item=>item.datasetIndex===0,callbacks:{title:items=>points[items[0].dataIndex].bucket+' UTC',label:context=>' Total: '+money(context.raw),afterLabel:context=>`${points[context.dataIndex].donationCount} received donation(s)`}}}},
      });
      select('[data-raised-chart]').setAttribute('aria-label',`Received donations in USD, ${summary.meta.from} until ${summary.meta.to} exclusive, ${interval.value==='day'?'daily':'monthly'}. Data table below.`);
    } catch(error) {if(controller!==trendRequest || error.name==='AbortError')return;if(!unauthorized(error))clearTrend('Trend unavailable. '+error.message);}
    finally {if(controller===trendRequest)interval.disabled=false;}
  }
  interval.addEventListener('change',loadTrend);

  function summaryLoading() {
    summary=null;trendRequest?.abort();trendRequest=null;clearTrend('Loading trend…');interval.disabled=true;
    select('[data-report-region]').setAttribute('aria-busy','true');select('[data-raised]').textContent='—';
    select('[data-growth]').hidden=true;select('[data-raised-count]').textContent='Loading received donations…';
  }
  function summaryLoaded(report) {
    summary=report;const data=report.data;
    const amount=select('[data-raised]');amount.replaceChildren();
    const [whole,cents]=money(data.totalRaised).split('.');amount.append(document.createTextNode(whole));
    const decimal=document.createElement('span');decimal.textContent='.'+cents;amount.append(decimal);
    const growth=select('[data-growth]');growth.hidden=data.growthPercent===null;
    if (data.growthPercent!==null) {growth.textContent=`${Number(data.growthPercent)>0?'+':''}${data.growthPercent}%`;growth.dataset.direction=Number(data.growthPercent)<0?'down':'up';growth.title=`Versus ${report.meta.comparison.from} to ${report.meta.comparison.to} (end exclusive), USD ${data.previousTotalRaised}`;}
    select('[data-raised-count]').textContent=`${counted(data.donationCount,'received donation')} · ${counted(data.knownDonorCount,'known donor')} · ${counted(data.anonymousDonationCount,'anonymous donation')}`;
    select('[data-report-region]').setAttribute('aria-busy','false');loadTrend();
  }
  function summaryError() {
    summary=null;clearTrend('Report unavailable. Use Try again or select another period.');
    select('[data-raised]').textContent='—';select('[data-raised-count]').textContent='Received donations unavailable.';
    select('[data-report-region]').setAttribute('aria-busy','false');
  }
  function renderCampaign() {
    const record=campaignRows.find(row=>row.id===select('[data-campaign-select]').value);
    campaignChart?.destroy();campaignChart=null;
    if(!record)return;
    select('[data-campaign-name]').textContent=record.name;
    select('[data-campaign-raised]').textContent=money(record.totalRaised);
    select('[data-campaign-target]').textContent=`of ${money(record.target_amount)} target`;
    select('[data-campaign-percent]').textContent=record.progressPercent===null?'—':`${Number(record.progressPercent).toLocaleString('en-US',{maximumFractionDigits:2})}%`;
    select('[data-campaign-status]').textContent=`${counted(record.donationCount,'received donation')} · Lifetime${record.progressPercent===null?' · No target set':''}`;
    const canvas=select('[data-campaign-chart]');campaignChart=gauge(canvas,record.progressPercent);
    canvas.setAttribute('aria-label',`${record.name}: ${record.progressPercent===null?'no target set':record.progressPercent+'% of target'}, lifetime received ${money(record.totalRaised)}.`);
  }
  async function loadCampaigns() {
    campaignRequest?.abort();const controller=new AbortController();campaignRequest=controller;
    try {
      const response=await getCampaignProgress({page:1,pageSize:100},controller.signal);
      if(controller!==campaignRequest)return;
      campaignRows=response.data;const menu=select('[data-campaign-select]');menu.replaceChildren();
      for(const row of campaignRows){const option=document.createElement('option');option.value=row.id;option.textContent=row.name;menu.append(option);}
      menu.disabled=!campaignRows.length;
      if(campaignRows.length)renderCampaign();
      else {select('[data-campaign-name]').textContent='No campaigns';select('[data-campaign-target]').textContent='Create a campaign to track its target.';select('[data-campaign-status]').textContent='No active campaign records.';}
    } catch(error) {if(error.name!=='AbortError'&&!unauthorized(error)){select('[data-campaign-name]').textContent='Campaign';select('[data-campaign-target]').textContent='Progress unavailable';select('[data-campaign-status]').textContent=error.message;}}
    finally {select('[data-campaign-region]').setAttribute('aria-busy','false');}
  }
  select('[data-campaign-select]').addEventListener('change',renderCampaign);

  async function loadDonors() {
    donorRequest?.abort();const controller=new AbortController();donorRequest=controller;
    select('[data-donor-status]').textContent='Loading donors…';
    select('[data-donor-rows]').replaceChildren();
    for(const key of ['previous','next'])select(`[data-donor-${key}]`).disabled=true;
    try {
      const response=await listRecords('donors',{page:donorPage,pageSize:5,search:donorSearch,archived:'active'},controller.signal);
      if(controller!==donorRequest)return;
      donorPages=response.meta.pages;
      for(const donor of response.data){
        const row=document.createElement('tr'),name=document.createElement('td'),identity=document.createElement('span'),avatar=document.createElement('span');
        identity.className='dashboard-prospects__identity';avatar.className='dashboard-prospects__initial';avatar.setAttribute('aria-hidden','true');avatar.textContent=donor.name.trim().slice(0,1).toUpperCase();
        const label=document.createElement('span');label.textContent=donor.name;identity.append(avatar,label);name.append(identity);row.append(name);
        for(const label of ['—','—','—','Active']){const cell=document.createElement('td');cell.textContent=label;if(label==='Active'){cell.className='dashboard-prospects__active';cell.title='Active donor profile, not prospect stage';}row.append(cell);}
        select('[data-donor-rows]').append(row);
      }
      if(!response.data.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent='No donors found.';row.append(cell);select('[data-donor-rows]').append(row);}
      select('[data-donor-status]').textContent=`${counted(response.meta.total,'donor profile')} · Page ${donorPage} of ${donorPages}`;
      select('[data-donor-previous]').disabled=donorPage<=1;select('[data-donor-next]').disabled=donorPage>=donorPages;
    } catch(error){if(controller===donorRequest&&error.name!=='AbortError'&&!unauthorized(error))select('[data-donor-status]').textContent='Donors unavailable. '+error.message;}
  }
  select('[data-donor-search]').addEventListener('submit',event=>{event.preventDefault();donorSearch=event.currentTarget.elements.search.value.trim();donorPage=1;loadDonors();});
  select('[data-donor-previous]').addEventListener('click',()=>{if(donorPage>1){donorPage--;loadDonors();}});
  select('[data-donor-next]').addEventListener('click',()=>{if(donorPage<donorPages){donorPage++;loadDonors();}});
  return {summaryLoading,summaryLoaded,summaryError,initialize(){loadCampaigns();loadDonors();}};
}
