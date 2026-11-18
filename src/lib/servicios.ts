import type { Clima, Fuego, Posicion } from './tipos';

const MENSAJE_RED = 'No hubo conexión con el servicio. Revisa tu internet e intenta de nuevo.';

/** Pronóstico de 14 días en Open-Meteo (gratuito, uso no comercial). */
export async function consultarClima(centro: Posicion): Promise<Clima> {
  const [lon, lat] = centro;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&daily=precipitation_sum,temperature_2m_min,temperature_2m_max&forecast_days=14&timezone=auto';

  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error(MENSAJE_RED);
  }
  if (!r.ok) throw new Error(`Open-Meteo respondió con error ${r.status}. Intenta más tarde.`);

  const d = (await r.json()) as {
    daily: { precipitation_sum: (number | null)[]; temperature_2m_min: number[]; temperature_2m_max: number[] };
  };
  const lluvia = d.daily.precipitation_sum.reduce<number>((s, v) => s + (v ?? 0), 0);

  return {
    lluvia14: Math.round(lluvia * 10) / 10,
    tmin: Math.round(Math.min(...d.daily.temperature_2m_min) * 10) / 10,
    tmax: Math.round(Math.max(...d.daily.temperature_2m_max) * 10) / 10,
    consultado: new Date().toISOString(),
  };
}

/** Focos de calor VIIRS en una caja de ~22 km alrededor de la parcela, últimos 7 días. */
export async function consultarFuego(centro: Posicion, clave: string): Promise<Fuego> {
  const [lon, lat] = centro;
  const g = 0.1;
  const caja = [lon - g, lat - g, lon + g, lat + g].map((v) => v.toFixed(4)).join(',');
  const url =
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(clave)}/VIIRS_SNPP_NRT/${caja}/7`;

  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error(MENSAJE_RED);
  }
  if (!r.ok) throw new Error(`NASA FIRMS respondió con error ${r.status}. Revisa tu clave en Ajustes.`);

  const txt = (await r.text()).trim();
  if (!txt.startsWith('latitude')) {
    throw new Error('NASA FIRMS no devolvió datos. Revisa tu clave en Ajustes.');
  }
  return { focos7d: Math.max(0, txt.split('\n').length - 1), consultado: new Date().toISOString() };
}
