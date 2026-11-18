import type { Estado } from '../lib/tipos';
import { cargarEstado, guardarEstado } from '../lib/almacen';

/**
 * Dónde se guardan los datos. Hoy: el navegador de cada persona.
 * Al conectar Supabase se agrega otra implementación con la misma interfaz;
 * las pantallas no cambian.
 */
export interface Repositorio {
  cargar(): Estado;
  guardar(estado: Estado): void;
}

export const repositorioLocal: Repositorio = {
  cargar: cargarEstado,
  guardar: guardarEstado,
};
