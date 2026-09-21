// Formats accepted by all spreadsheet imports; no locale-dependent Date parsing.
export function numeroLocal(value) {
  if (value === '' || value == null) return 0;
  const text = String(value).trim().replace(/\s/g, '');
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  const result = Number(normalized);
  if (!Number.isFinite(result)) throw new Error(`Importe inválido: ${value}`);
  return result;
}

export function fechaExcel(XLSX, value) {
  if (value === '' || value == null) return '';
  let text = String(value).trim();
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) throw new Error('Fecha de Excel inválida.');
    text = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const spanish = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (spanish) text = `${spanish[3]}-${spanish[2].padStart(2, '0')}-${spanish[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) text = text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Fecha inválida: ${value}. Usa DD/MM/AAAA.`);
  const d = new Date(`${text}T12:00:00Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== text) throw new Error(`Fecha inexistente: ${value}`);
  return text;
}
