import '../styles/pages/_admin.scss';
import { adminEntities } from './data/admin.js';
import { getAdminSession, signOut } from './services/auth.js';
import { listRecords, getRecord, saveRecord, archiveRecord, restoreRecord } from './services/fundraising.js';

const select = selector => document.querySelector(selector);
const entity = Object.hasOwn(adminEntities,new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'donors';
const config = adminEntities[entity];
const filters = select('[data-records-filters]');
const rows = select('[data-records-rows]');
const feedback = select('[data-records-feedback]');
const listError = select('[data-records-error]');
const previous = select('[data-page-previous]');
const next = select('[data-page-next]');
const retry = select('[data-records-retry]');
const archiveDialog = select('[data-archive-dialog]');
const titleCase = text => text.charAt(0).toUpperCase() + text.slice(1);
const state = {page:1,pageSize:10,loading:false,mutating:false,records:[],meta:null,request:null,editor:null,archive:null};
const money = value => {
  const [whole,fraction = ''] = String(value).split('.');
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(BigInt(whole)) + '.' + fraction.padEnd(2,'0');
};
const date = value => value ? new Intl.DateTimeFormat(undefined,{dateStyle:'medium',...(value.includes('T') ? {timeStyle:'short'} : {timeZone:'UTC'})}).format(new Date(value.includes('T') ? value : value + 'T00:00:00Z')) : '—';
function unauthenticated(error) { if (error.status === 401) { location.replace('/login.html'); return true; } return false; }
function cell(row, text, className) {
  const td = document.createElement('td'); td.textContent = text; if (className) td.className = className; row.append(td); return td;
}
function action(container,label,record,handler) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'admin-records__row-action'; button.textContent = label;
  button.dataset.recordId = record.id; button.dataset.recordAction = label.toLowerCase();
  button.setAttribute('aria-label',`${label} ${record.name || 'donation ' + record.id.slice(-8)}`);
  button.addEventListener('click',() => { if (!state.mutating) handler(record,button); });
  container.append(button);
}
function renderRows(records) {
  rows.replaceChildren();
  if (!records.length) {
    const row = document.createElement('tr');
    cell(row,`No ${entity} found. Try another search or add a record.`,'admin-records__empty').colSpan = config.columns.length + 1;
    rows.append(row); return;
  }
  for (const record of records) {
    const row = document.createElement('tr');
    if (entity === 'donors') {
      cell(row,record.name,'admin-records__name'); cell(row,record.email || '—'); cell(row,record.organization || '—'); cell(row,record.archived_at ? 'Archived' : 'Active');
    } else if (entity === 'campaigns') {
      cell(row,record.name,'admin-records__name'); cell(row,money(record.target_amount),'admin-records__amount');
      cell(row,`${date(record.starts_on)} – ${date(record.ends_on)}`); cell(row,record.archived_at ? 'Archived' : titleCase(record.status));
    } else {
      cell(row,(record.donor_name || 'Anonymous') + (record.donor_archived_at ? ' (archived)' : ''),'admin-records__name');
      cell(row,(record.campaign_name || 'General giving') + (record.campaign_archived_at ? ' (archived)' : ''));
      cell(row,money(record.amount),'admin-records__amount'); cell(row,record.archived_at ? 'Archived · ' + record.status : titleCase(record.status));
      cell(row,date(record.status === 'received' ? record.received_at : record.expected_at));
    }
    const actions = cell(row,'','admin-records__actions');
    if (record.archived_at) action(actions,'Restore',record,restore);
    else { action(actions,'Edit',record,openEditor); action(actions,'Archive',record,confirmArchive); }
    rows.append(row);
  }
}
function pagination() {
  previous.disabled = state.loading || state.page <= 1;
  next.disabled = state.loading || !state.meta || state.page >= state.meta.pages;
  select('[data-records-page]').textContent = state.meta ? `Page ${state.page} of ${state.meta.pages} · ${state.meta.total} ${state.meta.total === 1 ? 'record' : 'records'}` : '';
}
async function loadRecords(message = '') {
  state.request?.abort(); const controller = new AbortController(); state.request = controller;
  state.loading = true; rows.replaceChildren(); listError.textContent = ''; retry.hidden = true;
  feedback.textContent = 'Loading records…'; select('.admin-records__table').setAttribute('aria-busy','true'); pagination();
  try {
    const query = {page:String(state.page),pageSize:String(state.pageSize),search:filters.elements.search.value.trim(),archived:filters.elements.archived.value};
    if (filters.elements.status.value) query.status = filters.elements.status.value;
    const result = await listRecords(entity,query,controller.signal);
    if (controller !== state.request) return;
    if (!result.data.length && state.page > result.meta.pages) { state.page = result.meta.pages; return loadRecords(message); }
    state.records = result.data; state.meta = result.meta; renderRows(result.data);
    feedback.textContent = message || `${result.meta.total} ${result.meta.total === 1 ? config.singular : entity} found.`;
  } catch (error) {
    if (error.name === 'AbortError' || controller !== state.request) return;
    if (!unauthenticated(error)) { listError.textContent = error.message; retry.hidden = false; feedback.textContent = ''; state.meta = null; }
  } finally {
    if (controller === state.request) { state.loading = false; pagination(); select('.admin-records__table').setAttribute('aria-busy','false'); }
  }
}
function localDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso), pad = value => String(value).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function syncDonationDates(form) {
  if (entity !== 'donations') return;
  for (const key of ['received_at','expected_at']) {
    const enabled = form.elements.status.value === (key === 'received_at' ? 'received' : 'pending');
    form.elements[key].closest('.admin-field').hidden = !enabled;
    form.elements[key].disabled = !enabled;
    form.elements[key].required = enabled && key === 'received_at';
  }
}
async function referenceOptions(field,current) {
  const records = []; let page = 1, pages = 1;
  do { const result = await listRecords(field.source,{page:String(page),pageSize:'100',archived:'active'}); records.push(...result.data); pages = result.meta.pages; page++; } while (page <= pages);
  if (current && !records.some(record => record.id === current)) records.push((await getRecord(field.source,current)).data);
  return records;
}
async function openEditor(record, trigger) {
  const dialog = select(`[data-editor="${entity}"]`), form = dialog.querySelector('form');
  const editor = {dialog,form,id:record?.id || null,trigger,saving:false}; state.editor = editor;
  form.reset(); form.querySelectorAll('[data-field-error]').forEach(item => item.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(item => item.removeAttribute('aria-invalid'));
  dialog.querySelector('[data-editor-title]').textContent = `${record ? 'Edit' : 'Add'} ${config.singular}`;
  dialog.querySelector('[data-editor-feedback]').textContent = 'Loading form…';
  dialog.querySelector('[data-editor-save]').disabled = true;
  dialog.showModal();
  try {
    const current = record ? (await getRecord(entity,record.id)).data : {};
    const options = await Promise.all(config.fields.filter(field => field.type === 'reference').map(async field => [field.name,await referenceOptions(field,current[field.name])]));
    if (state.editor !== editor || !dialog.open) return;
    for (const [name,records] of options) {
      const input = form.elements[name], empty = config.fields.find(field => field.name === name).empty;
      input.replaceChildren(new Option(empty,''));
      records.forEach(item => input.add(new Option(item.name + (item.archived_at ? ' (archived; current)' : ''),item.id)));
    }
    for (const field of config.fields) {
      if (current[field.name] != null) form.elements[field.name].value = field.type === 'datetime-local' ? localDateTime(current[field.name]) : current[field.name];
    }
    syncDonationDates(form);
    dialog.querySelector('[data-editor-feedback]').textContent = '';
    dialog.querySelector('[data-editor-save]').disabled = false;
    form.elements[config.fields[0].name].focus();
  } catch (error) { if (!unauthenticated(error) && dialog.open) dialog.querySelector('[data-editor-feedback]').textContent = error.message + ' Close and reopen this form to retry.'; }
}
async function submitEditor(event) {
  event.preventDefault();
  const editor = state.editor;
  if (!editor || editor.saving) return;
  const {form,dialog,id} = editor;
  form.querySelectorAll('[data-field-error]').forEach(item => item.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(item => item.removeAttribute('aria-invalid'));
  const body = {};
  for (const field of config.fields) {
    const input = form.elements[field.name];
    const value = input.disabled ? '' : input.value.trim();
    body[field.name] = field.type === 'datetime-local' ? (value ? new Date(value).toISOString() : null) : field.type === 'date' || field.type === 'reference' ? (value || null) : value;
  }
  if (entity !== 'donors') body.currency = 'USD';
  editor.saving = true;
  dialog.querySelectorAll('button').forEach(button => button.disabled = true);
  dialog.querySelector('[data-editor-feedback]').textContent = 'Saving…';
  try {
    await saveRecord(entity,id,body);
    dialog.close();
    await loadRecords(`${titleCase(config.singular)} ${id ? 'updated' : 'created'}.`);
    (id ? select(`[data-record-id="${id}"][data-record-action="edit"]`) || select('[data-add-record]') : select('[data-add-record]')).focus();
  } catch (error) {
    if (!unauthenticated(error)) {
      dialog.querySelector('[data-editor-feedback]').textContent = error.message;
      for (const [name,message] of Object.entries(error.fields || {})) {
        const input = form.elements[name], hint = form.querySelector(`[data-field-error="${name}"]`);
        if (input && hint) { input.setAttribute('aria-invalid','true'); hint.textContent = message; }
      }
      form.querySelector('[aria-invalid="true"]')?.focus();
    }
  } finally { editor.saving = false; dialog.querySelectorAll('button').forEach(button => button.disabled = false); }
}
function confirmArchive(record,trigger) {
  state.archive = {record,trigger}; select('[data-archive-feedback]').textContent = '';
  select('#archive-title').textContent = `Archive ${record.name || 'donation ' + record.id.slice(-8)}?`;
  archiveDialog.showModal();
}
async function confirmArchiveAction() {
  if (state.mutating || !state.archive) return;
  state.mutating = true; archiveDialog.querySelectorAll('button').forEach(button => button.disabled = true);
  try { await archiveRecord(entity,state.archive.record.id); archiveDialog.close(); await loadRecords(`${titleCase(config.singular)} archived.`); select('[data-add-record]').focus(); }
  catch (error) { if (!unauthenticated(error)) select('[data-archive-feedback]').textContent = error.message; }
  finally { state.mutating = false; archiveDialog.querySelectorAll('button').forEach(button => button.disabled = false); }
}
async function restore(record,button) {
  state.mutating = true; button.disabled = true;
  try { await restoreRecord(entity,record.id); await loadRecords(`${titleCase(config.singular)} restored.`); select('[data-add-record]').focus(); }
  catch (error) { if (!unauthenticated(error)) listError.textContent = error.message; }
  finally { state.mutating = false; if (button.isConnected) button.disabled = false; }
}

select('[data-records-title]').textContent = config.label;
select('[data-records-description]').textContent = config.description;
select('[data-records-caption]').textContent = config.label + ' records';
select('[data-add-record]').querySelector('.button__label').textContent = 'Add ' + config.singular;
for (const label of [...config.columns,'Actions']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; select('[data-records-columns]').append(th); }
document.querySelectorAll('[data-admin-tab]').forEach(tab => { if (tab.dataset.adminTab === entity) tab.setAttribute('aria-current','page'); });
if (config.statuses) {
  select('[data-status-filter]').hidden = false;
  config.statuses.forEach(status => filters.elements.status.add(new Option(titleCase(status),status)));
}
filters.addEventListener('submit',event => { event.preventDefault(); state.page = 1; loadRecords(); });
select('#records-page-size').addEventListener('change',event => { state.pageSize = Number(event.target.value); state.page = 1; loadRecords(); });
previous.addEventListener('click',() => { state.page--; loadRecords(); });
next.addEventListener('click',() => { state.page++; loadRecords(); });
retry.addEventListener('click',() => loadRecords());
select('[data-add-record]').addEventListener('click',event => openEditor(null,event.currentTarget));
for (const dialog of document.querySelectorAll('[data-editor]')) {
  dialog.querySelector('form').addEventListener('submit',submitEditor);
  dialog.querySelectorAll('[data-editor-close]').forEach(button => button.addEventListener('click',() => { if (!state.editor?.saving) dialog.close(); }));
  dialog.addEventListener('cancel',event => { if (state.editor?.saving) event.preventDefault(); });
  dialog.addEventListener('close',() => { state.editor?.trigger?.focus(); state.editor = null; });
  dialog.querySelector('[name="status"]')?.addEventListener('change',() => syncDonationDates(dialog.querySelector('form')));
}
select('[data-archive-cancel]').addEventListener('click',() => archiveDialog.close());
select('[data-archive-confirm]').addEventListener('click',confirmArchiveAction);
archiveDialog.addEventListener('cancel',event => { if (state.mutating) event.preventDefault(); });
archiveDialog.addEventListener('close',() => { state.archive?.trigger?.focus(); state.archive = null; });
select('[data-admin-signout]').addEventListener('click',async event => {
  event.currentTarget.disabled = true;
  try { await signOut(); location.replace('/login.html'); }
  catch (error) { listError.textContent = error.message; select('[data-admin-signout]').disabled = false; }
});
try {
  const {admin} = await getAdminSession();
  select('[data-admin-user]').textContent = admin.name;
  select('[data-admin-controls]').hidden = false;
  select('[data-admin-workspace]').hidden = false;
  select('[data-admin-gate]').hidden = true;
  await loadRecords();
} catch (error) {
  if (!unauthenticated(error)) {
    const gate = select('[data-admin-gate]'); gate.textContent = error.message + ' ';
    const button = document.createElement('button'); button.className = 'button button--outline button--sm'; button.textContent = 'Reload'; button.addEventListener('click',() => location.reload()); gate.append(button);
  }
}
