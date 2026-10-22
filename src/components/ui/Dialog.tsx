import { useEffect, useRef, type DialogHTMLAttributes, type RefObject } from 'react';

type Props = Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose'> & {
  dismissible?: boolean; open: boolean; onClose: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
  returnFocus: RefObject<HTMLElement | null>;
};
export function Dialog({ open, onClose, dismissible=true, initialFocus, returnFocus, children, ...props }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) { dialog.showModal(); initialFocus?.current?.focus(); }
    else if (!open && dialog?.open) dialog.close();
  }, [open, initialFocus]);
  useEffect(() => {
    const dialog = ref.current;
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog {...props} ref={ref} onCancel={event=>{if(!dismissible)event.preventDefault();props.onCancel?.(event);}} onClose={event => {
    // StrictMode can queue a close during effect cleanup, then reopen immediately.
    if (event.currentTarget.open) return;
    onClose();
    if (returnFocus.current?.isConnected && returnFocus.current.checkVisibility()) returnFocus.current.focus();
  }} onClick={event => {
    if (!dismissible || event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
  }}>{children}</dialog>;
}
