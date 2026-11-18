import { supabase } from '../lib/supabase';
import type { Cultivo, Oferta, Reserva } from '../lib/tipos';

/** Fila de la tabla `ofertas` (nombres de columnas en snake_case). */
interface FilaOferta {
  id: string;
  owner_id: string;
  parcela_local_id: string;
  parcela_nombre: string;
  cultivo: Cultivo;
  toneladas: number;
  rango_min: number;
  rango_max: number;
  precio: number;
  cosecha_estimada: string | null;
  riego: boolean;
  variedad: string;
  zona_lon: number;
  zona_lat: number;
  basada: 'modelo' | 'real';
  telefono_productor: string;
  estado: 'abierta' | 'reservada';
  reserva: Reserva | null;
  publicada: string;
  /** Columnas nuevas: requieren la migración de la tabla `ofertas` (ver nota en la respuesta). */
  lote_id?: string | null;
  lote_codigo?: string | null;
}

/** Oferta tal como la ve la app. `dueno` indica si la publicó el usuario con sesión activa. */
export type OfertaRemota = Oferta & { owner_id: string };

function aOferta(f: FilaOferta): OfertaRemota {
  return {
    id: f.id,
    owner_id: f.owner_id,
    parcelaId: f.parcela_local_id,
    parcelaNombre: f.parcela_nombre,
    cultivo: f.cultivo,
    toneladas: f.toneladas,
    precio: f.precio,
    estado: f.estado,
    publicada: f.publicada,
    rangoT: [f.rango_min, f.rango_max],
    cosechaEstimada: f.cosecha_estimada,
    riego: f.riego,
    variedad: f.variedad,
    centro: [f.zona_lon, f.zona_lat],
    basada: f.basada,
    telefonoProductor: f.telefono_productor,
    reserva: f.reserva,
    lote: f.lote_codigo ? { id: f.lote_id ?? '', codigo: f.lote_codigo } : null,
  };
}

function aFila(o: Oferta, ownerId: string): Omit<FilaOferta, 'publicada'> {
  return {
    id: o.id,
    owner_id: ownerId,
    parcela_local_id: o.parcelaId,
    parcela_nombre: o.parcelaNombre,
    cultivo: o.cultivo,
    toneladas: o.toneladas,
    rango_min: o.rangoT[0],
    rango_max: o.rangoT[1],
    precio: o.precio,
    cosecha_estimada: o.cosechaEstimada,
    riego: o.riego,
    variedad: o.variedad,
    zona_lon: o.centro[0],
    zona_lat: o.centro[1],
    basada: o.basada,
    telefono_productor: o.telefonoProductor,
    estado: 'abierta',
    reserva: null,
    // Solo se envían si hay lote: así publicar sin lote no depende de la migración.
    ...(o.lote ? { lote_id: o.lote.id, lote_codigo: o.lote.codigo } : {}),
  };
}

/** Todas las ofertas publicadas. No requiere sesión. */
export async function listarOfertasCompartidas(): Promise<OfertaRemota[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('ofertas').select('*').order('publicada', { ascending: false }).limit(500);
  if (error) throw new Error('No se pudieron cargar las ofertas. Revisa tu conexión.');
  return (data as FilaOferta[]).map(aOferta);
}

export async function publicarOfertaCompartida(o: Oferta, ownerId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('ofertas').insert(aFila(o, ownerId));
  if (error) throw new Error(mensajeError(error.message, 'No se pudo publicar la oferta.'));
}

export async function reservarOfertaCompartida(id: string, reserva: Reserva & { comprador_uid: string }): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('ofertas').update({ estado: 'reservada', reserva }).eq('id', id).eq('estado', 'abierta');
  if (error) throw new Error(mensajeError(error.message, 'No se pudo registrar la reserva.'));
}

export async function liberarOfertaCompartida(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('ofertas').update({ estado: 'abierta', reserva: null }).eq('id', id);
  if (error) throw new Error(mensajeError(error.message, 'No se pudo liberar la oferta.'));
}

/** Traduce los límites de la base a un mensaje claro para el usuario. */
function mensajeError(tecnico: string, general: string): string {
  if (/row-level security|violates row-level/i.test(tecnico)) return 'No puedes hacer esto con tu cuenta, o alcanzaste el límite de 5 ofertas por día.';
  return general;
}
