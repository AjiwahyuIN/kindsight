import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { currentReportPeriod } from '../services/dashboard-utils';
import { useDashboardReport, useCampaigns, useDonors } from '../queries/dashboard';
import type { ReportFilters } from '../services/dashboard-types';
import { type Explanation } from '../components/dashboard/DashboardHeader';
import { DashboardToolbar } from '../components/dashboard/DashboardToolbar';
import { RaisedCard, CampaignCard } from '../components/dashboard/ReportCards';
import { InsightCards } from '../components/dashboard/InsightCards';
import { DonorDirectory } from '../components/dashboard/DonorDirectory';
import { Dialog } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import '../styles/pages/_dashboard-shell.scss';
import '../styles/pages/_dashboard-overview.scss';
import '../styles/pages/_dashboard-react.scss';
export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const hasPeriod = params.has('from') || params.has('to');
  const scenario = 'success';
  const defaultReportPeriod=currentReportPeriod();
  const filters: ReportFilters = { from: hasPeriod ? params.get('from') ?? '' : defaultReportPeriod.from, to: hasPeriod ? params.get('to') ?? '' : defaultReportPeriod.to, interval: params.get('interval') === 'month' ? 'month' : 'day', scenario };
  const search = (params.get('search') ?? '').slice(0, 160);
  const rawPage = Number(params.get('page') ?? 1), page = Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10000 ? rawPage : 1;
  const report = useDashboardReport(filters), campaigns = useCampaigns(scenario), donors = useDonors(search, page, scenario);
  const [preview, setPreview] = useState<Explanation | null>(null);
  const trigger = useRef<HTMLElement>(null), close = useRef<HTMLButtonElement>(null);
  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) { if (value === null || value === '') next.delete(key); else next.set(key, value); }
    setParams(next);
  }
  function explain(content: Explanation, element: HTMLElement) { trigger.current = element; setPreview(content); }
  return <><main id="main-content" className="dashboard-shell__main" tabIndex={-1}><DashboardToolbar filters={filters} report={!report.isPlaceholderData && !report.isError ? report.data : undefined} applyPeriod={(from, to) => update({ from, to })} /><p className="dashboard-shell__sample-note">Local database · Fundraising records · USD / UTC</p><section className="dashboard-overview" aria-label="Fundraising overview"><div className="dashboard-overview__primary"><RaisedCard query={report} filters={filters} intervalChanged={interval => update({ interval: interval === 'day' ? null : interval })} /><CampaignCard query={campaigns} selectedId={params.get('campaign') ?? ''} select={id => update({ campaign: id })} /></div><div className="dashboard-overview__secondary"><InsightCards explain={explain} /><DonorDirectory query={donors} search={search} page={page} onSearch={value => update({ search: value, page: null })} onPage={next => update({ page: next === 1 ? null : String(next) })} /></div></section></main>
    <Dialog className="dashboard-dialog" lang="en" open={preview !== null} onClose={() => setPreview(null)} initialFocus={close} returnFocus={trigger} aria-labelledby="dashboard-explain-title" aria-describedby="dashboard-explain-description"><div className="dashboard-dialog__header"><h2 id="dashboard-explain-title">{preview?.title}</h2><Button variant="light" size="sm" ref={close} onClick={() => setPreview(null)}>Close</Button></div><p id="dashboard-explain-description">{preview?.description}</p></Dialog>
  </>;
}
