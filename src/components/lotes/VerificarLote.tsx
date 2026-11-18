import { TIPOS_EVENTO, type Lote } from '../../lib/tipos';
import { ETIQUETA_ESTADO_LOTE, estadoLote, eventosOrdenados, fechaLiberacion, kgCosechados, liberacionLote } from '../../lib/lotes';
import { hoyLocal } from '../../lib/formato';
import { fmtFecha, fmtNumero } from '../../lib/formato';

interface Props {
  codigo: string;
  lotes: Lote[];
}

/** Página de verificación para el comprador: solo lectura del historial del lote. */
export function VerificarLote({ codigo, lotes }: Props) {
  const lote = lotes.find((l) => l.codigo === codigo.toUpperCase()) ?? null;

  if (!lote) {
    return (
      <section className="verificar">
        <p className="eyebrow">Verificación de lote</p>
        <h1>No encontramos el lote {codigo}</h1>
        <p className="texto-suave">
          Revisa el código. Si lo escaneaste desde otro teléfono, el historial todavía no está publicado: se guarda solo en el
          navegador del productor.
        </p>
      </section>
    );
  }

  const estado = estadoLote(lote);
  return (
    <section className="verificar">
      <p className="eyebrow">Verificación de lote</p>
      <h1>
        {lote.hortaliza}
        {lote.variedad ? ` · ${lote.variedad}` : ''}
      </h1>
      <p className="texto-suave">
        Código {lote.codigo} · {ETIQUETA_ESTADO_LOTE[estado]}
        {kgCosechados(lote) > 0 ? ` · ${fmtNumero(kgCosechados(lote), 0)} kg cosechados` : ''}
      </p>
      {liberacionLote(lote) && (
        <p className="carencia-aviso cumplida">
          {liberacionLote(lote)!.fecha > hoyLocal()
            ? `Periodo de carencia de ${liberacionLote(lote)!.producto} vigente hasta el ${fmtFecha(liberacionLote(lote)!.fecha)}.`
            : `Periodo de carencia de ${liberacionLote(lote)!.producto} cumplido.`}
        </p>
      )}
      <ol className="linea-tiempo">
        {eventosOrdenados(lote).map((e) => (
          <li key={e.id} className={`evento ${e.tipo}`}>
            <span className="evento-punto" aria-hidden="true" />
            <div>
              <strong>{TIPOS_EVENTO[e.tipo]}</strong>
              <span className="pequeno texto-suave">
                {fmtFecha(e.fecha)} · {e.detalle}
                {e.kg ? ` · ${fmtNumero(e.kg, 0)} kg` : ''}
              </span>
              {fechaLiberacion(e) && (
                <span className="pequeno carencia-linea">Libre para cosecha desde el {fmtFecha(fechaLiberacion(e) ?? '')}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="pequeno texto-suave">Historial registrado por el productor. Parcela: {lote.parcelaNombre}.</p>
    </section>
  );
}
