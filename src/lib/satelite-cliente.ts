import type { Posicion } from './tipos';
import type { Filtro } from './satelite';

const cache = new Map<string, string>();

/**
 * Pide al servidor la imagen de Sentinel-2 del potrero para el filtro elegido.
 * Devuelve una URL local (blob) lista para el mapa. Las respuestas se guardan en esta sesión.
 */
export async function imagenPotrero(anillo: Posicion[], filtro: Filtro): Promise<string> {
  // El nombre del filtro es el mismo modo que entiende el servidor.
  const modo = filtro;
  const clave = `${modo}|${anillo.map((p) => p.join(',')).join(';')}`;
  const previa = cache.get(clave);
  if (previa) return previa;

  const respuesta = await fetch('/api/satelite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anillo, modo }),
  });
  if (!respuesta.ok) {
    const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new Error(datos.error ?? 'No pudimos obtener la imagen satelital.');
  }
  const url = URL.createObjectURL(await respuesta.blob());
  cache.set(clave, url);
  return url;
}

/** Caja [minLon, minLat, maxLon, maxLat] de un anillo. */
export function cajaDe(anillo: Posicion[]): [number, number, number, number] {
  const lons = anillo.map((p) => p[0]);
  const lats = anillo.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}
