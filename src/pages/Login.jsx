import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loginConGoogle } from '../lib/firebase.js';
import { LEMA } from '../data/biblia.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    </svg>
  );
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginConGoogle();
    } catch (e) {
      const msg = e.code === 'auth/popup-closed-by-user'
        ? 'Cerraste la ventana antes de terminar.'
        : 'Error al iniciar sesión. Inténtalo de nuevo.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative overflow-hidden bg-bg-base">
      {/* Fondo con halos de marca (Vodafone rojo + Lowi azul) */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-vf-red/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-600/20 blur-3xl" />

      <div className="card fade-in p-8 w-full max-w-sm text-center space-y-6 relative z-10">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-bg-surface2 border border-bg-border flex items-center justify-center">
            <img src="/vodafone.svg" alt="Vodafone" className="w-12 h-12" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-fg">Ventas & GP Coins</h1>
          <p className="text-fg-muted text-sm mt-1">Captación · Vodafone + Lowi</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-vf-red/15 text-vf-redLight border border-vf-red/30">Vodafone</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-600/15 text-sky-400 border border-sky-600/30">Lowi</span>
          </div>
        </div>

        {/* Versículo lema: trabajar como para el Señor */}
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/25 px-4 py-3">
          <p className="font-serif text-sm text-fg-soft leading-relaxed">“{LEMA.texto}”</p>
          <p className="text-[11px] font-semibold text-indigo-300 mt-1">{LEMA.cita}</p>
        </div>

        <div className="h-px bg-bg-border" />

        <div className="space-y-3">
          <p className="text-xs text-fg-muted">
            Inicia sesión para acceder a tus datos sincronizados en la nube.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn w-full justify-center bg-bg-surface2 border border-bg-border hover:bg-bg-border text-fg-soft disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            {loading ? 'Iniciando sesión…' : 'Continuar con Google'}
          </button>
          {error && (
            <p className="text-vf-redLight text-xs">{error}</p>
          )}
        </div>

        <p className="text-[10px] text-fg-muted">
          Solo usuarios autorizados. Los datos se guardan en tu cuenta Google de forma privada.
        </p>
      </div>
    </div>
  );
}
