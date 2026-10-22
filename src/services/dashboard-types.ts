import type { Money, SampleScenario } from './types';
export type ReportFilters = { from: string; to: string; interval: 'day' | 'month'; scenario: SampleScenario };
export type Donation = { id: string; donorId: string | null; campaignId: string | null; amount: Money; receivedAt: string; status: 'received' | 'pending' | 'cancelled'; archived: boolean };
export type Donor = { id: string; name: string };
export type Campaign = { id: string; name: string; targetAmount: Money };
export type CampaignProgress = Campaign & { totalRaised: Money; donationCount: number; progressPercent: string | null };
export type Summary = { totalRaised: Money; previousTotalRaised: Money; donationCount: number; knownDonorCount: number; anonymousDonationCount: number; averageDonation: Money; growthPercent: string | null };
export type TrendPoint = { bucket: string; totalRaised: Money; donationCount: number };
export type DashboardReport = { summary: Summary; trend: TrendPoint[]; meta: { from: string; to: string; comparison: { from: string; to: string }; interval: 'day' | 'month'; currency: 'USD'; timeZone: 'UTC'; source: 'sample' | 'api' } };
