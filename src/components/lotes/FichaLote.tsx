import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { TIPOS_EVENTO, type EventoLote, type Lote, type Plaguicida, type TipoEvento } from '../../lib/tipos';
import {
  ETIQUETA_ESTADO_LOTE,
  estadoLote,
  eventosOrdenados,
  fechaLiberacion,
  kgCosechados,
  liberacionLote,
  nuevoEvento,
} from '../../lib/lotes';
import { fmtFecha, fmtNumero, hoyLocal } from '../../lib/formato';
import { EscanerCodigo } from './EscanerCodigo';

interface Props {
  lote: Lote;
  /** Catálogo local de plaguicidas, para llenar los datos al escanear un producto conocido. */
  plaguicidas: Plaguicida[];
  onAgregar: (evento: EventoLote) => void;
  /** Guarda o actualiza un producto en el catálogo. */
  onCatalogar: (producto: Plaguicida) => void;
  onVolver: () => void;
}

/** Tipos que el productor puede registrar después de la siembra. */
const TIPOS_REGISTRABLES: TipoEvento[] = ['riego', 'fertilizante', 'plaguicida', 'cosecha', 'entrega'];

/** Ficha del lote: historial en orden, periodo de carencia, código QR para el comprador y alta de eventos. */
export function FichaLote({ lote, plaguicidas, onAgregar, onCatalogar, onVolver }: Props) {
  const hoy = hoyLocal();
  const [tipo, setTipo] = useState<TipoEvento>('riego');
  const [fecha, setFecha] = useState(hoy);
  const [detalle, setDetalle] = useState('');
  const [kg, setKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  // Datos del plaguicida (los que pide la etiqueta).
  const [gtin, setGtin] = useState('');
  const [producto, setProducto] = useState('');
  const [ingrediente, setIngrediente] = useState('');
  const [registro, setRegistro] = useState('');
  const [dosis, setDosis] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [responsable, setResponsable] = useState('');
  const [dias, setDias] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const urlVerificacion = `${window.location.origin}${window.location.pathname}#/verificar/${lote.codigo}`;
  const estado = estadoLote(lote);
  const historial = eventosOrdenados(lote);
  const carencia = liberacionLote(lote);
  const enCarencia = carencia !== null && carencia.fecha > hoy;

  useEffect(() => {
    let vivo = true;
    QRCode.toDataURL(urlVerificacion, { width: 220, margin: 1 }).then(
      (url) => {
        if (vivo) setQr(url);
      },
      () => {
        if (vivo) setQr(null);
      },
    );
    return () => {
      vivo = false;
    };
  }, [urlVerificacion]);

  /** Llena el formulario con lo que ya se conoce del código de barras, o avisa que el producto es nuevo. */
  const buscarProducto = (codigo: string) => {
    const limpio = codigo.trim();
    setGtin(limpio);
    if (!limpio) {
      setAviso(null);
      return;
    }
    const conocido = plaguicidas.find((p) => p.gtin === limpio);
    if (conocido) {
      setProducto(conocido.producto);
      setIngrediente(conocido.ingrediente);
      setRegistro(conocido.registro);
      setDias(String(conocido.carenciaDias));
      setAviso('Producto reconocido en tu catálogo. Revisa la dosis y la carencia en la etiqueta.');
    } else {
      setAviso('Producto nuevo: completa los datos de la etiqueta. Se guardará en tu catálogo.');
    }
  };

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    if (!fecha) return setError('Escribe la fecha del hecho.');
    if (fecha > hoy) return setError('La fecha no puede ser futura.');
    if (fecha < lote.fechaSiembra) return setError('La fecha es anterior a la siembra.');

    if (tipo === 'cosecha') {
      if (carencia && fecha < carencia.fecha) {
        return setError(`No se puede cosechar antes del ${fmtFecha(carencia.fecha)}: periodo de carencia de ${carencia.producto}.`);
      }
      const n = Number(kg.replace(',', '.'));
      if (!(n > 0)) return setError('Escribe los kilos cosechados.');
      onAgregar(nuevoEvento('cosecha', fecha, detalle.trim() || 'Cosecha', n));
    } else if (tipo === 'plaguicida') {
      const nombre = producto.trim();
      if (!nombre) return setError('Escribe el producto aplicado, tal como aparece en la etiqueta.');
      if (!dosis.trim()) return setError('Escribe la dosis aplicada, por ejemplo "1 L/ha".');
      const d = Number(dias);
      if (!Number.isInteger(d) || d < 0 || d > 365) {
        return setError('Escribe los días de carencia que indica la etiqueta (de 0 a 365).');
      }
      const sup = superficie.trim() ? Number(superficie.replace(',', '.')) : undefined;
      if (sup !== undefined && !(sup > 0)) return setError('La superficie tratada debe ser mayor que cero.');

      const datos = {
        producto: nombre,
        dias: d,
        gtin: gtin.trim() || undefined,
        ingrediente: ingrediente.trim() || undefined,
        registro: registro.trim() || undefined,
        dosis: dosis.trim(),
        superficieHa: sup,
        responsable: responsable.trim() || undefined,
      };
      const etiqueta = `${nombre} · ${datos.dosis} · carencia ${d} ${d === 1 ? 'día' : 'días'}`;
      onAgregar(nuevoEvento('plaguicida', fecha, etiqueta, undefined, datos));
      if (datos.gtin) {
        onCatalogar({
          gtin: datos.gtin,
          producto: nombre,
          ingrediente: datos.ingrediente ?? '',
          registro: datos.registro ?? '',
          carenciaDias: d,
        });
      }
    } else {
      if (!detalle.trim()) return setError('Describe el hecho: producto, dosis o comprador.');
      onAgregar(nuevoEvento(tipo, fecha, detalle.trim()));
    }
    setError(null);
    setAviso(null);
    setDetalle('');
    setKg('');
    setGtin('');
    setProducto('');
    setIngrediente('');
    setRegistro('');
    setDosis('');
    setSuperficie('');
    setResponsable('');
    setDias('');
  };

  return (
    <section className="lote-ficha-detalle">
      <button type="button" className="enlace" onClick={onVolver}>
        Volver a lotes
      </button>

      <header className="lote-encabezado">
        <div>
          <p className="eyebrow">{lote.codigo}</p>
          <h1>
            {lote.hortaliza}
            {lote.variedad ? ` · ${lote.variedad}` : ''}
          </h1>
          <p className="texto-suave">
            {lote.parcelaNombre} · Siembra {fmtFecha(lote.fechaSiembra)} · {ETIQUETA_ESTADO_LOTE[estado]}
            {kgCosechados(lote) > 0 ? ` · ${fmtNumero(kgCosechados(lote), 0)} kg` : ''}
          </p>
          {carencia && (
            <p className={`carencia-aviso ${enCarencia ? 'vigente' : 'cumplida'}`}>
              {enCarencia
                ? `Carencia vigente de ${carencia.producto}: cosecha permitida desde el ${fmtFecha(carencia.fecha)}.`
                : `Carencia de ${carencia.producto} cumplida. Cosecha permitida.`}
            </p>
          )}
        </div>
      </header>

      <div className="lote-grid">
        <section className="lote-qr" aria-label="Código para el comprador">
          {qr ? <img src={qr} alt={`Código QR del lote ${lote.codigo}`} width={220} height={220} /> : <p>Generando código…</p>}
          <p className="pequeno texto-suave">
            El comprador escanea este código para ver el historial del lote. Por ahora la verificación funciona en este mismo
            navegador; cuando haya servidor será pública.
          </p>
          <a className="enlace pequeno" href={urlVerificacion}>
            Abrir página de verificación
          </a>
        </section>

        <section className="lote-historial" aria-label="Historial del lote">
          <h2>Historial</h2>
          <ol className="linea-tiempo">
            {historial.map((e) => {
              const libre = fechaLiberacion(e);
              return (
                <li key={e.id} className={`evento ${e.tipo}`}>
                  <span className="evento-punto" aria-hidden="true" />
                  <div>
                    <strong>
                      {TIPOS_EVENTO[e.tipo]}
                      {e.kg ? ` · ${fmtNumero(e.kg, 0)} kg` : ''}
                    </strong>
                    <span className="pequeno texto-suave">
                      {fmtFecha(e.fecha)} · {e.detalle}
                    </span>
                    {libre && <span className="pequeno carencia-linea">Libre para cosecha desde el {fmtFecha(libre)}</span>}
                  </div>
                </li>
              );
            })}
          </ol>

          {estado !== 'entregado' && (
            <form className="evento-formulario" onSubmit={agregar} noValidate>
              <h3>Registrar un hecho</h3>
              <div className="fila-dos">
                <label className="campo">
                  <span>Qué pasó</span>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}>
                    {TIPOS_REGISTRABLES.map((t) => (
                      <option key={t} value={t}>
                        {TIPOS_EVENTO[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Fecha</span>
                  <input type="date" value={fecha} min={lote.fechaSiembra} max={hoy} onChange={(e) => setFecha(e.target.value)} />
                </label>
              </div>

              {tipo === 'plaguicida' && (
                <div className="bloque-plaguicida">
                  <label className="campo">
                    <span>Código de barras del envase</span>
                    <div className="fila-codigo">
                      <input
                        inputMode="numeric"
                        value={gtin}
                        onChange={(e) => setGtin(e.target.value)}
                        onBlur={(e) => buscarProducto(e.target.value)}
                        placeholder="Escanea o escribe el código"
                      />
                      <button type="button" className="secundario" onClick={() => setEscaneando(true)}>
                        Escanear
                      </button>
                    </div>
                  </label>

                  {escaneando && (
                    <EscanerCodigo
                      onDetectado={(codigo) => {
                        setEscaneando(false);
                        buscarProducto(codigo);
                      }}
                      onCerrar={() => setEscaneando(false)}
                    />
                  )}

                  {aviso && <p className="pequeno texto-suave">{aviso}</p>}

                  <div className="fila-dos">
                    <label className="campo">
                      <span>Producto comercial</span>
                      <input value={producto} onChange={(e) => setProducto(e.target.value)} maxLength={80} placeholder="Como aparece en la etiqueta" />
                    </label>
                    <label className="campo">
                      <span>Ingrediente activo</span>
                      <input value={ingrediente} onChange={(e) => setIngrediente(e.target.value)} maxLength={80} />
                    </label>
                  </div>

                  <div className="fila-dos">
                    <label className="campo">
                      <span>Registro COFEPRIS</span>
                      <input value={registro} onChange={(e) => setRegistro(e.target.value)} maxLength={40} placeholder="Número de la etiqueta" />
                    </label>
                    <label className="campo">
                      <span>Dosis aplicada</span>
                      <input value={dosis} onChange={(e) => setDosis(e.target.value)} maxLength={40} placeholder="Ej. 1 L/ha" />
                    </label>
                  </div>

                  <div className="fila-dos">
                    <label className="campo">
                      <span>Superficie tratada (ha)</span>
                      <input inputMode="decimal" value={superficie} onChange={(e) => setSuperficie(e.target.value)} placeholder="Opcional" />
                    </label>
                    <label className="campo">
                      <span>Quién aplicó</span>
                      <input value={responsable} onChange={(e) => setResponsable(e.target.value)} maxLength={80} placeholder="Opcional" />
                    </label>
                  </div>

                  <label className="campo">
                    <span>Días de periodo de carencia</span>
                    <input inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} placeholder="Según la etiqueta del producto" />
                  </label>
                  <p className="pequeno texto-suave">
                    El periodo de carencia es el tiempo que debe pasar entre la aplicación y la cosecha. Tómalo de la etiqueta.
                  </p>
                </div>
              )}

              {tipo === 'cosecha' && (
                <>
                  {enCarencia && carencia && (
                    <p className="carencia-aviso vigente">
                      La cosecha no se puede registrar antes del {fmtFecha(carencia.fecha)}.
                    </p>
                  )}
                  <label className="campo">
                    <span>Kilos cosechados</span>
                    <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="Ej. 850" />
                  </label>
                </>
              )}

              {tipo !== 'plaguicida' && (
                <label className="campo">
                  <span>{tipo === 'entrega' ? 'Comprador y kilos entregados' : 'Producto, dosis o detalle'}</span>
                  <input value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={160} />
                </label>
              )}

              {error && (
                <p className="campo-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="primario">
                Guardar en el historial
              </button>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}
