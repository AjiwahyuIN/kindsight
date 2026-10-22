export class RequestError extends Error {
  constructor(status, code, message, fields) { super(message); Object.assign(this, {status, code, fields}); }
}
export const entities = {
  donors: ['name','email','phone','organization'],
  campaigns: ['name','description','target_amount','currency','starts_on','ends_on','status'],
  donations: ['donor_id','campaign_id','amount','currency','status','received_at','expected_at','note'],
};
export function validateId(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new RequestError(400,'INVALID_ID','Invalid record ID.');
  return value;
}
export function validateBody(entity, body, partial = false) {
  if (!body || Array.isArray(body) || typeof body !== 'object' || !Object.keys(body).length || Object.keys(body).some(key => !entities[entity].includes(key))) {
    throw new RequestError(400,'INVALID_INPUT','Send supported fields only.');
  }
  if (partial) return body;
  validateRecord(entity, body);
  return body;
}
export function validateRecord(entity, input) {
  const fields = {};
  const text = (key, max, required = false) => {
    const value = input[key];
    if (value == null || value === '') { if (required) fields[key] = 'This field is required.'; return required ? '' : null; }
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) { fields[key] = `Enter ${required ? '1–' : 'up to '}${max} characters.`; return null; }
    return value.trim() || null;
  };
  const money = (key, positive) => {
    const value = input[key];
    if (typeof value !== 'string' || !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value) || (positive && !/[1-9]/.test(value))) {
      fields[key] = `Enter a ${positive ? 'positive' : 'non-negative'} USD amount with at most 2 decimal places.`; return null;
    }
    const [whole, fraction = ''] = value.split('.');
    return `${whole}.${fraction.padEnd(2,'0')}`;
  };
  const date = (key, timestamp = false) => {
    const value = input[key];
    if (value == null || value === '') return null;
    const pattern = timestamp ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/ : /^\d{4}-\d{2}-\d{2}$/;
    if (typeof value !== 'string' || !pattern.test(value)) { fields[key] = timestamp ? 'Use a UTC ISO date and time.' : 'Use YYYY-MM-DD.'; return null; }
    const parsed = new Date(timestamp ? value : `${value}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value.slice(0,10) || value.slice(0,4) < '1000' || value.slice(0,4) > '9999') { fields[key] = 'Enter a valid date.'; return null; }
    return timestamp ? parsed.toISOString().slice(0,23).replace('T',' ') : value;
  };
  const status = choices => {
    if (!choices.includes(input.status)) fields.status = 'Select a valid status.';
    return input.status;
  };
  let record;
  if (entity === 'donors') {
    record = {name:text('name',160,true),email:text('email',254),phone:text('phone',40),organization:text('organization',160)};
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) fields.email = 'Enter a valid email.';
    if (record.email) record.email = record.email.toLowerCase();
  } else if (entity === 'campaigns') {
    record = {name:text('name',160,true), description:text('description',5000) || '',target_amount:money('target_amount',false),currency:input.currency ?? 'USD', starts_on:date('starts_on'),ends_on:date('ends_on'),status:status(['draft','active','completed'])};
    if (record.starts_on && record.ends_on && record.ends_on < record.starts_on) fields.ends_on = 'End date must be on or after start date.';
  } else {
    const reference = key => { if (input[key] == null || input[key] === '') return null; try { return validateId(input[key]); } catch { fields[key] = 'Select a valid record.'; return null; } };
    record = {donor_id:reference('donor_id'),campaign_id:reference('campaign_id'),amount:money('amount',true),currency:input.currency ?? 'USD',status:status(['pending','received','cancelled']),received_at:date('received_at',true),expected_at:date('expected_at',true),note:text('note',2000)};
    if (record.status === 'received' && !record.received_at) fields.received_at = 'Received donations need a received date and time.';
    if (record.status !== 'received') record.received_at = null;
    if (record.status !== 'pending') record.expected_at = null;
  }
  if ('currency' in record && record.currency !== 'USD') fields.currency = 'Only USD is supported.';
  if (Object.keys(fields).length) throw new RequestError(400,'VALIDATION_ERROR','Please check the highlighted fields.',fields);
  return record;
}
export function validateQuery(entity, query) {
  const allowed = ['page','pageSize','search','archived', ...(entity === 'donors' ? [] : ['status'])];
  if (Object.keys(query).some(key => !allowed.includes(key)) || Object.values(query).some(value => typeof value !== 'string')) throw new RequestError(400,'INVALID_FILTER','Invalid list filters.');
  const positive = (key, fallback, max) => { const raw = query[key] ?? String(fallback); if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max) throw new RequestError(400,'INVALID_FILTER',`Invalid ${key}.`); return Number(raw); };
  const page = positive('page',1,1000000), pageSize = positive('pageSize',10,100);
  const search = (query.search || '').trim();
  const archived = query.archived || 'active';
  const statuses = entity === 'campaigns' ? ['draft','active','completed'] : ['pending','received','cancelled'];
  if (search.length > 160 || !['active','archived','all'].includes(archived) || (query.status && !statuses.includes(query.status))) throw new RequestError(400,'INVALID_FILTER','Invalid search, archive, or status filter.');
  return {page,pageSize,search,archived,status:query.status || null};
}
