/** Módulos de la app. Cada persona usa uno: el productor (Campo) o el comprador (Mercado). */
export type Rol = 'productor' | 'comprador';

export const MODULOS: Record<Rol, { nombre: string; descripcion: string }> = {
  productor: { nombre: 'Campo', descripcion: 'Parcelas, cosecha y ofertas' },
  comprador: { nombre: 'Mercado', descripcion: 'Ofertas y reservas' },
};

export const ROL_PREDETERMINADO: Rol = 'productor';
