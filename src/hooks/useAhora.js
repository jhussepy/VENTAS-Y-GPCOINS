import { useEffect, useState } from 'react';
export function useAhora() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setAhora(new Date());
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return ahora;
}
