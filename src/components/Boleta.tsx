import { useState, type FormEvent } from 'react';
import { CULTIVOS, type Lote, type Manejo, type Oferta, type Parcela } from '../lib/tipos';
import { colorParcela, cosechaVencida, diasParaCosecha, estadoParcela, estimar, textoSobre } from '../lib/modelo';
import { fmtNumero, fmtPesos } from '../lib/formato';
import { ETIQUETA_ESTADO } from './etiquetas';
import { ManejoForm } from './ManejoForm';
import { EditarDatos, type DatosParcela } from './EditarDatos';
import { precioSugerido, referenciaPrecio } from '../lib/precios';
import { siguientePaso } from '../lib/siguientePaso';
import { enlaceWhatsapp } from '../lib/whatsapp';
import { SaludCultivo } from './SaludCultivo';

/** Mensaje inicial hacia el comprador que reservó. */
function mensajeParaComprador(o: Oferta): string {
  return `Hola, soy el productor de "${o.parcelaNombre}". Vi tu reserva de ${fmtNumero(o.toneladas, 1)} t de ${CULTIVOS[o.cultivo].nombre} a ${fmtPesos(o.precio)} por tonelada. ¿Coordinamos la entrega?`;
}

interface Props {
  parcela: Parcela;
  /** Lotes de esta parcela, para elegir cuál se vende. */
  lotes: Lote[];
  oferta: Oferta | undefined;
  onActualizarOferta: () => void;
  onLiberarReserva: () => void;
  cargando: boolean;
  onPublicar: (precio: number, loteId: string | null) => void;
  onCambiarColor: (color: string) => void;
  onGuardarManejo: (manejo: Manejo) => void;
  onEditarDatos: (datos: DatosParcela) => void;
  onActualizar: () => void;
  onEliminar: () => void;
  onCerrar: () => void;
}

/**
 * Ficha de la parcela. Lo principal va arriba: estado, cosecha estimada, clima y oferta.
 * La edición de datos y el manejo quedan plegados para no estorbar.
 */
export function Boleta({
  parcela: p,
  lotes,
  oferta,
  onActualizarOferta,
  onLiberarReserva,
  cargando,
  onPublicar,
  onCambiarColor,
  onGuardarManejo,
  onEditarDatos,
  onActualizar,
  onEliminar,
  onCerrar,
}: Props) {
  const est = estimar(p);
  const estado = estadoParcela(p);
  const color = colorParcela(p);
  const dias = diasParaCosecha(p);
  const ref = referenciaPrecio(p.cultivo);
  // Sin referencia de precio para el cultivo, el campo queda vacío: no se propone un precio inventado.
  const [precio, setPrecio] = useState(String(precioSugerido(p.cultivo) ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string>(lotes[0]?.id ?? '');

  const publicar = (e: FormEvent) => {
    e.preventDefault();
    const valor = Number(precio);
    if (!(valor > 0)) {
      setError('Escribe un precio mayor que cero.');
      return;
    }
    setError(null);
    onPublicar(valor, loteId || null);
  };

  const alertasClima = p.clima
    ? [p.clima.tmin < 2 && 'helada', p.clima.lluvia14 < 10 && 'sequía', p.clima.lluvia14 > 120 && 'exceso de lluvia'].filter(Boolean)
    : [];

  return (
    <article className="boleta" aria-labelledby="boleta-titulo">
      <header className="boleta-cabeza">
        <div>
          <p className="eyebrow">
            {CULTIVOS[p.cultivo].nombre} · {fmtNumero(p.hectareas)} ha
          </p>
          <h2 id="boleta-titulo">{p.nombre}</h2>
        </div>
        <button type="button" className="enlace" onClick={onCerrar}>
          Cerrar
        </button>
      </header>

      <span className="estado-parcela" style={{ background: color, color: textoSobre(color) }}>
        {ETIQUETA_ESTADO[estado]}
        {dias !== null && estado !== 'lista' ? ` · cosecha en ${dias} días` : ''}
      </span>

      <p className="siguiente-paso">{siguientePaso(p, oferta)}</p>

      <SaludCultivo parcela={p} />

      <section className="boleta-cosecha" aria-label="Cosecha estimada">
        <p className="cifra" aria-live="polite">
          {fmtNumero(est.total)}
          <span className="cifra-unidad"> t</span>
        </p>
        <p className="cifra-etiqueta">
          {fmtNumero(est.tHa, 2)} t/ha · {CULTIVOS[p.cultivo].calibrado ? 'modelo SIAP Morelos' : 'supuesto general, sin calibrar'}
        </p>
        {cosechaVencida(p) && (
          <p className="alerta-texto pequeno" role="status">
            Ya pasó la fecha estimada. Registra la cosecha real en “Datos y manejo”.
          </p>
        )}
      </section>

      <section className="bloque" aria-label="Clima de los próximos 14 días">
        {p.clima ? (
          <p className="pequeno">
            Próximos 14 días: {fmtNumero(p.clima.lluvia14, 1)} mm de lluvia, {fmtNumero(p.clima.tmin, 0)} a{' '}
            {fmtNumero(p.clima.tmax, 0)} °C.
            {alertasClima.length > 0 && <strong className="alerta-texto"> Alerta: {alertasClima.join(', ')}.</strong>}
          </p>
        ) : (
          <p className="pequeno texto-suave">{p.climaError ?? 'Consultando el clima…'}</p>
        )}
        {p.fuego && p.fuego.focos7d > 0 && (
          <p className="alerta-texto pequeno">
            {p.fuego.focos7d} foco{p.fuego.focos7d === 1 ? '' : 's'} de calor cerca (últimos 7 días).
          </p>
        )}
      </section>

      <section className="bloque" aria-label="Oferta para compradores">
        {oferta ? (
          <>
            <p className="oferta-activa">
              Oferta: {fmtNumero(oferta.toneladas, 1)} t a {fmtPesos(oferta.precio)} por tonelada.
            </p>
            {oferta.lote ? (
              <p className="pequeno">Lote {oferta.lote.codigo} · con historial de trazabilidad</p>
            ) : (
              <p className="pequeno texto-suave">Sin lote de trazabilidad</p>
            )}
            {oferta.reserva ? (
              <div className="reserva-info">
                <p className="pequeno">
                  Reservada por <strong>{oferta.reserva.comprador}</strong>.
                </p>
                <a
                  className="boton-whatsapp"
                  href={enlaceWhatsapp(oferta.reserva.telefono, mensajeParaComprador(oferta))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Escribir al comprador por WhatsApp
                </a>
                <button type="button" className="enlace" onClick={onLiberarReserva}>
                  Liberar la oferta
                </button>
              </div>
            ) : Math.abs(est.total - oferta.toneladas) >= 0.05 ? (
              <div className="acciones-fila">
                <p className="pequeno">La estimación cambió a {fmtNumero(est.total, 1)} t.</p>
                <button type="button" className="secundario" onClick={onActualizarOferta}>
                  Actualizar oferta
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <form className="fila-precio" onSubmit={publicar} noValidate>
            {lotes.length > 0 && (
              <label className="campo">
                <span>Lote que vendes</span>
                <select value={loteId} onChange={(e) => setLoteId(e.target.value)}>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.codigo} · {l.hortaliza}
                    </option>
                  ))}
                  <option value="">Sin lote (sin historial)</option>
                </select>
              </label>
            )}
            <label className="campo">
              <span>Precio por tonelada (MXN){ref ? ` · referencia SIAP ${fmtPesos(ref.precio)}` : ''}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={10}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
            </label>
            <button type="submit" className="primario">
              Publicar oferta
            </button>
            {error && (
              <p className="campo-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </section>

      <details className="bloque plegable">
        <summary>Datos y manejo</summary>
        <div className="selector-color">
          <input type="color" value={color} onChange={(e) => onCambiarColor(e.target.value)} aria-label="Color de la parcela" />
          <span className="mono pequeno">{color.toUpperCase()}</span>
        </div>
        <EditarDatos parcela={p} onGuardar={onEditarDatos} />
        <ManejoForm parcela={p} onGuardar={onGuardarManejo} />
      </details>

      <footer className="boleta-pie">
        <button type="button" className="enlace" onClick={onActualizar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar clima'}
        </button>
        <button type="button" className="peligro" onClick={onEliminar}>
          Eliminar
        </button>
      </footer>
    </article>
  );
}
