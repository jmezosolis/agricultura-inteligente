import { estimar, rendimientoBaseHa, hectareas } from './modelo';
import type { Parcela } from './tipos';

const celda = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV de parcelas con manejo, cosecha real y estimación, para entrenar el modelo con datos propios. */
export function parcelasACsv(parcelas: Parcela[]): string {
  const cab = [
    'id', 'nombre', 'cultivo', 'hectareas', 'siembra', 'riego', 'variedad', 'densidad_pl_ha',
    'nitrogeno_kg_ha', 'riegos', 'fecha_cosecha', 'toneladas_reales', 'rendimiento_real_t_ha',
    'rendimiento_base_t_ha', 'estimacion_t_ha', 'ndvi', 'lluvia_14d_mm',
  ];
  const filas = parcelas.map((p) => {
    const m = p.manejo;
    const real = m?.toneladasReales ? m.toneladasReales / hectareas(p.anillo) : null;
    return [
      p.id, p.nombre, p.cultivo, p.hectareas.toFixed(3), p.siembra ?? '', m?.riego ? 1 : 0,
      m?.variedad ?? '', m?.densidad ?? '', m?.nitrogenoKgHa ?? '', m?.riegos ?? '',
      m?.fechaCosecha ?? '', m?.toneladasReales ?? '', real === null ? '' : real.toFixed(3),
      rendimientoBaseHa(p).toFixed(3), estimar(p).tHa, p.ndvi ?? '', p.clima?.lluvia14 ?? '',
    ].map(celda).join(',');
  });
  return [cab.join(','), ...filas].join('\n');
}

export function descargarCsv(nombre: string, contenido: string) {
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
