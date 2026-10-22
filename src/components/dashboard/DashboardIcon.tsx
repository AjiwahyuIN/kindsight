import { icons } from './assets';
export function DashboardIcon({ name, size = 'sm' }: { name: keyof typeof icons; size?: string }) {
  return <span className={`dashboard-shell__icon dashboard-shell__icon--${size}`} aria-hidden="true"><img src={icons[name]} alt="" /></span>;
}
