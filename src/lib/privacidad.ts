/**
 * Ubicación para mostrar a terceros (compradores). Redondea a 0.02 ° (≈ 2 km): suficiente para
 * saber la zona, no para localizar el predio. La ubicación exacta solo la ve el productor.
 */
export function zonaAproximada([lon, lat]: [number, number]): [number, number] {
  const r = (v: number) => Math.round(v / 0.02) * 0.02;
  return [r(lon), r(lat)];
}

/** Texto de la zona aproximada, por ejemplo "18.90° N, 99.08° O (zona aproximada, ±1 km)". */
export function textoZona(centro: [number, number]): string {
  const [lon, lat] = zonaAproximada(centro);
  return `${Math.abs(lat).toFixed(2)}° N, ${Math.abs(lon).toFixed(2)}° O (zona aproximada, ±1 km)`;
}
