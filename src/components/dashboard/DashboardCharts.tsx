import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import type { TrendPoint } from '../../services/dashboard-types';
import { money } from '../../services/dashboard-utils';
Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip);
function palette() {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => style.getPropertyValue(`--color-${name}`).trim();
  return { color, font: style.getPropertyValue('--font-family').trim() };
}
export function TrendChart({ points, interval }: { points: TrendPoint[]; interval: 'day' | 'month' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const { color, font } = palette();
    const values = points.map(point => Number(point.totalRaised));
    const chart = new Chart<'bar' | 'line'>(canvas.current, { type: 'bar', data: {
      labels: points.map(point => new Intl.DateTimeFormat('en-US', { month: 'short', ...(interval === 'month' ? { year: 'numeric' } as const : { day: 'numeric' } as const), timeZone: 'UTC' }).format(new Date(`${point.bucket}T00:00:00Z`))),
      datasets: [ { type: 'line', label: 'Received', data: values, borderColor: color('brand'), backgroundColor: color('brand'), borderWidth: 2, pointRadius: points.length <= 12 ? 3 : 0, pointHoverRadius: 5, tension: .35, order: 0 }, { type: 'bar', label: 'Received', data: values, backgroundColor: color('background'), hoverBackgroundColor: 'rgba(246,101,21,.25)', borderRadius: 10, borderSkipped: false, barPercentage: .9, categoryPercentage: .9, order: 1 } ],
    }, options: { responsive: true, maintainAspectRatio: false, animation: false, color: color('text-secondary'), font: { family: font }, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 12, left: 4, right: 4 } }, scales: { x: { border: { display: false }, grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, font: { size: 11 }, padding: 12 } }, y: { display: false, beginAtZero: true, grace: '20%', ...(points.some(point => point.donationCount > 0) ? {} : { max: 1 }) } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: color('text'), padding: 14, filter: item => item.datasetIndex === 0, callbacks: { title: items => `${points[items[0].dataIndex].bucket} UTC`, label: context => `Total: ${money(String(context.raw))}`, afterLabel: context => `${points[context.dataIndex].donationCount} received donation(s)` } } } } });
    return () => chart.destroy();
  }, [points, interval]);
  return <canvas ref={canvas} role="img" aria-label="Received donations by date in USD, UTC. The same data is available in the table below." />;
}
export function GaugeChart({ percent, label }: { percent: string | null; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const { color } = palette();
    const bounded = percent === null ? 0 : Math.min(100, Math.max(0, Number(percent)));
    const chart = new Chart(canvas.current, { type: 'doughnut', data: { datasets: [{ data: [bounded, 100 - bounded], backgroundColor: [color('brand'), color('border')], borderWidth: 0, borderRadius: 8, hoverOffset: 0 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, rotation: -90, circumference: 180, cutout: '86%', events: [], plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
    return () => chart.destroy();
  }, [percent]);
  return <canvas ref={canvas} role="img" aria-label={label} />;
}
