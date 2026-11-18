import { irA } from '../../lib/ruta';
import type { EventoLote, Lote, Parcela, Plaguicida } from '../../lib/tipos';
import { ListaLotes } from './ListaLotes';
import { NuevoLote } from './NuevoLote';
import { FichaLote } from './FichaLote';

interface Props {
  /** Segmento tras /lotes: undefined (lista), "nuevo" o el id de un lote. */
  id: string | undefined;
  parcelas: Parcela[];
  lotes: Lote[];
  onCrear: (lote: Lote) => void;
  onAgregar: (loteId: string, evento: EventoLote) => void;
  plaguicidas: Plaguicida[];
  onCatalogar: (producto: Plaguicida) => void;
}

/** Enruta las vistas de lotes según la parte final de la ruta #/lotes/... */
export function LotesPagina({ id, parcelas, lotes, onCrear, onAgregar, plaguicidas, onCatalogar }: Props) {
  if (id === undefined) {
    return <ListaLotes lotes={lotes} parcelas={parcelas} onAbrir={(x) => irA(`/lotes/${x}`)} onNuevo={() => irA('/lotes/nuevo')} />;
  }

  if (id === 'nuevo') {
    // Un lote de trazabilidad solo puede ir en una parcela de hortalizas.
    const deHortalizas = parcelas.filter((p) => p.cultivo === 'hortalizas');
    return <NuevoLote parcelas={deHortalizas} lotes={lotes} onCrear={onCrear} onCancelar={() => irA('/lotes')} />;
  }

  const lote = lotes.find((l) => l.id === id);
  if (!lote) {
    return (
      <section className="nota-lote">
        <p>No encontramos ese lote. Puede haberse borrado en este dispositivo.</p>
        <button type="button" className="enlace" onClick={() => irA('/lotes')}>
          Volver a lotes
        </button>
      </section>
    );
  }

  return (
    <FichaLote
      lote={lote}
      plaguicidas={plaguicidas}
      onAgregar={(evento) => onAgregar(lote.id, evento)}
      onCatalogar={onCatalogar}
      onVolver={() => irA('/lotes')}
    />
  );
}
