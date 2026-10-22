import type { ReactNode } from 'react';
type Props = { kind: 'loading' | 'empty' | 'error' | 'success'; children: ReactNode; action?: ReactNode };
export function StatusMessage({ kind, children, action }: Props) {
  return <div className={`ui-status ui-status--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    <p>{children}</p>{action}
  </div>;
}
