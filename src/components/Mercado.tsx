import { useMemo, useState, type FormEvent } from 'react';
import { CULTIVOS, type Cultivo, type Oferta } from '../lib/tipos';
import { fmtFecha, fmtNumero, fmtPesos } from '../lib/formato';
import { compararPrecio, referenciaPrecio } from '../lib/precios';
import { textoZona } from '../lib/privacidad';
import { enlaceWhatsapp, numeroWhatsapp } from '../lib/whatsapp';
import { PrecioBadge } from './mercado/PrecioBadge';

interface Props {
  ofertas: Oferta[];
  onReservar: (ofertaId: string, comprador: string, telefono: string) => void;
}

type Orden = 'reciente' | 'precio' | 'volumen' | 'cosecha';

const ETIQUETA_ORDEN: Record<Orden, string> = {
  reciente: 'Más recientes',
  precio: 'Mayor precio',
  volumen: 'Mayor volumen',
  cosecha: 'Cosecha más próxima',
};

/** Mensaje inicial de WhatsApp hacia el productor. */
function mensajeParaProductor(o: Oferta, comprador: string): string {
  return `Hola, soy ${comprador}. Me interesa la oferta de ${fmtNumero(o.toneladas, 1)} t de ${CULTIVOS[o.cultivo].nombre} de "${o.parcelaNombre}" a ${fmtPesos(o.precio)} por tonelada. ¿Coordinamos?`;
}

/** Mercado: ofertas disponibles, reserva con WhatsApp y chat directo con el productor. */
export function Mercado({ ofertas, onReservar }: Props) {
  const [cultivo, setCultivo] = useState<Cultivo | 'todos'>('todos');
  const [orden, setOrden] = useState<Orden>('reciente');
  const [soloMercado, setSoloMercado] = useState(false);
  const [soloConLote, setSoloConLote] = useState(false);
  const [reservando, setReservando] = useState<string | null>(null);
  const ref = referenciaPrecio('maiz');

  const disponibles = useMemo(() => {
    const filtradas = ofertas.filter(
      (o) =>
        o.estado === 'abierta' &&
        (cultivo === 'todos' || o.cultivo === cultivo) &&
        (!soloMercado || compararPrecio(o.cultivo, o.precio).posicion === 'dentro') &&
        (!soloConLote || !!o.lote),
    );
    const cmp: Record<Orden, (a: Oferta, b: Oferta) => number> = {
      reciente: (a, b) => b.publicada.localeCompare(a.publicada),
      precio: (a, b) => b.precio - a.precio,
      volumen: (a, b) => b.toneladas - a.toneladas,
      cosecha: (a, b) => (a.cosechaEstimada ?? '9999').localeCompare(b.cosechaEstimada ?? '9999'),
    };
    return [...filtradas].sort(cmp[orden]);
  }, [ofertas, cultivo, orden, soloMercado, soloConLote]);

  const reservadas = ofertas.filter((o) => o.estado === 'reservada');

  return (
    <div className="mercado">
      <section className="columna" aria-labelledby="ofertas-titulo">
        <div className="cabecera-panel">
          <div>
            <p className="eyebrow">Compra directa</p>
            <h2 id="ofertas-titulo">Ofertas disponibles</h2>
          </div>
        </div>

        {ref && (
          <div className="referencia" role="note">
            <span className="etiqueta-mini">Precio de referencia · maíz</span>
            <strong className="mono">{fmtPesos(ref.precio)} por t</strong>
            <span className="pequeno texto-suave">SIAP Morelos, {ref.ano}. Ofertas dentro de ±10 % son precio de mercado.</span>
          </div>
        )}

        <div className="fila-dos filtros">
          <label className="campo">
            <span>Cultivo</span>
            <select value={cultivo} onChange={(e) => setCultivo(e.target.value as Cultivo | 'todos')}>
              <option value="todos">Todos</option>
              {(Object.keys(CULTIVOS) as Cultivo[]).map((c) => (
                <option key={c} value={c}>
                  {CULTIVOS[c].nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Ordenar por</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
              {(Object.keys(ETIQUETA_ORDEN) as Orden[]).map((o) => (
                <option key={o} value={o}>
                  {ETIQUETA_ORDEN[o]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="casilla">
          <input type="checkbox" checked={soloMercado} onChange={(e) => setSoloMercado(e.target.checked)} />
          <span>Solo precios de mercado</span>
        </label>
        <label className="casilla">
          <input type="checkbox" checked={soloConLote} onChange={(e) => setSoloConLote(e.target.checked)} />
          <span>Solo con historial de lote</span>
        </label>

        {disponibles.length === 0 ? (
          <p className="vacio-linea">
            {ofertas.some((o) => o.estado === 'abierta')
              ? 'Ninguna oferta coincide con el filtro.'
              : 'Aún no hay ofertas disponibles. Cuando un productor publique una, aparecerá aquí.'}
          </p>
        ) : (
          <ul className="tarjetas">
            {disponibles.map((o) => (
              <TarjetaOferta
                key={o.id}
                oferta={o}
                reservando={reservando === o.id}
                onIniciar={() => setReservando(o.id)}
                onCancelar={() => setReservando(null)}
                onReservar={(nombre, telefono) => {
                  onReservar(o.id, nombre, telefono);
                  setReservando(null);
                }}
              />
            ))}
          </ul>
        )}

        {reservadas.length > 0 && (
          <>
            <h3 className="subtitulo">Ya reservadas</h3>
            <ul className="tarjetas">
              {reservadas.map((o) => (
                <li key={o.id} className="tarjeta-oferta">
                  <div className="oferta-cuerpo">
                    <h3>{o.parcelaNombre}</h3>
                    <p className="pequeno">
                      {fmtNumero(o.toneladas, 1)} t · {fmtPesos(o.precio)} por tonelada
                    </p>
                  </div>
                  <span className="estado">Reservada</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function TarjetaOferta({
  oferta: o,
  reservando,
  onIniciar,
  onCancelar,
  onReservar,
}: {
  oferta: Oferta;
  reservando: boolean;
  onIniciar: () => void;
  onCancelar: () => void;
  onReservar: (nombre: string, telefono: string) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const vencida = !!o.cosechaEstimada && new Date(o.cosechaEstimada + 'T23:59:59').getTime() < Date.now();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escribe tu nombre o el de tu empresa.');
    const tel = numeroWhatsapp(telefono);
    if (!tel) return setError('Escribe tu WhatsApp de 10 dígitos, con lada.');
    setError(null);
    onReservar(nombre.trim(), tel);
  };

  return (
    <li className="tarjeta-oferta">
      <div className="oferta-cuerpo">
        <p className="eyebrow">
          {CULTIVOS[o.cultivo].nombre} · {o.riego ? 'riego' : 'temporal'}
          {o.variedad ? ` · ${o.variedad}` : ''}
        </p>
        <h3>{o.parcelaNombre}</h3>
        <p className="mono">
          {fmtNumero(o.toneladas, 1)} t <span className="texto-suave">(entre {fmtNumero(o.rangoT[0])} y {fmtNumero(o.rangoT[1])})</span>
          {CULTIVOS[o.cultivo].calibrado ? '' : <span className="pequeno texto-suave"> · supuesto sin calibrar</span>}
          {' · '}
          {fmtPesos(o.precio)} por t
        </p>
        <p className="pequeno texto-suave">
          Cosecha {o.cosechaEstimada ? fmtFecha(o.cosechaEstimada) : 'sin fecha'} · {textoZona(o.centro)}
        </p>
        {o.lote ? (
          <p className="pequeno">
            Lote <span className="mono">{o.lote.codigo}</span> · historial registrado
          </p>
        ) : (
          <p className="pequeno texto-suave">Sin historial de lote</p>
        )}
        <PrecioBadge cultivo={o.cultivo} precio={o.precio} />
        {vencida && (
          <p className="alerta-texto pequeno">La fecha estimada de cosecha ya pasó. Confirma el volumen con el productor.</p>
        )}
      </div>

      {reservando ? (
        <form className="formulario-partes reserva" onSubmit={enviar} noValidate>
          <label className="campo">
            <span>Tu nombre o empresa</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoFocus />
          </label>
          <label className="campo">
            <span>Tu WhatsApp</span>
            <input type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={16} placeholder="7771234567" />
          </label>
          {error && (
            <p className="campo-error" role="alert">
              {error}
            </p>
          )}
          <div className="acciones-fila">
            <button type="submit" className="primario">
              Reservar
            </button>
            <button type="button" className="enlace" onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="primario" onClick={onIniciar}>
          Me interesa
        </button>
      )}

      {o.telefonoProductor && (
        <a
          className="enlace pequeno"
          href={enlaceWhatsapp(o.telefonoProductor, mensajeParaProductor(o, 'un comprador interesado'))}
          target="_blank"
          rel="noreferrer"
        >
          Escribir al productor por WhatsApp
        </a>
      )}
    </li>
  );
}
