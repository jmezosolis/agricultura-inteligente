import type { Oferta, Parcela } from './tipos';
import { cosechaVencida } from './modelo';

/** Qué conviene hacer ahora con la parcela, en una frase. */
export function siguientePaso(p: Parcela, oferta: Oferta | undefined): string {
  if (!p.siembra) return 'Siguiente paso: indica la fecha de siembra en “Datos y manejo”.';
  if (cosechaVencida(p)) return 'Siguiente paso: registra la cosecha real en “Datos y manejo”.';
  if (!oferta) return 'Siguiente paso: publica tu oferta para compradores.';
  if (oferta.reserva) return `Siguiente paso: escribe a ${oferta.reserva.comprador} por WhatsApp para coordinar.`;
  return 'Siguiente paso: espera a que un comprador te escriba.';
}
