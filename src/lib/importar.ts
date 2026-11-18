import type { Posicion } from './tipos';

export interface PoligonoImportado {
  nombre: string;
  anillo: Posicion[];
}

export const MAX_IMPORTADOS = 50;

const esPosicion = (v: unknown): v is Posicion =>
  Array.isArray(v) &&
  v.length >= 2 &&
  typeof v[0] === 'number' &&
  typeof v[1] === 'number' &&
  Math.abs(v[0]) <= 180 &&
  Math.abs(v[1]) <= 90;

/** Quita el punto de cierre (repetido al inicio) y valida que quede un anillo utilizable. */
function limpiarAnillo(coords: unknown[]): Posicion[] | null {
  const pts = coords.filter(esPosicion).map((p) => [p[0], p[1]] as Posicion);
  if (pts.length >= 2) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) pts.pop();
  }
  return pts.length >= 3 ? pts : null;
}

function nombreBase(nombreArchivo: string): string {
  return nombreArchivo.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Importada';
}

export function leerGeoJSON(texto: string, nombreArchivo: string): PoligonoImportado[] {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un GeoJSON válido. Revisa que sea un JSON bien formado.');
  }

  const features: unknown[] = (() => {
    const o = json as { type?: string; features?: unknown[]; geometry?: unknown };
    if (o?.type === 'FeatureCollection' && Array.isArray(o.features)) return o.features;
    if (o?.type === 'Feature') return [o];
    if (o?.type === 'Polygon' || o?.type === 'MultiPolygon') return [{ type: 'Feature', properties: {}, geometry: o }];
    return [];
  })();

  const salida: PoligonoImportado[] = [];
  const base = nombreBase(nombreArchivo);

  features.forEach((f) => {
    const feat = f as { properties?: Record<string, unknown> | null; geometry?: { type?: string; coordinates?: unknown } | null };
    const g = feat.geometry;
    if (!g || !g.coordinates) return;
    const props = feat.properties ?? {};
    const nombre = String(props.name ?? props.nombre ?? props.Name ?? `${base} ${salida.length + 1}`);
    const anillos: unknown[][] = [];

    if (g.type === 'Polygon') anillos.push(...(g.coordinates as unknown[][]).slice(0, 1));
    if (g.type === 'MultiPolygon') {
      (g.coordinates as unknown[][][]).forEach((poli) => anillos.push(poli[0]));
    }
    anillos.forEach((anillo, k) => {
      const pts = limpiarAnillo(anillo as unknown[]);
      if (pts) {
        salida.push({ nombre: anillos.length > 1 ? `${nombre} (${k + 1})` : nombre, anillo: pts });
      }
    });
  });

  if (!salida.length) {
    throw new Error('No encontré polígonos en el GeoJSON. Verifica que contenga áreas (Polygon o MultiPolygon).');
  }
  return salida;
}

export function leerKML(texto: string, nombreArchivo: string): PoligonoImportado[] {
  const doc = new DOMParser().parseFromString(texto, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('El archivo no es un KML válido. Revisa que sea un XML de Google Earth bien formado.');
  }

  const base = nombreBase(nombreArchivo);
  const salida: PoligonoImportado[] = [];
  const marcas = Array.from(doc.getElementsByTagNameNS('*', 'Placemark'));

  marcas.forEach((m, i) => {
    const polis = Array.from(m.getElementsByTagNameNS('*', 'Polygon'));
    if (!polis.length) return;
    const nombre = m.getElementsByTagNameNS('*', 'name')[0]?.textContent?.trim() || `${base} ${i + 1}`;

    polis.forEach((poli, k) => {
      const outer = poli.getElementsByTagNameNS('*', 'outerBoundaryIs')[0];
      const coordsTxt = outer?.getElementsByTagNameNS('*', 'coordinates')[0]?.textContent ?? '';
      const coords = coordsTxt
        .trim()
        .split(/\s+/)
        .map((c) => c.split(',').slice(0, 2).map(Number))
        .filter((c) => c.length === 2 && c.every((n) => Number.isFinite(n)));
      const pts = limpiarAnillo(coords);
      if (pts) {
        salida.push({ nombre: polis.length > 1 ? `${nombre} (${k + 1})` : nombre, anillo: pts });
      }
    });
  });

  if (!salida.length) {
    throw new Error('No encontré polígonos en el KML. Verifica que contenga áreas (Polygon), no solo puntos o líneas.');
  }
  return salida;
}

/** Elige el lector según la extensión y el contenido del archivo. */
export async function leerArchivoGeo(archivo: File): Promise<PoligonoImportado[]> {
  const texto = await archivo.text();
  const nombre = archivo.name.toLowerCase();
  if (nombre.endsWith('.kml') || texto.trimStart().startsWith('<')) {
    return leerKML(texto, archivo.name);
  }
  return leerGeoJSON(texto, archivo.name);
}
