const numero = (d: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: d, minimumFractionDigits: d });
const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export const fmtNumero = (n: number, d = 1) => numero(d).format(n);

/** Superficie en m² o hectáreas según magnitud, como en potreoGPS (formatArea). */
export function fmtSuperficie(m2: number): string {
  return m2 >= 10_000 ? `${fmtNumero(m2 / 10_000, 2)} ha` : `${fmtNumero(m2, 0)} m²`;
}

/** Distancia en metros o kilómetros según magnitud (formatDistance). */
export function fmtDistancia(m: number): string {
  return m >= 1000 ? `${fmtNumero(m / 1000, 2)} km` : `${Math.round(m)} m`;
}
export const fmtPesos = (n: number) => pesos.format(n);

/** Fecha de hoy en zona local, como AAAA-MM-DD (toISOString usa UTC y puede dar el día siguiente). */
export function hoyLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Muestra una fecha AAAA-MM-DD sin desfase por zona horaria. */
export function fmtFecha(iso: string): string {
  const solo = iso.length === 10 ? new Date(`${iso}T00:00`) : new Date(iso);
  return solo.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function mensaje(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}
