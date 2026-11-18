import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Variables en .env.local (ver .env.example). Sin ellas, la app funciona solo en este navegador.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && claveAnonima ? createClient(url, claveAnonima) : null;

/** true cuando hay base compartida: las ofertas se ven entre dispositivos. */
export const conBaseCompartida = supabase !== null;

/** Inicio de sesión: solo si se activa explícitamente (la versión sin cuentas sigue siendo la predeterminada). */
export const conCuentas = supabase !== null && import.meta.env.VITE_CON_CUENTAS === '1';
