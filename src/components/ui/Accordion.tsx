import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import '../../styles/components/_accordion.scss';
import '../../styles/components/_accordion-smooth.scss';

type AccordionItem = { id: string; title: string; description: string; icon?: string };
export function Accordion({ items, label, defaultIcon }: { items: AccordionItem[]; label: string; defaultIcon?: string }) {
  const id = useId();
  const [openId, setOpenId] = useState<string | null>(() => items[0]?.id ?? null);
  const activeId = items.some(item => item.id === openId) ? openId : null;
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const rows = [...element.querySelectorAll<HTMLElement>('.accordion__item')];
    const measure = () => {
      let headings = 0, description = 0;
      rows.forEach(row => {
        const heading = row.querySelector<HTMLElement>('.accordion__heading')!;
        const text = row.querySelector<HTMLElement>('.accordion__panel p')!;
        const content = row.querySelector<HTMLElement>('.accordion__panel-content')!;
        const style = getComputedStyle(content);
        const rowHeight = heading.offsetHeight + parseFloat(getComputedStyle(row).borderBottomWidth);
        row.style.setProperty('--accordion-row-height', `${rowHeight}px`);
        headings += rowHeight;
        description = Math.max(description, text.offsetHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
      });
      const style = getComputedStyle(element);
      // Reserve the longest description, including hidden panels, before paint.
      element.style.setProperty('--accordion-height', `${headings + description + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    element.querySelectorAll('.accordion__heading, .accordion__panel p').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break;
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break;
      case 'Home': next = 0; break;
      case 'End': next = items.length - 1; break;
      default: return;
    }
    event.preventDefault();
    triggers.current[next]?.focus();
  }
  return <div className="accordion accordion--smooth" role="group" aria-label={label} ref={root}>
    {items.map((item, index) => {
      const open = item.id === activeId;
      const icon = item.icon ?? defaultIcon;
      const triggerId = `${id}-${item.id}-trigger`, panelId = `${id}-${item.id}-panel`;
      return <div key={item.id} className="accordion__item" data-open={open}>
        <h3 className="accordion__heading"><button className="accordion__trigger" type="button" id={triggerId}
          ref={element => { triggers.current[index] = element; }} aria-expanded={open} aria-controls={panelId}
          onClick={() => setOpenId(value => value === item.id ? null : item.id)} onKeyDown={event => moveFocus(event, index)}>
          <span className="accordion__title-group">
            {icon && <span className="accordion__icon-reveal" aria-hidden="true"><span className="accordion__icon"><span className="accordion__icon-inner"><span className="accordion__icon-slot"><img src={icon} alt="" /></span></span></span></span>}
            <span className="accordion__title">{item.title}</span>
          </span>
          <span className="accordion__indicator" aria-hidden="true"><span className="accordion__indicator-line" /><span className="accordion__indicator-line accordion__indicator-line--vertical" /></span>
        </button></h3>
        <div className="accordion__panel" id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open}><div className="accordion__panel-content"><p>{item.description}</p></div></div>
      </div>;
    })}
    <div className="accordion__spacer" data-active={activeId === null} aria-hidden="true" />
  </div>;
}
