import type { EstadoParcela } from '../lib/tipos';

/** Texto de cada estado, igual que etiquetaEstadoPotrero en potreoGPS. */
export const ETIQUETA_ESTADO: Record<EstadoParcela, string> = {
  'en-cultivo': 'En cultivo',
  'sin-sembrar': 'Sin sembrar',
  lista: 'Lista para cosechar',
};
