import '../../styles/components/_stat-card.scss';
export function StatCard({ value, suffix, label }: { value: string; suffix: string; label: string }) {
  return <div className="stat-card"><dt className="stat-card__label">{label}</dt><dd className="stat-card__value"><span>{value}</span><span className="stat-card__suffix">{suffix}</span></dd></div>;
}
