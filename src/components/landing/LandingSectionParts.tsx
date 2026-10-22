import { Fragment } from 'react';
import marker from '../../assets/missions/24ef8.svg';
import fade from '../../assets/missions/fed2b.svg';
export function HeadingLines({ lines, section }: { lines: string[]; section: string }) {
  return <>{lines.map((line, index) => <Fragment key={index}>{index > 0 && <><br className={`${section}__title-break`} />{' '}</>}<span>{line}</span></Fragment>)}</>;
}
export function SectionLabel({ children }: { children: string }) {
  return <p className="section-label"><img src={marker} alt="" aria-hidden="true" /><span>{children}</span></p>;
}
export function EndBackground({ horizontal, vertical }: { horizontal: string; vertical: string }) {
  return <div className="landing-end-background" aria-hidden="true"><div className="landing-end-background__horizontal"><img src={horizontal} alt="" /></div><div className="landing-end-background__vertical"><img src={vertical} alt="" /></div><div className="landing-end-background__fade landing-end-background__fade--top"><img src={fade} alt="" /></div><div className="landing-end-background__fade landing-end-background__fade--bottom"><img src={fade} alt="" /></div></div>;
}
export function GridBackground({ section, horizontal, vertical, cards, top, bottom = top }: { section: string; horizontal: string; vertical: string; cards: string; top: string; bottom?: string }) {
  return <div className={`${section}__background`} aria-hidden="true"><div className={`${section}__grid-horizontal`}><img src={horizontal} alt="" /></div><div className={`${section}__grid-vertical`}><img src={vertical} alt="" /></div><div className={`${section}__grid-cards`}><img src={cards} alt="" /></div><div className={`${section}__fade ${section}__fade--top`}><img src={top} alt="" /></div><div className={`${section}__fade ${section}__fade--bottom`}><img src={bottom} alt="" /></div></div>;
}
