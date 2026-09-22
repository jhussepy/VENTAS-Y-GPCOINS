export const identidadCliente = (v, origen = '') => {
  const dni = String(v.dni || v.cif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return dni ? `doc:${dni}` : `registro:${origen}:${v.id}`;
};
export const contarClientes = (ventas) => new Set(ventas.map((v, i) => identidadCliente({ ...v, id: v.id || `sin-id-${i}` }))).size;

export function agruparClientes(ventas, ventasLowi, agendados) {
  const grupos = new Map();
  for (const [origen, registros] of Object.entries({ vodafone: ventas, lowi: ventasLowi, agenda: agendados })) {
    for (const registro of registros) {
      const id = identidadCliente(registro, origen);
      const cliente = grupos.get(id) || { id, nombre: `${registro.nombre || ''} ${registro.apellido || ''}`.trim(), dni: registro.dni || registro.cif || '', telefono: registro.telefono || '', registros: [] };
      cliente.telefono ||= registro.telefono || '';
      cliente.registros.push({ ...registro, origen });
      grupos.set(id, cliente);
    }
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
