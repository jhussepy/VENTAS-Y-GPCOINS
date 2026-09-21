import { useEffect, useRef } from 'react';
const stack = [];
export default function DialogSurface({ children, onClose, label = 'Editar registro', role = 'dialog', ...props }) {
  const ref = useRef(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement;
    stack.push(el);
    const focusables = () => [...el.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')].filter(x => !x.closest('[hidden]'));
    (focusables()[0] || el).focus();
    const key = e => {
      if (stack.at(-1) !== el) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current?.(); }
      if (e.key === 'Tab') {
        const items = focusables(); const first = items[0] || el; const last = items.at(-1) || el;
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    };
    const focus = e => { if (stack.at(-1) === el && !el.contains(e.target)) (focusables()[0] || el).focus(); };
    document.addEventListener('keydown', key, true); document.addEventListener('focusin', focus);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { stack.splice(stack.indexOf(el), 1); document.removeEventListener('keydown', key, true); document.removeEventListener('focusin', focus); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div {...props} ref={ref} role={role} aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>;
}
