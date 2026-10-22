import { transact } from './store';
import { requireMockAdmin } from './require-admin';
import type { CampaignProgress, DashboardReport, Donation, Donor, ReportFilters, TrendPoint } from '../dashboard-types';
import { ServiceError, type PageMeta, type SampleScenario, type ServiceOptions } from '../types';
import { cents, decimal, moveDay, roundedDivide, validatePeriod } from '../dashboard-utils';
function check(scenario: SampleScenario, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Sample dashboard data is unavailable. Please retry.', 'DASHBOARD_UNAVAILABLE', 400);
}
const sum = (rows: Donation[]) => rows.reduce((total, row) => total + cents(row.amount), 0n);
export async function getDashboardReport(filters: ReportFilters, { signal }: ServiceOptions = {}): Promise<DashboardReport> {
  check(filters.scenario, signal); validatePeriod(filters.from, filters.to); await requireMockAdmin();
  const dashboardDonations = await transact(state => state.fundraising.donations.map(row => ({ id: row.id, donorId: row.donor_id || null, campaignId: row.campaign_id || null, amount: row.amount, receivedAt: row.received_at.slice(0,10), status: row.status, archived: row.archived }))); 
  const eligible = filters.scenario === 'empty' ? [] : dashboardDonations.filter(row => !row.archived && row.status === 'received');
  const days = (Date.parse(filters.to) - Date.parse(filters.from)) / 86400000;
  const previousFrom = moveDay(filters.from, -days);
  const current = eligible.filter(row => row.receivedAt >= filters.from && row.receivedAt < filters.to);
  const previous = eligible.filter(row => row.receivedAt >= previousFrom && row.receivedAt < filters.from);
  const total = sum(current), before = sum(previous);
  const points = new Map<string, TrendPoint>();
  for (let day = filters.from; day < filters.to; day = moveDay(day, 1)) {
    const bucket = filters.interval === 'month' ? `${day.slice(0, 7)}-01` : day;
    if (!points.has(bucket)) points.set(bucket, { bucket, totalRaised: '0.00', donationCount: 0 });
  }
  for (const row of current) {
    const bucket = filters.interval === 'month' ? `${row.receivedAt.slice(0, 7)}-01` : row.receivedAt;
    const point = points.get(bucket)!;
    point.totalRaised = decimal(cents(point.totalRaised) + cents(row.amount)); point.donationCount++;
  }
  return { summary: { totalRaised: decimal(total), previousTotalRaised: decimal(before), donationCount: current.length, knownDonorCount: new Set(current.flatMap(row => row.donorId ? [row.donorId] : [])).size, anonymousDonationCount: current.filter(row => row.donorId === null).length, averageDonation: decimal(current.length ? roundedDivide(total, BigInt(current.length)) : 0n), growthPercent: before === 0n ? null : decimal(roundedDivide((total - before) * 10000n, before)) }, trend: [...points.values()], meta: { from: filters.from, to: filters.to, comparison: { from: previousFrom, to: filters.from }, interval: filters.interval, currency: 'USD', timeZone: 'UTC', source: 'sample' } };
}
export async function getCampaigns(scenario: SampleScenario, { signal }: ServiceOptions = {}): Promise<CampaignProgress[]> {
  check(scenario, signal); await requireMockAdmin(); if (scenario === 'empty') return [];
  const records = await transact(state => state.fundraising);
  const dashboardCampaigns = records.campaigns.filter(row => !row.archived).map(row => ({ id:row.id, name:row.name, targetAmount:row.target_amount }));
  const dashboardDonations = records.donations.map(row => ({ id: row.id, donorId: row.donor_id || null, campaignId: row.campaign_id || null, amount: row.amount, receivedAt: row.received_at.slice(0,10), status: row.status, archived: row.archived }));
  return dashboardCampaigns.map(campaign => {
    const gifts = dashboardDonations.filter(row => row.campaignId === campaign.id && row.status === 'received' && !row.archived);
    const total = sum(gifts), target = cents(campaign.targetAmount);
    return { ...campaign, totalRaised: decimal(total), donationCount: gifts.length, progressPercent: target > 0n ? decimal(roundedDivide(total * 10000n, target)) : null };
  });
}
export async function getDonors(search: string, page: number, scenario: SampleScenario, { signal }: ServiceOptions = {}): Promise<{ data: Donor[]; meta: PageMeta }> {
  check(scenario, signal);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || search.length > 160) throw new ServiceError('Invalid donor search or page.', 'INVALID_DONOR_FILTER', 400);
  await requireMockAdmin();
  const dashboardDonors = await transact(state => state.fundraising.donors.filter(row => !row.archived));
  const rows = scenario === 'empty' ? [] : dashboardDonors.filter(row => row.name.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 5));
  return { data: rows.slice((page - 1) * 5, page * 5), meta: { page, pages, pageSize: 5, total: rows.length } };
}
