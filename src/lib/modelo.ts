import { area } from '@turf/area';
import { CULTIVOS, PALETA_PARCELAS, type EstadoParcela, type Parcela, type Posicion } from './tipos';
import { CALIBRACION_MAIZ } from './calibracion';

/** Color de la parcela: el elegido por el usuario o uno de la paleta según su id (estable entre cargas). */
export function colorParcela(p: Parcela): string {
  if (p.color) return p.color;
  const suma = [...p.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return PALETA_PARCELAS[suma % PALETA_PARCELAS.length];
}

/** Texto blanco o marino según qué tan claro sea el fondo, para que se lea. */
export function textoSobre(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luz = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luz > 0.6 ? '#0F2A4A' : '#FFFFFF';
}

export interface Estimacion {
  tHa: number;
  total: number;
  ajustes: string[];
}

const redondear = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Superficie del polígono en hectáreas. */
export function hectareas(anillo: Posicion[]): number {
  if (anillo.length < 3) return 0;
  return area({ type: 'Polygon', coordinates: [[...anillo, anillo[0]]] }) / 10000;
}

const RADIO_TIERRA_M = 6371008.8;

/** Distancia entre dos puntos sobre la esfera, en metros (fórmula del semiverseno). */
export function distanciaM(a: Posicion, b: Posicion): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Perímetro cerrado en metros. Con menos de 2 vértices devuelve 0. */
export function perimetroM(anillo: Posicion[]): number {
  if (anillo.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < anillo.length; i++) {
    total += distanciaM(anillo[i], anillo[(i + 1) % anillo.length]);
  }
  return anillo.length >= 3 ? total : total / 2;
}

/**
 * Estado derivado de la siembra. Sin fecha de siembra la parcela está sin sembrar;
 * cuando ya pasó ~85% del ciclo del cultivo, está lista para cosechar.
 */
export function estadoParcela(p: Parcela, ahora = Date.now()): EstadoParcela {
  if (!p.siembra) return 'sin-sembrar';
  const dias = (ahora - new Date(p.siembra + 'T00:00:00').getTime()) / 86400000;
  return dias >= CULTIVOS[p.cultivo].cicloDias * 0.85 ? 'lista' : 'en-cultivo';
}

/** Días que faltan para la cosecha estimada (null si no hay siembra). */
export function diasParaCosecha(p: Parcela, ahora = Date.now()): number | null {
  if (!p.siembra) return null;
  const fin = new Date(p.siembra + 'T00:00:00').getTime() + CULTIVOS[p.cultivo].cicloDias * 86400000;
  return Math.max(0, Math.ceil((fin - ahora) / 86400000));
}

/** Centro aproximado de la parcela (promedio de vértices). */
export function centroide(anillo: Posicion[]): Posicion {
  const n = anillo.length || 1;
  const lon = anillo.reduce((s, p) => s + p[0], 0) / n;
  const lat = anillo.reduce((s, p) => s + p[1], 0) / n;
  return [lon, lat];
}

/**
 * Modelo ilustrativo: rendimiento base del cultivo × ajuste por NDVI × ajuste por clima.
 * Los rendimientos base son supuestos; no usar en contratos sin calibración.
 */
const ANO_MAX_ENTRENAMIENTO = 2024;

/**
 * Rendimiento base (t/ha) antes de ajustes. Para maíz usa el modelo calibrado con SIAP Morelos
 * (temporal: tendencia + lluvia de mayo a octubre; riego: promedio 2020-2024).
 * Otros cultivos siguen con el supuesto de CULTIVOS hasta tener su calibración.
 */
export function rendimientoBaseHa(p: Parcela): number {
  if (p.cultivo !== 'maiz') return CULTIVOS[p.cultivo].tHa;
  if (p.manejo?.riego) return CALIBRACION_MAIZ.riegoBaseTHa;
  // No extrapolar la tendencia más allá del último año con datos (2024): evita sobreestimar temporadas nuevas.
  const anioSolicitado = p.siembra ? Number(p.siembra.slice(0, 4)) : new Date().getFullYear();
  const anio = Math.min(anioSolicitado, ANO_MAX_ENTRENAMIENTO);
  const c = CALIBRACION_MAIZ;
  return c.intercepto + c.pendienteAno * (anio - c.anoBase) + c.pendienteLluvia * c.lluviaMediaMm;
}

/** Comparación de la estimación contra la cosecha real medida, si el productor la registró. */
export function comparacionCosecha(p: Parcela): { realTHa: number; errorPct: number } | null {
  const t = p.manejo?.toneladasReales;
  if (!t || p.hectareas <= 0) return null;
  const realTHa = t / p.hectareas;
  const estimadoTHa = estimar(p).tHa;
  return { realTHa: Math.round(realTHa * 100) / 100, errorPct: Math.round(((estimadoTHa - realTHa) / realTHa) * 1000) / 10 };
}

export function estimar(p: Parcela): Estimacion {
  let factor = 1;
  const ajustes: string[] = [];

  // El NDVI no ajusta la estimación: con la regla actual movía el resultado casi 3x sin validación.
  // Se conserva como dato informativo hasta tener series de NDVI con cosechas reales por parcela.

  // El clima de 14 días NO ajusta la estimación de temporada: un pronóstico corto no predice el ciclo completo.
  // Las alertas (sequía, helada, exceso de lluvia) se muestran aparte en la ficha.
  // La lluvia de la temporada ya entra en el modelo calibrado (rendimientoBaseHa).

  const tHa = rendimientoBaseHa(p) * factor;
  return { tHa: redondear(tHa), total: redondear(tHa * p.hectareas), ajustes };
}

/** Rango de producción en toneladas: ±error del modelo (maíz) o ±25 % en otros cultivos sin calibrar. */
export function rangoProduccion(p: Parcela): [number, number] {
  const total = estimar(p).total;
  const error = p.cultivo === 'maiz' ? CALIBRACION_MAIZ.maeLoo : 0.25 * CULTIVOS[p.cultivo].tHa;
  const margen = error * p.hectareas;
  return [Math.max(0, Math.round((total - margen) * 10) / 10), Math.round((total + margen) * 10) / 10];
}

/** Fecha estimada de cosecha (siembra + ciclo del cultivo), AAAA-MM-DD. */
export function cosechaEstimadaFecha(p: Parcela): string | null {
  if (!p.siembra) return null;
  const f = new Date(p.siembra + 'T00:00:00').getTime() + CULTIVOS[p.cultivo].cicloDias * 86400000;
  return new Date(f).toISOString().slice(0, 10);
}

/** La fecha estimada de cosecha ya pasó y el productor no registró la cosecha real. */
export function cosechaVencida(p: Parcela, ahora = Date.now()): boolean {
  if (p.manejo?.toneladasReales) return false;
  const fecha = cosechaEstimadaFecha(p);
  return !!fecha && new Date(fecha + 'T23:59:59').getTime() < ahora;
}
