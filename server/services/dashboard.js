import { RequestError, validateId } from './fundraising-validation.js';

const day = 86400000;
const dateOnly = date => date.toISOString().slice(0,10);
function parseDate(value,key) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1000-01-01') throw new RequestError(400,'INVALID_PERIOD',`${key} must be a valid YYYY-MM-DD date.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || dateOnly(date) !== value) throw new RequestError(400,'INVALID_PERIOD',`${key} must be a valid date.`);
  return date;
}
function campaign(value) {
  if (value == null) return null;
  if (value === 'general') return value;
  return validateId(value);
}
function scalarQuery(query,allowed) {
  if (Object.keys(query).some(key => !allowed.includes(key)) || Object.values(query).some(value => typeof value !== 'string')) throw new RequestError(400,'INVALID_FILTER','Unsupported dashboard filters.');
}
export function dashboardPeriod(query, trend = false, now = new Date()) {
  scalarQuery(query,['from','to','campaignId',...(trend ? ['interval'] : [])]);
  if (('from' in query) !== ('to' in query)) throw new RequestError(400,'INVALID_PERIOD','Provide both from and to dates.');
  const from = parseDate(query.from ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-01`,'from');
  const to = parseDate(query.to ?? dateOnly(new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1))),'to');
  const days = (to-from)/day;
  if (days < 1 || days > 366) throw new RequestError(400,'INVALID_PERIOD','Select a period of 1–366 days; to is exclusive.');
  const previousFrom = new Date(from.getTime() - days * day);
  if (previousFrom < new Date('1000-01-01T00:00:00Z')) throw new RequestError(400,'INVALID_PERIOD','Comparison period falls outside supported dates.');
  const interval = query.interval || 'day';
  if (!['day','month'].includes(interval)) throw new RequestError(400,'INVALID_FILTER','Trend interval must be day or month.');
  return {from:dateOnly(from),to:dateOnly(to),previousFrom:dateOnly(previousFrom),previousTo:dateOnly(from),days,campaignId:campaign(query.campaignId),interval};
}
export function campaignQuery(query) {
  scalarQuery(query,['page','pageSize','search','status','archived','campaignId']);
  const page = query.page ?? '1', pageSize = query.pageSize ?? '10';
  if (!/^[1-9]\d*$/.test(page) || Number(page)>1000000 || !/^[1-9]\d*$/.test(pageSize) || Number(pageSize)>100) throw new RequestError(400,'INVALID_FILTER','Invalid campaign pagination.');
  const search = (query.search || '').trim(), archived = query.archived || 'active';
  if (search.length>160 || !['active','archived','all'].includes(archived) || (query.status && !['draft','active','completed'].includes(query.status))) throw new RequestError(400,'INVALID_FILTER','Invalid campaign filters.');
  const campaignId = campaign(query.campaignId);
  if (campaignId === 'general') throw new RequestError(400,'INVALID_FILTER','General giving has no campaign target.');
  return {page:Number(page),pageSize:Number(pageSize),search,archived,status:query.status || null,campaignId};
}
export function trendBuckets({from,to,interval}) {
  const keys = [];
  let date = new Date(`${from}T00:00:00Z`);
  if (interval === 'month') date.setUTCDate(1);
  const end = new Date(`${to}T00:00:00Z`);
  while (date < end) {
    keys.push(dateOnly(date));
    if (interval === 'day') date.setUTCDate(date.getUTCDate()+1);
    else date.setUTCMonth(date.getUTCMonth()+1);
  }
  return keys;
}
function cents(value) {
  const negative = value.startsWith('-');
  const [whole,fraction=''] = (negative ? value.slice(1) : value).split('.');
  return (BigInt(whole)*100n + BigInt(fraction.padEnd(2,'0'))) * (negative ? -1n : 1n);
}
export function percent(numerator,denominator) {
  const n = typeof numerator === 'bigint' ? numerator : cents(numerator);
  const d = cents(denominator);
  if (d === 0n) return null;
  const sign = n < 0n ? '-' : '', scaled = (n < 0n ? -n : n) * 10000n;
  let result = scaled / d;
  if ((scaled % d)*2n >= d) result++;
  return `${result === 0n ? '' : sign}${result/100n}.${String(result%100n).padStart(2,'0')}`;
}
export function growth(current,previous) {
  return percent(cents(current)-cents(previous),previous);
}
export function reportingMeta(period) {
  return {
    currency:'USD',timeZone:'UTC',from:period.from,to:period.to,endExclusive:true,campaignId:period.campaignId,
    includedStatuses:['received'],excludesArchivedDonations:true,
    comparison:{from:period.previousFrom,to:period.previousTo,rule:'previous_equal_duration'},
  };
}
