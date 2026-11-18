import type { Estado, NuevaParcela, Oferta } from './tipos';

const CLAVE = 'agro-morelos-v2';
const VACIO: Estado = { parcelas: [], ofertas: [], lotes: [], plaguicidas: [], firmsKey: '' };

/** Lee lo guardado en este navegador. Si no hay nada o está dañado, empieza vacío. */
export function cargarEstado(): Estado {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return VACIO;
    const datos = JSON.parse(raw) as Partial<Estado> & { contratos?: unknown; plantilla?: unknown };
    return {
      parcelas: datos.parcelas ?? [],
      ofertas: (datos.ofertas ?? []).map(migrarOferta),
      lotes: datos.lotes ?? [],
      plaguicidas: datos.plaguicidas ?? [],
      firmsKey: datos.firmsKey ?? '',
      telefono: datos.telefono,
    };
  } catch {
    return VACIO;
  }
}

/** Ofertas guardadas antes de la reserva por WhatsApp: se completan los campos nuevos. */
function migrarOferta(o: Oferta): Oferta {
  return {
    ...o,
    telefonoProductor: o.telefonoProductor ?? '',
    reserva: o.reserva ?? null,
  };
}

export function guardarEstado(estado: Estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* sin almacenamiento disponible: la sesión sigue funcionando */
  }
}

export function nuevoId(prefijo: string): string {
  return prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Parcela de ejemplo cerca de Yautepec, para mostrar la app sin datos propios. */
export function parcelaEjemplo(): NuevaParcela {
  const x0 = -99.0765;
  const y0 = 18.8905;
  const d = 0.0045;
  const hoy = new Date();
  const siembra = new Date(hoy.getTime() - 60 * 86400000).toISOString().slice(0, 10);
  return {
    nombre: 'Parcela de ejemplo · Yautepec',
    cultivo: 'maiz',
    siembra,
    ndvi: null,
    anillo: [
      [x0, y0],
      [x0 + d, y0],
      [x0 + d, y0 + d],
      [x0, y0 + d],
    ],
  };
}
