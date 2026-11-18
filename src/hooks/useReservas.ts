import type { Dispatch, SetStateAction } from 'react';
import type { Estado } from '../lib/tipos';
import { estimar, rangoProduccion, cosechaEstimadaFecha, centroide } from '../lib/modelo';

interface Args {
  setEstado: Dispatch<SetStateAction<Estado>>;
  setAviso: (texto: string | null) => void;
}

/** Acciones sobre ofertas: reservar, liberar la reserva y actualizar la oferta con la estimación actual. */
export function useReservas({ setEstado, setAviso }: Args) {
  const actualizarOferta = (parcelaId: string, estado: Estado) => {
    const p = estado.parcelas.find((x) => x.id === parcelaId);
    const o = estado.ofertas.find((x) => x.parcelaId === parcelaId && activa(x.estado));
    if (!p || !o) return;
    const est = estimar(p);
    setEstado((prev) => ({
      ...prev,
      ofertas: prev.ofertas.map((x) =>
        x.id === o.id
          ? {
              ...x,
              toneladas: est.total,
              rangoT: rangoProduccion(p),
              cosechaEstimada: cosechaEstimadaFecha(p),
              basada: p.manejo?.toneladasReales ? 'real' : 'modelo',
              centro: centroide(p.anillo),
            }
          : x,
      ),
    }));
    setAviso('Oferta actualizada con la estimación actual.');
  };

  const reservar = (ofertaId: string, comprador: string, telefono: string) => {
    setEstado((prev) => ({
      ...prev,
      ofertas: prev.ofertas.map((x) =>
        x.id === ofertaId && x.estado === 'abierta'
          ? { ...x, estado: 'reservada', reserva: { comprador, telefono, fecha: new Date().toISOString() } }
          : x,
      ),
    }));
    setAviso('Reserva registrada. Escribe al productor por WhatsApp para coordinar.');
  };

  const liberarReserva = (ofertaId: string) => {
    setEstado((prev) => ({
      ...prev,
      ofertas: prev.ofertas.map((x) => (x.id === ofertaId ? { ...x, estado: 'abierta', reserva: null } : x)),
    }));
    setAviso('La oferta volvió a estar abierta.');
  };

  return { actualizarOferta, reservar, liberarReserva };
}

function activa(estado: 'abierta' | 'reservada') {
  return estado === 'abierta' || estado === 'reservada';
}
