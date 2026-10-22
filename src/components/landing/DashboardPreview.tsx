import type { CSSProperties, ReactNode } from 'react';
import { heroIllustration as sample } from '../../data/hero';
import { supporters, previewNavigation, previewProfile, prospectImages } from './hero-assets';
import mark from '../../assets/brand/kindsight-mark.svg';
import home from '../../assets/icons/hero/home.svg';
import chartUp from '../../assets/icons/hero/chart-up.svg';
import chartCurve from '../../assets/icons/hero/chart-curve.svg';
import gift from '../../assets/icons/hero/major-gift.svg';
import gauge from '../../assets/icons/hero/pipeline-gauge.svg';
import bulb from '../../assets/icons/hero/ai-bulb.svg';
import prospects from '../../assets/icons/hero/prospects.svg';
import '../../styles/components/_dashboard-preview.scss';
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function PreviewIcon({ src }: { src: string }) { return <span className="dashboard-preview__icon"><img src={src} alt="" /></span>; }
function CardHeader({ icon, children }: { icon: string; children: ReactNode }) {
  return <div className="dashboard-preview__card-header"><PreviewIcon src={icon} />{children}</div>;
}
export function DashboardPreview() {
  return <div className="dashboard-preview" aria-hidden="true">
    <div className="dashboard-preview__topbar">
      <div className="dashboard-preview__brand"><span className="dashboard-preview__brand-mark"><img src={mark} alt="" /></span><span>Kindsight</span></div>
      <div className="dashboard-preview__navigation"><span className="dashboard-preview__selected"><PreviewIcon src={home} />Dashboard</span>
        {previewNavigation.map(src => <span className="dashboard-preview__navigation-dot" key={src}><img src={src} alt="" /></span>)}
      </div>
      <div className="dashboard-preview__profile"><img src={previewProfile} alt="" width={28} height={28} /><span><strong>Rafatar Albert</strong><small>rafatar@example.com</small></span></div>
    </div>
    <div className="dashboard-preview__toolbar"><p className="dashboard-preview__title">Fundraising Dashboard</p><div className="dashboard-preview__tools">
      <span className="dashboard-preview__date">14 November 2026</span><div className="dashboard-preview__people">{supporters.map(src => <img key={src} src={src} alt="" width={22} height={22} />)}</div><span>Share</span>
    </div></div>
    <div className="dashboard-preview__grid">
      <div className="dashboard-preview__card dashboard-preview__raised">
        <CardHeader icon={chartUp}><span className="dashboard-preview__label">Total raised</span><span className="dashboard-preview__period">This Week</span></CardHeader>
        <div className="dashboard-preview__amount"><strong>{sample.raised}</strong><span className="dashboard-preview__cents">{sample.cents}</span><span className="dashboard-preview__growth">{sample.growth}</span></div>
        <p className="dashboard-preview__progress">Good progress!</p>
        <div className="dashboard-preview__chart"><div className="dashboard-preview__bars">
          {sample.bars.map((height, index) => <div className="dashboard-preview__bar-column" key={days[index]}><span className={`dashboard-preview__bar${index === 2 ? ' dashboard-preview__bar--active' : ''}`} style={{ '--bar-height': `${height}%` } as CSSProperties} /><small>{days[index]}</small></div>)}
        </div><div className="dashboard-preview__curve"><img src={chartCurve} alt="" /></div><div className="dashboard-preview__tooltip"><small>10 NOVEMBER</small><span>Total: <strong>$2,425.87</strong></span></div></div>
      </div>
      <div className="dashboard-preview__right"><div className="dashboard-preview__cards">
        <div className="dashboard-preview__card"><CardHeader icon={gift}><span className="dashboard-preview__label">Major gift</span></CardHeader>
          <div className="dashboard-preview__legend"><span>Identified</span><span>Qualified</span><span>Active Ask</span></div>
          <div className="dashboard-preview__gauge"><img className="dashboard-preview__gauge-art" src={gauge} alt="" /><div className="dashboard-preview__gauge-value"><strong>{sample.majorGifts}</strong><small>Total</small></div></div>
          <div className="dashboard-preview__forecast"><div><small>Forecasted</small><p><strong>{sample.forecasted}</strong><span>M</span></p></div><div><small>Pending ask</small><p><strong>{sample.pending}</strong><span>K</span></p></div></div>
        </div>
        <div className="dashboard-preview__card dashboard-preview__insight"><div className="dashboard-preview__card-header"><span className="dashboard-preview__insight-dot"><img src={bulb} alt="" /></span><span className="dashboard-preview__label">AI insight</span><span className="dashboard-preview__generate">Generate</span></div>
          <p className="dashboard-preview__insight-value"><strong>{sample.insights}</strong><span>+</span></p><p className="dashboard-preview__insight-tag">High-potential donors identified this week</p>
          <p className="dashboard-preview__insight-copy">Our intelligence engine continuously analyzes donation history and identifies donors who are most likely to make larger donations.</p><p className="dashboard-preview__updated">Updated 2 hours ago</p>
        </div>
      </div>
      <div className="dashboard-preview__card dashboard-preview__prospects"><CardHeader icon={prospects}><span className="dashboard-preview__label">Top prospects</span><span className="dashboard-preview__search">Search</span></CardHeader>
        <div className="dashboard-preview__table-header">{['Name', 'Capacity', 'Last Gift', 'Engagement', 'Status'].map(label => <span key={label}>{label}</span>)}</div>
        {sample.prospects.map(person => <div className="dashboard-preview__row" key={person.image}><span className="dashboard-preview__person"><img src={prospectImages[person.image]} alt="" width={25} height={25} /><span>{person.name}</span></span><span>{person.capacity}</span><span>{person.gift}</span><span>{person.engagement}</span><span className="dashboard-preview__status">{person.status}</span></div>)}
      </div></div>
    </div>
  </div>;
}
