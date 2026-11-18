import { PRECIOS_MAIZ } from './calibracion';
import type { Cultivo } from './tipos';

/** Banda de referencia: ±10 % alrededor del precio del SIAP. */
export const BANDA_PRECIO = 0.1;

export interface Referencia {
  precio: number;
  ano: number;
  fuente: string;
}

/** Precio de referencia por tonelada. Solo maíz tiene serie del SIAP en la app; los demás no. */
export function referenciaPrecio(cultivo: Cultivo): Referencia | null {
  if (cultivo !== 'maiz') return null;
  return {
    precio: PRECIOS_MAIZ.ultimoPrecio,
    ano: PRECIOS_MAIZ.ultimoAno,
    fuente: 'SIAP, precio medio rural del maíz temporal de Morelos',
  };
}

export type PosicionPrecio = 'dentro' | 'arriba' | 'abajo' | 'sin-referencia';

export interface ComparacionPrecio {
  posicion: PosicionPrecio;
  /** Diferencia porcentual frente a la referencia (positiva = más caro). */
  diferenciaPct: number | null;
  referencia: Referencia | null;
}

/** Compara un precio con la referencia del SIAP y lo clasifica dentro o fuera de la banda. */
export function compararPrecio(cultivo: Cultivo, precio: number): ComparacionPrecio {
  const ref = referenciaPrecio(cultivo);
  if (!ref) return { posicion: 'sin-referencia', diferenciaPct: null, referencia: null };
  const diferencia = (precio - ref.precio) / ref.precio;
  const posicion: PosicionPrecio = diferencia > BANDA_PRECIO ? 'arriba' : diferencia < -BANDA_PRECIO ? 'abajo' : 'dentro';
  return { posicion, diferenciaPct: Math.round(diferencia * 1000) / 10, referencia: ref };
}

/** Precio sugerido para publicar: la referencia redondeada a 10 pesos. */
export function precioSugerido(cultivo: Cultivo): number | null {
  const ref = referenciaPrecio(cultivo);
  return ref ? Math.round(ref.precio / 10) * 10 : null;
}
