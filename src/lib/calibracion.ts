// Generado por modelo/exportar_calibracion.py el 2026-11-05.
// No editar a mano: vuelve a generarlo tras cambiar los datos o el modelo.
//
// Fuente: SIAP, Cierre de la producción agrícola (Morelos, maíz grano).
// Modelo de rendimiento (temporal): intercepto + pendienteAno * (año - 2015) + pendienteLluvia * lluvia_mayo_octubre_mm.
// Error medio leave-one-out: 0.46 t/ha (promedio histórico: 0.75). Muestra pequeña: usar como guía.

export const CALIBRACION_MAIZ = {
  anoBase: 2015,
  intercepto: 0.35387,
  pendienteAno: 0.30590,
  pendienteLluvia: 0.002700,
  lluviaMediaMm: 842.9,
  maeLoo: 0.459,
  // Maíz de riego: promedio 2020-2024 (SIAP Morelos), sin modelo de clima.
  riegoBaseTHa: 4.872,
} as const;

// Precio medio rural del maíz temporal primavera-verano en Morelos (SIAP), pesos por tonelada.
export const PRECIOS_MAIZ = {
  porAno: {
    2015: 3512,
    2016: 3591,
    2017: 3525,
    2018: 3774,
    2019: 3717,
    2020: 3711,
    2021: 3848,
    2022: 5991,
    2023: 5568,
    2024: 5171,
    2025: 5359,
  } as Record<number, number>,
  ultimoAno: 2025,
  ultimoPrecio: 5359,
  promedio3Anos: 5366,
} as const;
