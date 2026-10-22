import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type Appearance = { variant?: 'primary' | 'dark' | 'light' | 'outline'; size?: 'md' | 'sm' };
function classes({ variant = 'primary', size = 'md' }: Appearance, extra = '') {
  return ['button', `button--${variant}`, size === 'sm' ? 'button--sm' : '', extra].filter(Boolean).join(' ');
}
function Label({ children }: { children: ReactNode }) { return <span className="button__label">{children}</span>; }
export function Button({ variant, size, className, children, type = 'button', icon, endIcon, ...props }: ComponentPropsWithRef<'button'> & Appearance & { icon?: ReactNode; endIcon?: ReactNode }) {
  return <button {...props} type={type} className={classes({ variant, size }, className)}>{icon}<Label>{children}</Label>{endIcon}</button>;
}
export function LinkButton({ variant, size, className, children, ...props }: Omit<LinkProps, 'className'> & Appearance & { className?: string }) {
  return <Link {...props} className={classes({ variant, size }, className)}><Label>{children}</Label></Link>;
}
