import '../styles/pages/_dashboard-shell.scss';
import { dashboardShell } from './data/dashboard-shell.js';
import { getAdminSession, signOut } from './services/auth.js';
import { getDashboardSummary } from './services/dashboard.js';
import { createDashboardOverview } from './dashboard-overview.js';

const select = selector => document.querySelector(selector);
const workspace = select('[data-shell-workspace]');
const gate = select('[data-shell-gate]');
const accountToggle = select('[data-shell-account-toggle]');
const accountMenu = select('[data-shell-account]');
const periodDialog = select('[data-shell-period-dialog]');
const periodForm = select('[data-shell-period-form]');
const titleDialog = select('[data-shell-title-dialog]');
const titleForm = select('[data-shell-title-form]');
const exportButton = select('[data-shell-export]');
const state = {report:null,request:null,filters:{},title:dashboardShell.title,periodSaving:false};
const dialogTriggers = new WeakMap();
const dateOnly = date => date.toISOString().slice(0,10);
const overview = createDashboardOverview({unauthorized,explain(key,trigger) {
  const metric=state.report?.data.unavailableMetrics[key];
  const labels={majorGifts:'Major gift',forecast:'Forecasted',pendingAmount:'Pending ask',aiInsights:'AI insight'};
  select('#dashboard-metric-title').textContent=labels[key];
  select('#dashboard-metric-description').textContent=metric?.reason || 'This metric is not available yet.';
  openDialog(select('[data-metric-dialog]'),trigger);
}});
const moveDay = (day,offset) => { const date = new Date(`${day}T00:00:00Z`); date.setUTCDate(date.getUTCDate()+offset); return dateOnly(date); };
function unauthorized(error) { if (error.status === 401) { location.replace('/login.html'); return true; } return false; }
function status(message,retry = false) {
  select('[data-shell-status-text]').textContent = message;
  select('[data-shell-status]').hidden = !message;
  select('[data-shell-retry]').hidden = !retry;
}
function closeAccount() { accountMenu.hidden = true; accountToggle.setAttribute('aria-expanded','false'); }
function openDialog(dialog,trigger) { closeAccount(); dialogTriggers.set(dialog,trigger); dialog.showModal(); }
function renderPeriod(meta) {
  const first = new Date(`${meta.from}T00:00:00Z`), through = new Date(`${moveDay(meta.to,-1)}T00:00:00Z`);
  const month = new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'});
  const short = new Intl.DateTimeFormat('en-US',{day:'numeric',month:'short',timeZone:'UTC'});
  const nextMonth = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,1));
  const fullMonth = first.getUTCDate() === 1 && dateOnly(nextMonth) === meta.to;
  select('[data-shell-period-label]').textContent = fullMonth ? month.format(first) : `${short.format(first)} – ${short.format(through)}`;
  select('[data-shell-period-year]').textContent = first.getUTCFullYear() === through.getUTCFullYear() ? String(first.getUTCFullYear()) : `${first.getUTCFullYear()}–${through.getUTCFullYear()}`;
  select('[data-shell-period]').setAttribute('aria-label',`Reporting period: ${meta.from} through ${moveDay(meta.to,-1)} UTC`);
  periodForm.elements.from.value = meta.from;
  periodForm.elements.through.value = moveDay(meta.to,-1);
}
async function loadReport(filters,announce = false) {
  state.request?.abort(); const controller = new AbortController(); state.request = controller;
  state.filters = {...filters}; state.report = null; exportButton.disabled = true;
  overview.summaryLoading();
  let report;
  try {report = await getDashboardSummary(filters,controller.signal);}
  catch(error) {if(state.request === controller)overview.summaryError();throw error;}
  if (state.request !== controller) return;
  state.report = report; renderPeriod(report.meta); exportButton.disabled = false;overview.summaryLoaded(report);
  const url = new URL('/dashboard.html',location.origin);
  url.searchParams.set('from',report.meta.from); url.searchParams.set('to',report.meta.to);
  history.replaceState(null,'',url);
  if (announce) status('Reporting period updated.');
  return report;
}
for (const dialog of document.querySelectorAll('.dashboard-dialog')) {
  dialog.querySelectorAll('[data-shell-dialog-close]').forEach(button => button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('cancel',event => { if (dialog === periodDialog && state.periodSaving) event.preventDefault(); });
  dialog.addEventListener('close',()=>dialogTriggers.get(dialog)?.focus());
}
accountToggle.addEventListener('click',()=>{
  const open = accountMenu.hidden;
  accountMenu.hidden = !open; accountToggle.setAttribute('aria-expanded',String(open));
});
document.addEventListener('click',event=>{ if (!event.target.closest('.dashboard-shell__account-area')) closeAccount(); });
document.addEventListener('keydown',event=>{ if (event.key === 'Escape' && !accountMenu.hidden) {closeAccount();accountToggle.focus();} });
for (const button of document.querySelectorAll('[data-shell-preview]')) {
  button.addEventListener('click',()=>{
    const preview = dashboardShell.previews[button.dataset.shellPreview];
    select('#dashboard-preview-title').textContent = preview.title;
    select('#dashboard-preview-description').textContent = preview.description;
    openDialog(select('[data-shell-preview-dialog]'),button);
  });
}
select('[data-shell-period]').addEventListener('click',event=>{
  select('[data-shell-period-error]').textContent = '';
  if (!state.report) {
    const now = new Date();
    periodForm.elements.from.value = dateOnly(new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)));
    periodForm.elements.through.value = dateOnly(new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)));
  } else renderPeriod(state.report.meta);
  openDialog(periodDialog,event.currentTarget);
});
periodForm.addEventListener('submit',async event=>{
  event.preventDefault(); if (state.periodSaving) return;
  const from = periodForm.elements.from.value, through = periodForm.elements.through.value;
  const days = (new Date(`${through}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000 + 1;
  if (days < 1 || days > 366) {
    select('[data-shell-period-error]').textContent = 'Choose an end date on or after the start date, within 366 days.';
    periodForm.elements.through.focus();
    return;
  }
  state.periodSaving = true; periodDialog.querySelectorAll('button').forEach(button=>button.disabled=true);
  select('[data-shell-period-error]').textContent = '';
  try {
    await loadReport({from,to:moveDay(through,1)},true);
    periodDialog.close();
  } catch(error) { if (!unauthorized(error)) select('[data-shell-period-error]').textContent = error.message; }
  finally {state.periodSaving=false;periodDialog.querySelectorAll('button').forEach(button=>button.disabled=false);}
});
select('[data-shell-edit]').addEventListener('click',event=>{
  titleForm.elements.title.value = state.title;
  openDialog(titleDialog,event.currentTarget); titleForm.elements.title.select();
});
titleForm.addEventListener('submit',event=>{
  event.preventDefault(); const title = titleForm.elements.title.value.trim();
  if (!title) {titleForm.elements.title.setCustomValidity('Enter a dashboard title.');titleForm.elements.title.reportValidity();return;}
  state.title=title;select('[data-shell-title]').textContent=title;document.title=`${title} — Kindsight`;titleDialog.close();
});
titleForm.elements.title.addEventListener('input',()=>titleForm.elements.title.setCustomValidity(''));
select('[data-shell-favorite]').addEventListener('click',event=>{
  const button=event.currentTarget, favorite=button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed',String(favorite));
  status(favorite ? 'Added to favorites for this visit.' : 'Removed from favorites for this visit.');
});
select('[data-shell-print]').addEventListener('click',()=>window.print());
exportButton.addEventListener('click',()=>{
  if (!state.report) return;
  const blob=new Blob([JSON.stringify({title:state.title,...state.report},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url;link.download=`kindsight-summary-${state.report.meta.from}-${state.report.meta.to}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Summary downloaded.');
});
select('[data-shell-share]').addEventListener('click',async event=>{
  const trigger=event.currentTarget;trigger.disabled=true;
  try { await navigator.clipboard.writeText(location.href);status('Dashboard link copied.'); }
  catch {select('#dashboard-link-input').value=location.href;openDialog(select('[data-shell-copy-dialog]'),trigger);select('#dashboard-link-input').select();}
  finally {trigger.disabled=false;}
});
select('[data-shell-dismiss]').addEventListener('click',()=>status(''));
select('[data-shell-retry]').addEventListener('click',async()=>{
  try {await loadReport(state.filters,true);} catch(error) {if(!unauthorized(error)) status(error.message,true);}
});
select('[data-shell-logout]').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;state.request?.abort();
  try {await signOut();location.replace('/login.html');}
  catch(error) {status(error.message);button.disabled=false;}
});
try {
  const {admin}=await getAdminSession();
  for (const name of ['[data-shell-name]','[data-shell-account-name]']) select(name).textContent=admin.name;
  for (const name of ['[data-shell-email]','[data-shell-account-email]']) select(name).textContent=admin.email;
  accountToggle.setAttribute('aria-label',`Account menu for ${admin.name}`);
  workspace.hidden=false;gate.hidden=true;
  overview.initialize();
  const query=new URLSearchParams(location.search), filters={};
  if (query.has('from')) filters.from=query.get('from');if(query.has('to'))filters.to=query.get('to');
  try {await loadReport(filters);} catch(error) {if(!unauthorized(error)) status(error.message,true);}
} catch(error) {
  if (!unauthorized(error)) {gate.textContent=error.message+' ';const reload=document.createElement('button');reload.className='button button--outline button--sm';reload.textContent='Reload';reload.addEventListener('click',()=>location.reload());gate.append(reload);}
}
