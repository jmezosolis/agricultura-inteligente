import { useState } from 'react';
import '../../planes.css';

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  periodo: string;
  incluye: string[];
  destacado?: boolean;
}

/** Maqueta: los precios no están definidos y ningún plan cobra. Las funciones son propuestas. */
const PLANES: Plan[] = [
  {
    id: 'prueba',
    nombre: 'Prueba',
    descripcion: 'Conoce la app con una parcela antes de decidir.',
    precio: 'Gratis',
    periodo: 'sin tarjeta',
    incluye: ['1 parcela', '1 lote de trazabilidad', 'Mapa satelital y clima', 'Sin verificación pública para compradores'],
  },
  {
    id: 'campo',
    nombre: 'Campo',
    descripcion: 'Para productores con varias parcelas que venden con historial.',
    precio: 'Por definir',
    periodo: 'al mes',
    incluye: [
      'Hasta 10 hectáreas',
      'Hasta 4 lotes',
      'Verificación pública con código QR',
      'Exportar historial de lotes',
      'Índices satelitales completos',
    ],
    destacado: true,
  },
  {
    id: 'cooperativa',
    nombre: 'Cooperativa',
    descripcion: 'Para grupos de productores que venden juntos a compradores.',
    precio: 'Por definir',
    periodo: 'al mes',
    incluye: ['Hasta 50 hectáreas', 'Lotes ilimitados', 'Varios usuarios en un mismo grupo', 'Panel de cosechas del grupo'],
  },
];

const COMUN = ['Registro de parcelas y lotes', 'Clima de la zona', 'Historial de cada lote'];

/** Página de planes: maqueta para la propuesta. No cobra ni registra suscripciones. */
export function PlanesPagina() {
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <section className="planes">
      <header className="planes-cabecera">
        <p className="eyebrow">Planes</p>
        <h1>Planes para el tamaño de tu campo</h1>
        <p className="texto-suave">Elige según cuántas hectáreas trabajas y cuántos lotes quieres dar seguimiento.</p>
        <span className="planes-maqueta">Maqueta · sin cobro</span>
      </header>

      <div className="planes-comun" aria-label="Incluido en todos los planes">
        <strong>Incluido en todos los planes:</strong>
        <ul>
          {COMUN.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <ul className="planes-tarjetas">
        {PLANES.map((p) => (
          <li key={p.id} className={`plan-tarjeta${p.destacado ? ' destacado' : ''}`}>
            {p.destacado && <span className="plan-etiqueta">Más popular</span>}
            <h2>{p.nombre}</h2>
            <p className="texto-suave">{p.descripcion}</p>
            <p className="plan-precio">
              <strong>{p.precio}</strong>
              <span>{p.periodo}</span>
            </p>
            <ul className="plan-incluye">
              {p.incluye.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <button
              type="button"
              className={p.destacado ? 'primario ancho' : 'secundario ancho'}
              onClick={() => setAviso(`Maqueta: el plan ${p.nombre} no cobra ni activa nada todavía.`)}
            >
              Elegir {p.nombre}
            </button>
          </li>
        ))}
      </ul>

      {aviso && (
        <p className="planes-aviso" role="status">
          {aviso}
        </p>
      )}
      <p className="pequeno texto-suave">
        Los precios y las funciones son propuestas para validar. Ningún pago se procesa en esta maqueta.
      </p>
    </section>
  );
}
