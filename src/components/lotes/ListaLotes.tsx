import { ETIQUETA_ESTADO_LOTE, diasEntre, estadoLote, kgCosechados } from '../../lib/lotes';
import { fmtFecha, fmtNumero } from '../../lib/formato';
import type { Lote, Parcela } from '../../lib/tipos';

interface Props {
  lotes: Lote[];
  parcelas: Parcela[];
  onAbrir: (id: string) => void;
  onNuevo: () => void;
}

/** Lista de lotes: una ficha por lote con su estado y su código. */
export function ListaLotes({ lotes, parcelas, onAbrir, onNuevo }: Props) {
  const orden = [...lotes].sort((a, b) => b.creado.localeCompare(a.creado));
  return (
    <section className="lotes-pagina">
      <header className="lotes-cabecera">
        <div>
          <p className="eyebrow">Trazabilidad</p>
          <h1>Lotes de hortalizas</h1>
          <p className="texto-suave">Cada lote guarda su historial desde la siembra hasta la entrega.</p>
        </div>
        <button type="button" className="primario" onClick={onNuevo} disabled={parcelas.length === 0}>
          Nuevo lote
        </button>
      </header>

      {parcelas.length === 0 && (
        <p className="nota-lote">Primero dibuja una parcela en la pestaña Parcelas. Un lote siempre pertenece a una parcela.</p>
      )}

      {orden.length === 0 ? (
        <p className="nota-lote">Aún no hay lotes. Crea el primero para empezar a registrar su historial.</p>
      ) : (
        <ul className="lotes-fichas">
          {orden.map((l) => {
            const estado = estadoLote(l);
            const kg = kgCosechados(l);
            return (
              <li key={l.id}>
                <button type="button" className={`lote-ficha ${estado}`} onClick={() => onAbrir(l.id)}>
                  <div className="lote-ficha-cabeza">
                    <span className="lote-codigo">{l.codigo}</span>
                    <span className={`lote-chip ${estado}`}>{ETIQUETA_ESTADO_LOTE[estado]}</span>
                  </div>
                  <h2>{l.hortaliza}</h2>
                  <p className="texto-suave">
                    {l.variedad ? `${l.variedad} · ` : ''}
                    {l.parcelaNombre}
                  </p>
                  <dl className="lote-datos">
                    <div>
                      <dt>Siembra</dt>
                      <dd>{fmtFecha(l.fechaSiembra)}</dd>
                    </div>
                    <div>
                      <dt>Días</dt>
                      <dd>{diasEntre(l.fechaSiembra)}</dd>
                    </div>
                    <div>
                      <dt>Cosecha</dt>
                      <dd>{kg > 0 ? `${fmtNumero(kg, 0)} kg` : '—'}</dd>
                    </div>
                  </dl>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
