// ============================================================================
//  Validaciones de datos de cliente (avisos no bloqueantes)
// ============================================================================

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Valida un DNI (8 dígitos + letra de control) o NIE (X/Y/Z + 7 dígitos + letra)
export function dniValido(valor) {
  const v = String(valor || '').trim().toUpperCase();
  if (!v) return true; // vacío = no validamos (campo opcional)
  const m = v.match(/^([XYZ]?)(\d{7,8})([A-Z])$/);
  if (!m) return false;
  let numero = m[2];
  if (m[1]) {
    // NIE: X→0, Y→1, Z→2 delante del número
    numero = String('XYZ'.indexOf(m[1])) + numero;
  }
  if (numero.length !== 8) return false;
  return LETRAS_DNI[Number(numero) % 23] === m[3];
}

// Valida un teléfono español (9 dígitos, admite espacios/guiones/prefijo +34)
export function telefonoValido(valor) {
  const v = String(valor || '').trim();
  if (!v) return true; // opcional
  const limpio = v.replace(/[\s-]/g, '').replace(/^\+34/, '');
  return /^[6789]\d{8}$/.test(limpio);
}

// Valida un email básico
export function emailValido(valor) {
  const v = String(valor || '').trim();
  if (!v) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Devuelve un array de mensajes de aviso para los datos de contacto
export function avisosContacto(v) {
  const avisos = [];
  if (!dniValido(v.dni)) avisos.push('El DNI/NIE no parece válido.');
  if (!telefonoValido(v.telefono)) avisos.push('El teléfono no parece válido (9 dígitos).');
  if (!emailValido(v.email)) avisos.push('El email no parece válido.');
  return avisos;
}
