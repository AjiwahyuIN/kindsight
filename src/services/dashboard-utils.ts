import { ServiceError } from './types';
export function moveDay(day: string, count: number) { return new Date(Date.parse(`${day}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10); }
export function validDate(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < '1000-01-01' || day > '9999-01-01') return false;
  const value = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === day;
}
export function validatePeriod(from: string, to: string) {
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (!validDate(from) || !validDate(to) || days < 1 || days > 366) throw new ServiceError('Choose valid dates in order, within 366 days.', 'INVALID_PERIOD', 400);
}
export const cents = (amount: string) => BigInt(amount.replace('.', ''));
export function decimal(value: bigint) { const negative = value < 0n; const absolute = negative ? -value : value; return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`; }
export function roundedDivide(value: bigint, divisor: bigint) { return value < 0n ? -((-value + divisor / 2n) / divisor) : (value + divisor / 2n) / divisor; }
export const money = (amount: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));

export const counted = (count: number, label: string) => `${count} ${label}${count === 1 ? '' : 's'}`;

export function currentReportPeriod(now=new Date()){const year=now.getUTCFullYear(),month=now.getUTCMonth();return {from:new Date(Date.UTC(year,month,1)).toISOString().slice(0,10),to:new Date(Date.UTC(year,month+1,1)).toISOString().slice(0,10)};}
