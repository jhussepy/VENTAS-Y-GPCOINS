// Genera un identificador único. Usa crypto.randomUUID cuando está disponible
// (contextos seguros: HTTPS/localhost) y cae a un fallback en otros casos.
export const nuevoId = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* ignore */ }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
