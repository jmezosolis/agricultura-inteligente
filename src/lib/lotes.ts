import type { Carencia, EventoLote, Hortaliza, Lote, TipoEvento } from './tipos';
import { nuevoId } from './almacen';

const PREFIJO: Record<Hortaliza, string> = {
  Jitomate: 'JIT',
  Cebolla: 'CEB',
  Chile: 'CHI',
  Calabacita: 'CAL',
  Pepino: 'PEP',
  Lechuga: 'LEC',
};

/** Código público del lote: prefijo de la hortaliza, fecha de siembra (AAMMDD) y consecutivo del día. */
export function generarCodigo(hortaliza: Hortaliza, fechaSiembra: string, lotes: Lote[]): string {
  const pre = PREFIJO[hortaliza];
  const fecha = fechaSiembra.replace(/-/g, '').slice(2);
  const base = `${pre}-${fecha}-`;
  let n = 1;
  const usados = new Set(lotes.map((l) => l.codigo));
  while (usados.has(`${base}${String(n).padStart(3, '0')}`)) n++;
  return `${base}${String(n).padStart(3, '0')}`;
}

export function nuevoEvento(
  tipo: TipoEvento,
  fecha: string,
  detalle: string,
  kg?: number,
  carencia?: Carencia,
): EventoLote {
  return { id: nuevoId('e'), tipo, fecha, detalle, kg, carencia, registrado: new Date().toISOString() };
}

/** Eventos en orden cronológico (por fecha y luego por hora de registro). */
export function eventosOrdenados(l: Lote): EventoLote[] {
  return [...l.eventos].sort((a, b) => (a.fecha === b.fecha ? a.registrado.localeCompare(b.registrado) : a.fecha.localeCompare(b.fecha)));
}

export type EstadoLote = 'en-cultivo' | 'cosechado' | 'entregado';

export function estadoLote(l: Lote): EstadoLote {
  if (l.eventos.some((e) => e.tipo === 'entrega')) return 'entregado';
  if (l.eventos.some((e) => e.tipo === 'cosecha')) return 'cosechado';
  return 'en-cultivo';
}

export const ETIQUETA_ESTADO_LOTE: Record<EstadoLote, string> = {
  'en-cultivo': 'En cultivo',
  cosechado: 'Cosechado',
  entregado: 'Entregado',
};

/** Kilos totales cosechados registrados en el lote. */
export function kgCosechados(l: Lote): number {
  return l.eventos.filter((e) => e.tipo === 'cosecha').reduce((s, e) => s + (e.kg ?? 0), 0);
}

/** Días desde una fecha AAAA-MM-DD hasta hoy (o hasta otra fecha). */
export function diasEntre(desde: string, hasta: Date = new Date()): number {
  const ini = new Date(`${desde}T00:00`).getTime();
  return Math.max(0, Math.floor((hasta.getTime() - ini) / 86_400_000));
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fecha (AAAA-MM-DD) desde la que se puede cosechar tras un plaguicida; null si el evento no tiene carencia. */
export function fechaLiberacion(e: EventoLote): string | null {
  if (e.tipo !== 'plaguicida' || !e.carencia) return null;
  return sumarDias(e.fecha, e.carencia.dias);
}

/** La carencia más tardía del lote: la cosecha no puede registrarse antes de esa fecha. */
export function liberacionLote(l: Lote): { fecha: string; producto: string } | null {
  let mejor: { fecha: string; producto: string } | null = null;
  for (const e of l.eventos) {
    const f = fechaLiberacion(e);
    if (f && e.carencia && (!mejor || f > mejor.fecha)) mejor = { fecha: f, producto: e.carencia.producto };
  }
  return mejor;
}
