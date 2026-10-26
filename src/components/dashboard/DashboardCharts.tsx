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
export function TrendChart({ points, interval, viewKey }: { points: TrendPoint[]; interval: 'day' | 'month'; viewKey: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const instance = useRef<Chart<'bar' | 'line'> | null>(null);
  const plotted = useRef<TrendPoint[]>([]);
  const previousView = useRef<string | null>(null);
  const reveal = useRef(1);
  const revealFrame = useRef(0);
  useEffect(() => {
    if (!canvas.current) return;
    const { color, font } = palette();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const chart = new Chart<'bar' | 'line'>(canvas.current, { plugins: [{
      id: 'raised-line-reveal',
      beforeDatasetDraw(chart, args) {
        const { ctx, chartArea: area } = chart;
        const progress = args.index === 0 ? reveal.current : Math.max(0, (reveal.current - .12) / .88);
        ctx.save(); ctx.beginPath();
        ctx.rect(area.left - 6, area.top - 6, (area.right - area.left + 12) * progress, area.bottom - area.top + 12);
        ctx.clip();
      },
      afterDatasetDraw(chart) { chart.ctx.restore(); },
    }], type: 'bar', data: { labels: [], datasets: [
      { type: 'line', label: 'Received', data: [], borderColor: color('brand'), backgroundColor: color('brand'), borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: .35, order: 0 },
      { type: 'bar', label: 'Received', data: [], backgroundColor: color('background'), hoverBackgroundColor: 'rgba(246,101,21,.25)', borderRadius: 10, borderSkipped: false, barPercentage: .9, categoryPercentage: .9, order: 1 },
    ] }, options: { responsive: true, maintainAspectRatio: false, animation: false, color: color('text-secondary'), font: { family: font }, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 12, left: 4, right: 4 } }, scales: { x: { border: { display: false }, grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, font: { size: 11 }, padding: 12 } }, y: { display: false, beginAtZero: true, grace: '20%' } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: color('text'), padding: 14, filter: item => item.datasetIndex === 0, callbacks: {
      title: items => `${plotted.current[items[0]?.dataIndex]?.bucket ?? ''} UTC`,
      label: context => `Total: ${money(String(context.raw))}`,
      afterLabel: context => `${plotted.current[context.dataIndex]?.donationCount ?? 0} received donation(s)`,
    } } } } });
    instance.current = chart; previousView.current = null;
    const change = () => { cancelAnimationFrame(revealFrame.current); reveal.current = 1; chart.stop(); chart.options.animation = false; chart.update('none'); };
    motion.addEventListener('change', change);
    return () => { cancelAnimationFrame(revealFrame.current); motion.removeEventListener('change', change); chart.destroy(); instance.current = null; previousView.current = null; };
  }, []);
  useEffect(() => {
    const chart = instance.current;
    if (!chart) return;
    const initial = previousView.current === null;
    const animate = initial || previousView.current !== viewKey;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    previousView.current = viewKey;
    plotted.current = points;
    cancelAnimationFrame(revealFrame.current);
    reveal.current = initial && !reduce ? 0 : 1;
    chart.stop();
    chart.data.labels = points.map(point => new Intl.DateTimeFormat('en-US', { month: 'short', ...(interval === 'month' ? { year: 'numeric' } as const : { day: 'numeric' } as const), timeZone: 'UTC' }).format(new Date(`${point.bucket}T00:00:00Z`)));
    chart.data.datasets.forEach(dataset => { dataset.data = points.map(point => Number(point.totalRaised)); });
    const line = chart.data.datasets[0];
    if (line.type === 'line') line.pointRadius = points.length <= 12 ? 3 : 0;
    if (chart.options.scales?.y) chart.options.scales.y.max = points.some(point => point.donationCount > 0) ? undefined : 1;
    chart.options.animation = animate && !initial && !reduce ? { duration: 1050, easing: 'easeOutQuart' } : false;
    chart.update(animate && !initial && !reduce ? undefined : 'none');
    if (initial && !reduce) {
      let start: number | undefined;
      const tick = (time: number) => {
        start ??= time;
        const progress = Math.min(1, (time - start) / 1200);
        reveal.current = 1 - Math.pow(1 - progress, 2);
        chart.draw();
        if (progress < 1) revealFrame.current = requestAnimationFrame(tick);
      };
      revealFrame.current = requestAnimationFrame(tick);
    }
  }, [points, interval, viewKey]);
  return <canvas ref={canvas} role="img" aria-label={`Received donations by ${interval === 'month' ? 'month' : 'date'} in USD, UTC. The same data is available in the table below.`} />;
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
