import { CULTIVOS, type EstadoParcela, type Oferta, type Parcela } from '../../lib/tipos';
import {
  cosechaEstimadaFecha,
  cosechaVencida,
  diasParaCosecha,
  estadoParcela,
  estimar,
} from '../../lib/modelo';
import { fmtFecha, fmtNumero } from '../../lib/formato';
import { ETIQUETA_ESTADO } from '../etiquetas';
import '../../fichas.css';

interface Props {
  parcelas: Parcela[];
  ofertas: Oferta[];
  seleccionada?: string | null;
  onElegir: (id: string) => void;
}

const DIA_MS = 86_400_000;

/** Avance del ciclo: porcentaje, texto de estado y fechas de siembra y cosecha estimada. */
function avanceCultivo(p: Parcela): { pct: number; texto: string; inicio: string; fin: string } | null {
  if (!p.siembra) return null;
  const inicio = new Date(`${p.siembra}T00:00:00`).getTime();
  const ciclo = CULTIVOS[p.cultivo].cicloDias * DIA_MS;
  const pct = Math.min(100, Math.max(0, ((Date.now() - inicio) / ciclo) * 100));
  const dias = diasParaCosecha(p) ?? 0;
  const texto = cosechaVencida(p)
    ? 'Cosecha vencida'
    : dias > 0
      ? `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`
      : 'Lista para cosechar';
  return { pct, texto, inicio: fmtFecha(p.siembra), fin: fmtFecha(cosechaEstimadaFecha(p) ?? p.siembra) };
}

/** Aviso principal de la parcela: el más urgente que aplique. Umbrales orientativos, no validados. */
function avisoParcela(p: Parcela): { texto: string; tono: 'alerta' | 'info' } | null {
  if (cosechaVencida(p)) return { texto: 'Registra la cosecha real para mejorar la estimación', tono: 'alerta' };
  if (p.clima && p.clima.tmax >= 35) return { texto: 'Temperaturas máximas altas previstas', tono: 'alerta' };
  if (p.clima && p.clima.lluvia14 < 5) return { texto: 'Poca lluvia prevista en los próximos 14 días', tono: 'info' };
  if (p.climaError) return { texto: 'Clima no disponible por ahora', tono: 'info' };
  return null;
}

/** Tarjetas de parcela: nombre, avance del ciclo, aviso, clima y acción principal. */
export function ListaParcelas({ parcelas, ofertas, seleccionada, onElegir }: Props) {
  return (
    <ul className="fichas-parcela">
      {parcelas.map((p) => {
        const est = estimar(p);
        const estado: EstadoParcela = estadoParcela(p);
        const ofertada = ofertas.some((o) => o.parcelaId === p.id && o.estado === 'abierta');
        const avance = avanceCultivo(p);
        const aviso = avisoParcela(p);
        const activa = seleccionada === p.id;
        return (
          <li key={p.id} className={`ficha-parcela ${estado}${activa ? ' activa' : ''}`}>
            <div className="ficha-parcela-cabeza">
              <div className="grow">
                <h2>{p.nombre}</h2>
                <p className="texto-suave">
                  {CULTIVOS[p.cultivo].nombre} · {fmtNumero(p.hectareas, 2)} ha · {fmtNumero(est.total)} t estimadas
                  {CULTIVOS[p.cultivo].calibrado ? '' : ' (supuesto)'}
                </p>
              </div>
              <span className={`chip-estado ${estado}`}>{ETIQUETA_ESTADO[estado]}</span>
            </div>

            {avance && (
              <div className="ciclo" aria-label={`${avance.texto}, ${Math.round(avance.pct)} % del ciclo`}>
                <div className="ciclo-titulo">
                  <span>Ciclo del cultivo</span>
                  <strong>{Math.round(avance.pct)}% completado</strong>
                </div>
                <div className="ciclo-barra">
                  <span style={{ width: `${avance.pct}%` }} />
                </div>
                <div className="ciclo-fechas">
                  <span>Siembra {avance.inicio}</span>
                  <span>{avance.texto}</span>
                  <span>Cosecha {avance.fin}</span>
                </div>
              </div>
            )}

            {aviso && (
              <p className={`aviso-parcela ${aviso.tono}`} role="note">
                {aviso.texto}
              </p>
            )}

            {p.clima ? (
              <div className="clima-tiles" aria-label="Clima de la zona">
                <div>
                  <small>Mínima</small>
                  <strong>{fmtNumero(p.clima.tmin, 0)} °C</strong>
                </div>
                <div>
                  <small>Máxima</small>
                  <strong>{fmtNumero(p.clima.tmax, 0)} °C</strong>
                </div>
                <div>
                  <small>Lluvia 14 días</small>
                  <strong>{fmtNumero(p.clima.lluvia14, 0)} mm</strong>
                </div>
              </div>
            ) : (
              <p className="texto-suave pequeno">{p.climaError ? 'Clima no disponible' : 'Consultando el clima…'}</p>
            )}

            <div className="ficha-parcela-acciones">
              {ofertada && <span className="chip-ok">Ofertada</span>}
              <button
                type="button"
                className="primario ancho"
                onClick={() => onElegir(p.id)}
                aria-current={activa ? 'true' : undefined}
              >
                {activa ? 'Parcela abierta' : 'Ver parcela'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
