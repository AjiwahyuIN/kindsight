import { adminEntities } from '../../data/admin';
import type { Entity, ManagedRecord, RecordDraft, RecordFilters } from '../fundraising-types';
import { ServiceError, type PageMeta, type ServiceOptions } from '../types';
import { validDate } from '../dashboard-utils';
import { requireMockAdmin } from './require-admin';
import { notifyLocalChange, transact, type LocalState } from './store';
function money(value: string, positive: boolean) {
  if (!/^(0|[1-9][0-9]{0,12})(\.[0-9]{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.'); const clean = `${whole}.${fraction.padEnd(2, '0')}`;
  return positive && clean === '0.00' ? null : clean;
}
function validate(entity: Entity, draft: RecordDraft, state: LocalState, current?: ManagedRecord): RecordDraft {
  const fields: Record<string,string> = {}, config = adminEntities[entity], value: RecordDraft = {};
  for (const name of Object.keys(draft)) if (!config.fields.some(field => field.name === name)) fields[name] = 'Unsupported field.';
  for (const field of config.fields) {
    const raw = draft[field.name]; const text = typeof raw === 'string' ? raw.trim() : '';
    value[field.name] = text;
    if ((field.required && !text) || (field.max && text.length > field.max) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) fields[field.name] = `Enter ${field.required ? '1' : '0'}–${field.max ?? 160} characters.`;
    if (field.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) fields[field.name] = 'Enter a valid email address.';
    if (field.choices && !field.choices.includes(text)) fields[field.name] = 'Choose an available status.';
    if (field.money) { const amount = money(text, entity === 'donations'); if (amount === null) fields[field.name] = 'Enter a valid USD amount (up to 13 integer digits and 2 decimals).' + (entity === 'donations' ? ' Amount must be greater than zero.' : ''); else value[field.name] = amount; }
    if (field.type === 'date' && text && !validDate(text)) fields[field.name] = 'Enter a valid calendar date.';
  }
  if (entity === 'campaigns' && value.starts_on && value.ends_on && value.ends_on < value.starts_on) fields.ends_on = 'End date must be on or after the start date.';
  if (entity === 'donations') {
    for (const [field, source] of [['donor_id','donors'], ['campaign_id','campaigns']] as const) {
      if (!value[field]) continue;
      const linked = state.fundraising[source].find(row => row.id === value[field]);
      const retained = current?.kind === 'donations' && current[field] === value[field];
      if (!linked || (linked.archived && !retained)) fields[field] = 'Choose an active record, or keep the current historical relation.';
    }
    for (const [field, status] of [['received_at','received'], ['expected_at','pending']] as const) {
      if (value.status !== status) value[field] = '';
      if (value[field]) {
        const date = Date.parse(value[field]);
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value[field]) || !Number.isFinite(date) || !validDate(value[field].slice(0,10))) fields[field] = 'Enter a valid UTC date and time.';
        else value[field] = new Date(date).toISOString();
      }
    }
    if (value.status === 'received' && !value.received_at) fields.received_at = 'A received donation requires its received date and time.';
  }
  if (Object.keys(fields).length) throw new ServiceError('Please correct the highlighted fields.', 'VALIDATION', 400, fields);
  return value;
}
export async function listRecords(entity: Entity, filters: RecordFilters, { signal }: ServiceOptions = {}) {
  signal?.throwIfAborted(); await requireMockAdmin();
  if (!Number.isInteger(filters.page) || filters.page < 1 || filters.page > 10000 || ![10,25,50].includes(filters.pageSize) || filters.search.length > 160 || !['active','archived','all'].includes(filters.archived) || (filters.status && !adminEntities[entity].statuses?.includes(filters.status))) throw new ServiceError('Invalid list filters.', 'INVALID_FILTER', 400);
  return transact(state => {
    const rows: ManagedRecord[] = state.fundraising[entity];
    const filtered = rows.filter(row => (filters.archived === 'all' || row.archived === (filters.archived === 'archived')) && (!filters.status || ('status' in row && row.status === filters.status)) && [...Object.values(row), ...(row.kind==='donations'?[state.fundraising.donors.find(donor=>donor.id===row.donor_id)?.name??'Anonymous',state.fundraising.campaigns.find(campaign=>campaign.id===row.campaign_id)?.name??'General giving']:[])].some(value => typeof value === 'string' && value.toLowerCase().includes(filters.search.toLowerCase()))).sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    const meta: PageMeta = { total: filtered.length, page: filters.page, pageSize: filters.pageSize, pages: Math.max(1, Math.ceil(filtered.length / filters.pageSize)) };
    return { data: filtered.slice((filters.page-1)*filters.pageSize, filters.page*filters.pageSize), meta, relations: { donors: state.fundraising.donors, campaigns: state.fundraising.campaigns } };
  });
}
export async function getReferences() { await requireMockAdmin(); return transact(state => ({ donors: state.fundraising.donors, campaigns: state.fundraising.campaigns })); }
export async function saveRecord(input: { entity: Entity; id?: string; revision?: number; draft: RecordDraft }) {
  await requireMockAdmin();
  const result = await transact(state => {
    const rows: ManagedRecord[] = state.fundraising[input.entity], current = rows.find(row => row.id === input.id);
    if (input.id && !current) throw new ServiceError('Record no longer exists.', 'NOT_FOUND', 404);
    if (current?.archived) throw new ServiceError('Restore this record before editing.', 'ARCHIVED', 409);
    if (current && current.revision !== input.revision) throw new ServiceError('This record changed in another editor. Close and reopen it to load the latest version. Your draft has been kept.', 'CONFLICT', 409);
    const value = validate(input.entity, input.draft, state, current), now = new Date().toISOString();
    const record = { ...value, kind: input.entity, id: current?.id ?? crypto.randomUUID(), revision: (current?.revision ?? 0) + 1, archived: false, createdAt: current?.createdAt ?? now, updatedAt: now } as ManagedRecord;
    if (current) rows[rows.indexOf(current)] = record; else rows.push(record);
    return record;
  }, true); notifyLocalChange(); return result;
}
export async function setArchived(input: { entity: Entity; id: string; revision: number; archived: boolean }) {
  await requireMockAdmin();
  const record = await transact(state => {
    const row = state.fundraising[input.entity].find(item => item.id === input.id);
    if (!row) throw new ServiceError('Record no longer exists.', 'NOT_FOUND', 404);
    if (row.revision !== input.revision) throw new ServiceError('Record changed. Reload the list and try again.', 'CONFLICT', 409);
    row.archived = input.archived; row.revision++; row.updatedAt = new Date().toISOString(); return row;
  }, true); notifyLocalChange(); return record;
}
