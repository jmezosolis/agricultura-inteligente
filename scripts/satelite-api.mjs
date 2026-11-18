/**
 * Conexión con Copernicus Data Space (Sentinel-2). Lo usa el servidor de desarrollo (vite.config.ts) y
 * nunca el navegador, para que la clave secreta no salga de tu computadora.
 *
 * Credenciales en potreros/.env.local:
 *   CDSE_CLIENT_ID=...
 *   CDSE_CLIENT_SECRET=...
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

/**
 * Índices reales de Sentinel-2. Cada uno calcula una variable del pasto o del agua con sus bandas.
 * `paleta` = 'vigor' (rojo→amarillo→verde) o 'agua' (café→blanco→azul). `rango` = valores mínimo y máximo
 * para colorear. Las fórmulas son las estándar de cada índice.
 */
export const INDICES = {
  ndvi: {
    nombre: 'Vigor NDVI',
    formula: '(s.B08 - s.B04) / (s.B08 + s.B04)',
    rango: [-0.1, 0.9],
    paleta: 'vigor',
  },
  gndvi: {
    nombre: 'Verdor GNDVI',
    formula: '(s.B08 - s.B03) / (s.B08 + s.B03)',
    rango: [0, 0.9],
    paleta: 'vigor',
  },
  ndre: {
    nombre: 'Clorofila NDRE',
    formula: '(s.B08 - s.B05) / (s.B08 + s.B05)',
    rango: [0, 0.6],
    paleta: 'vigor',
  },
  evi: {
    nombre: 'Vigor EVI',
    formula: '2.5 * (s.B08 - s.B04) / (s.B08 + 6 * s.B04 - 7.5 * s.B02 + 1)',
    rango: [0, 0.9],
    paleta: 'vigor',
  },
  ndmi: {
    nombre: 'Humedad NDMI',
    formula: '(s.B08 - s.B11) / (s.B08 + s.B11)',
    rango: [-0.3, 0.6],
    paleta: 'agua',
  },
  ndwi: {
    nombre: 'Agua NDWI',
    formula: '(s.B03 - s.B08) / (s.B03 + s.B08)',
    rango: [-0.5, 0.3],
    paleta: 'agua',
  },
};

/** Falso color infrarrojo: vegetación sana en rojo intenso. Es una composición, no un índice. */
const FALSO_COLOR = `//VERSION=3
function setup() {
  return { input: ["B03", "B04", "B08", "SCL", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  if (s.dataMask === 0 || [3, 8, 9, 10].includes(s.SCL)) return [0, 0, 0, 0];
  return [2.5 * s.B08, 2.5 * s.B04, 2.5 * s.B03, 1];
}`;

/** Script de color para un índice. Los píxeles de nube y sombra salen transparentes. */
function scriptIndice(clave) {
  const idx = INDICES[clave];
  const [min, max] = idx.rango;
  const paleta =
    idx.paleta === 'vigor'
      ? '[[0.75,0.16,0.12],[0.96,0.82,0.25],[0.12,0.52,0.29]]'
      : '[[0.55,0.40,0.25],[0.97,0.97,0.97],[0.15,0.45,0.85]]';
  return `//VERSION=3
function setup() {
  return { input: ["B02", "B03", "B04", "B05", "B08", "B11", "SCL", "dataMask"], output: { bands: 4 } };
}
function mezcla(a, b, t) { return a + (b - a) * t; }
function evaluatePixel(s) {
  if (s.dataMask === 0 || [3, 8, 9, 10].includes(s.SCL)) return [0, 0, 0, 0];
  const v = ${idx.formula};
  const t = Math.min(1, Math.max(0, (v - ${min}) / (${max} - ${min})));
  const p = ${paleta};
  const a = t < 0.5 ? p[0] : p[1];
  const b = t < 0.5 ? p[1] : p[2];
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return [mezcla(a[0], b[0], u), mezcla(a[1], b[1], u), mezcla(a[2], b[2], u), 1];
}`;
}

/** Modos que acepta el servidor: los índices, el falso color y el color real de Sentinel. */
export const MODOS = ['natural', 'falso', ...Object.keys(INDICES)];

const EVAL = {
  natural: `//VERSION=3
function setup() {
  return { input: ["B02", "B03", "B04", "SCL", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  if (s.dataMask === 0 || [3, 8, 9, 10].includes(s.SCL)) return [0, 0, 0, 0];
  return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02, 1];
}`,
  falso: FALSO_COLOR,
};
for (const clave of Object.keys(INDICES)) EVAL[clave] = scriptIndice(clave);

/** Lee potreros/.env.local a mano (no depende de variables del sistema). */
export function leerCredenciales(raiz) {
  // En un host en línea las credenciales vienen de variables secretas; en tu computadora, de .env.local.
  const env = {
    CDSE_CLIENT_ID: process.env.CDSE_CLIENT_ID,
    CDSE_CLIENT_SECRET: process.env.CDSE_CLIENT_SECRET,
  };
  const archivo = path.join(raiz, '.env.local');
  if (!env.CDSE_CLIENT_ID && existsSync(archivo)) {
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  if (!env.CDSE_CLIENT_ID || !env.CDSE_CLIENT_SECRET) {
    throw new Error('Falta configurar las credenciales de Copernicus en potreros/.env.local (CDSE_CLIENT_ID y CDSE_CLIENT_SECRET).');
  }
  return { id: env.CDSE_CLIENT_ID, secreto: env.CDSE_CLIENT_SECRET };
}

let tokenCache = { valor: null, expira: 0 };

async function token(cred) {
  if (tokenCache.valor && Date.now() < tokenCache.expira - 60_000) return tokenCache.valor;
  const cuerpo = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cred.id,
    client_secret: cred.secreto,
  });
  const r = await fetch(TOKEN_URL, { method: 'POST', body: cuerpo });
  if (!r.ok) throw new Error(`Copernicus rechazó las credenciales (${r.status}). Revisa .env.local.`);
  const datos = await r.json();
  tokenCache = { valor: datos.access_token, expira: Date.now() + datos.expires_in * 1000 };
  return tokenCache.valor;
}

/**
 * Tamaño de salida. Sentinel-2 tiene 10 m por píxel, pero pedimos 5 m por píxel con un mínimo de 512 px
 * para que un potrero pequeño no salga borroso. Sube el costo de la consulta, así que no pasamos de 2000 px.
 */
function dimensiones(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const anchoM = (maxLon - minLon) * 111_320 * Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const altoM = (maxLat - minLat) * 110_540;
  const ancho = Math.min(2000, Math.max(512, Math.round(anchoM / 5)));
  const alto = Math.min(2000, Math.max(512, Math.round(ancho * (altoM / anchoM))));
  return { ancho, alto };
}

/** Cache en memoria por potrero y modo, 12 horas. Evita gastar cuota en cada cambio de filtro. */
const cache = new Map();
const TTL = 12 * 3_600_000;

/**
 * PNG de la zona del potrero para el modo dado. Fuera del polígono la imagen es transparente.
 * `anillo`: [[lon, lat], ...]. `dias`: días hacia atrás para elegir las escenas.
 */
export async function imagenSatelite({ raiz, anillo, modo, dias = 365 }) {
  if (!MODOS.includes(modo)) throw new Error('Modo de imagen no válido.');
  if (!Array.isArray(anillo) || anillo.length < 3) throw new Error('El potrero necesita al menos 3 puntos.');

  const clave = `${modo}|${dias}|${anillo.map((p) => p.join(',')).join(';')}`;
  const previa = cache.get(clave);
  if (previa && Date.now() - previa.hora < TTL) return previa.png;

  const cred = leerCredenciales(raiz);
  const lons = anillo.map((p) => p[0]);
  const lats = anillo.map((p) => p[1]);
  const bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  const { ancho, alto } = dimensiones(bbox);
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * 86_400_000);

  const cuerpo = {
    input: {
      bounds: {
        geometry: { type: 'Polygon', coordinates: [[...anillo, anillo[0]]] },
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: desde.toISOString(), to: hasta.toISOString() },
            // Un año de escenas, hasta 80 % de nubes: cada píxel tapado se llena con otra fecha de la misma zona.
            // Los píxeles de nube y sombra nunca se muestran como pasto.
            maxCloudCoverage: 80,
            mosaickingOrder: 'leastCC',
          },
        },
      ],
    },
    output: { width: ancho, height: alto, responses: [{ identifier: 'default', format: { type: 'image/png' } }] },
    evalscript: EVAL[modo],
  };

  const r = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token(cred)}`, 'Content-Type': 'application/json', Accept: 'image/png' },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`Sentinel Hub respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const png = Buffer.from(await r.arrayBuffer());
  cache.set(clave, { png, hora: Date.now() });
  return png;
}
