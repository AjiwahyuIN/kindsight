import { useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import type { DashboardReport, ReportFilters } from '../../services/dashboard-types';
import { moveDay, validDate, validatePeriod } from '../../services/dashboard-utils';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { DashboardIcon } from './DashboardIcon';
import avatar1 from '../../assets/images/hero/supporter-1.png';
import avatar2 from '../../assets/images/hero/supporter-2.png';
import avatar3 from '../../assets/images/hero/supporter-3.png';
export function DashboardToolbar({ filters, report, applyPeriod }: { filters: ReportFilters; report?: DashboardReport; applyPeriod: (from: string, to: string) => void }) {
  const [title, setTitle] = useState('Fundraising dashboard'), [favorite, setFavorite] = useState(true);
  const [modal, setModal] = useState<'period' | 'title' | 'share' | null>(null);
  const [from, setFrom] = useState(filters.from), [through, setThrough] = useState(validDate(filters.to) ? moveDay(filters.to, -1) : '');
  const [draftTitle, setDraftTitle] = useState(title), [error, setError] = useState(''), [status, setStatus] = useState('');
  const trigger = useRef<HTMLElement>(null), close = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const link = `${window.location.origin}/app/dashboard${location.search}`;
  const periodValid = validDate(filters.from) && validDate(filters.to) && filters.to > filters.from;
  const dateLabel = periodValid ? `${filters.from} – ${moveDay(filters.to, -1)}` : 'Select period';
  const monthLabel = periodValid ? new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${filters.from}T00:00:00Z`)) : 'Select period';
  const shortDate = (day: string) => new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
  const isFullMonth = periodValid && filters.from.endsWith('-01') && filters.to.endsWith('-01') && Date.parse(filters.to) - Date.parse(filters.from) <= 31 * 86400000;
  const visiblePeriod = !periodValid ? 'Select period' : isFullMonth ? monthLabel : `${shortDate(filters.from)} – ${shortDate(moveDay(filters.to, -1))}`;
  function open(kind: NonNullable<typeof modal>, element: HTMLElement) {
    setError(''); setModal(kind); trigger.current = element;
    if (kind === 'period') { setFrom(filters.from); setThrough(validDate(filters.to) ? moveDay(filters.to, -1) : ''); }
    if (kind === 'title') setDraftTitle(title);
  }
  function submitPeriod(event: FormEvent) {
    event.preventDefault();
    try { if (!validDate(through) || through > '9998-12-31') throw new Error('Choose a valid end date.'); const to = moveDay(through, 1); validatePeriod(from, to); applyPeriod(from, to); setModal(null); setStatus('Reporting period updated.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid period.'); }
  }
  function exportSummary() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = `kindsight-report-${filters.from}.json`; anchor.click();
    URL.revokeObjectURL(url); setStatus('Summary downloaded as JSON.');
  }
  async function share(element: HTMLButtonElement) {
    try { await navigator.clipboard.writeText(link); setStatus('Dashboard link copied. An admin session is required to view it.'); }
    catch { open('share', element); }
  }
  return <>
    <title>{`${title} — Kindsight`}</title><div className="dashboard-shell__toolbar"><div className="dashboard-shell__heading"><h1 className="dashboard-shell__title">{title}</h1><button className="dashboard-shell__edit" type="button" aria-label="Edit dashboard title for this view" aria-haspopup="dialog" onClick={event => open('title', event.currentTarget)}><DashboardIcon name="edit" size="edit" /></button></div><div className="dashboard-shell__toolbar-actions"><button className="dashboard-shell__period" type="button" aria-label="Select reporting period" aria-haspopup="dialog" onClick={event => open('period', event.currentTarget)}><span className="dashboard-shell__calendar"><DashboardIcon name="calendar" size="calendar" /></span><span className="dashboard-shell__period-copy"><span>{visiblePeriod}</span><strong>{periodValid ? filters.from.slice(0, 4) : 'UTC'}</strong><span className="sr-only">{dateLabel} UTC</span></span></button><div className="dashboard-shell__tools"><button className="dashboard-shell__tool" type="button" aria-label="Print dashboard" onClick={() => window.print()}><DashboardIcon name="print" /></button><button className="dashboard-shell__tool" type="button" aria-label="Download summary as JSON" disabled={!report} onClick={exportSummary}><DashboardIcon name="export" /></button><button className="dashboard-shell__tool dashboard-shell__favorite" type="button" aria-label="Favorite dashboard for this visit" aria-pressed={favorite} onClick={() => setFavorite(value => !value)}><DashboardIcon name="favorite" /></button></div><button className="dashboard-shell__share" type="button" aria-label="Copy dashboard link" onClick={event => void share(event.currentTarget)}><span className="dashboard-shell__avatars" aria-hidden="true">{[avatar1, avatar2, avatar3].map((src, index) => <span key={src} className={`dashboard-shell__avatar${index === 1 ? ' dashboard-shell__avatar--second' : ''}`}><img src={src} alt="" /></span>)}</span><DashboardIcon name="share" /><span>Share</span></button></div></div>
    <Dialog className="dashboard-dialog" open={modal !== null} onClose={() => setModal(null)} initialFocus={close} returnFocus={trigger} aria-labelledby="dashboard-dialog-title"><div className="dashboard-dialog__header"><h2 id="dashboard-dialog-title">{modal === 'period' ? 'Reporting period' : modal === 'title' ? 'Dashboard title' : 'Copy dashboard link'}</h2><Button variant="light" size="sm" ref={close} onClick={() => setModal(null)}>Close</Button></div>
      {modal === 'period' && <form onSubmit={submitPeriod}><p>Dates use UTC. The selected end date is included. Up to 366 days.</p><div className="dashboard-dialog__fields"><label htmlFor="report-from">From</label><input id="report-from" type="date" value={from} required min="1000-01-01" max="9998-12-31" onInput={event => setFrom(event.currentTarget.value)} /><label htmlFor="report-through">Through</label><input id="report-through" type="date" value={through} required min="1000-01-01" max="9998-12-31" onInput={event => setThrough(event.currentTarget.value)} /></div><p className="dashboard-dialog__error" role="alert">{error}</p><div className="dashboard-dialog__actions"><Button size="sm" variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button size="sm" type="submit">Apply period</Button></div></form>}
      {modal === 'title' && <form onSubmit={event => { event.preventDefault(); if (!draftTitle.trim()) { setError('Enter a dashboard title.'); return; } setTitle(draftTitle.trim()); setModal(null); }}><p>This title applies until you leave or reload the page.</p><div className="dashboard-dialog__fields"><label htmlFor="dashboard-title-input">Title</label><input id="dashboard-title-input" value={draftTitle} maxLength={60} required onChange={event => setDraftTitle(event.target.value)} /></div><p className="dashboard-dialog__error" role="alert">{error}</p><div className="dashboard-dialog__actions"><Button size="sm" type="submit">Apply title</Button></div></form>}
      {modal === 'share' && <><p>Copy this link. Viewing the dashboard requires an admin session.</p><label className="dashboard-dialog__copy-label" htmlFor="dashboard-copy-link">Dashboard URL</label><input id="dashboard-copy-link" readOnly value={link} onFocus={event => event.currentTarget.select()} /></>}
    </Dialog>
    {status && <div className="dashboard-shell__status" role="status"><span>{status}</span><button type="button" aria-label="Dismiss message" onClick={() => setStatus('')}>Close</button></div>}
  </>;
}
