/**
 * Filtros de la imagen satelital de un potrero. Cada uno es una variable real calculada con Sentinel-2
 * (o la foto de color real del mapa). El servidor calcula los índices; la app solo los pide y los muestra.
 */
export type Filtro =
  | 'natural'
  | 'falso'
  | 'ndvi'
  | 'gndvi'
  | 'ndre'
  | 'evi'
  | 'ndmi'
  | 'ndwi';

/** Orden en el que se muestran en la app. */
export const FILTROS: Filtro[] = ['natural', 'ndvi', 'ndmi', 'gndvi', 'ndre', 'evi', 'ndwi', 'falso'];

export const ETIQUETA_FILTRO: Record<Filtro, string> = {
  natural: 'Color real',
  falso: 'Falso color',
  ndvi: 'Vigor (NDVI)',
  gndvi: 'Verdor (GNDVI)',
  ndre: 'Clorofila (NDRE)',
  evi: 'Vigor (EVI)',
  ndmi: 'Humedad (NDMI)',
  ndwi: 'Agua (NDWI)',
};

/** Qué mide cada filtro, en una frase para el productor. */
export const DESCRIPCION_FILTRO: Record<Filtro, string> = {
  natural: 'Foto satelital de color real del mapa.',
  falso: 'Vegetación sana en rojo intenso. Sirve para ver zonas con poca cubierta.',
  ndvi: 'Vigor general del pasto. Verde = vigoroso, rojo = poco vigor.',
  gndvi: 'Verdor del pasto, sensible a la clorofila de la hoja.',
  ndre: 'Clorofila del pasto. Útil para detectar estrés nutricional temprano.',
  evi: 'Vigor del pasto corregido por suelo y atmósfera. Bueno en pasto muy denso.',
  ndmi: 'Humedad de la vegetación. Café = seco, azul = húmedo.',
  ndwi: 'Agua en la superficie y en la vegetación. Azul = más agua.',
};

/** Escala de la leyenda: texto de los extremos y colores de la paleta del filtro. */
export const LEYENDA_FILTRO: Partial<Record<Filtro, { bajo: string; alto: string; colores: string }>> = {
  ndvi: { bajo: 'Poco vigor', alto: 'Muy vigoroso', colores: 'linear-gradient(90deg, #bf291f, #f5d140, #1f854a)' },
  gndvi: { bajo: 'Poco verdor', alto: 'Mucho verdor', colores: 'linear-gradient(90deg, #bf291f, #f5d140, #1f854a)' },
  ndre: { bajo: 'Poca clorofila', alto: 'Mucha clorofila', colores: 'linear-gradient(90deg, #bf291f, #f5d140, #1f854a)' },
  evi: { bajo: 'Poco vigor', alto: 'Muy vigoroso', colores: 'linear-gradient(90deg, #bf291f, #f5d140, #1f854a)' },
  ndmi: { bajo: 'Seco', alto: 'Húmedo', colores: 'linear-gradient(90deg, #8c6640, #f7f7f7, #2673d9)' },
  ndwi: { bajo: 'Sin agua', alto: 'Con agua', colores: 'linear-gradient(90deg, #8c6640, #f7f7f7, #2673d9)' },
};

/** Rango de valores de cada índice (mismo que usa el servidor para colorearlo). */
export const RANGO_INDICE: Partial<Record<Filtro, [number, number]>> = {
  ndvi: [-0.1, 0.9],
  gndvi: [0, 0.9],
  ndre: [0, 0.6],
  evi: [0, 0.9],
  ndmi: [-0.3, 0.6],
  ndwi: [-0.5, 0.3],
};

/** Uso sin límite: todos los filtros disponibles para cualquier usuario. */
export const FILTROS_POR_PLAN = {
  inicial: FILTROS,
  basico: FILTROS,
  mediano: FILTROS,
} as const;
