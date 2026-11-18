import { irA } from '../../lib/ruta';
import '../../inicio.css';

/** Beneficios propios (no copiados de otro sitio). Cada icono es un SVG simple dibujado para la app. */
const BENEFICIOS = [
  {
    titulo: 'Detecta riesgos a tiempo',
    texto: 'Alertas de clima y de estrés en tus parcelas, para decidir antes de perder cosecha.',
    icono: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 8 42 40H6Z" />
        <path d="M24 20v9M24 34v.5" />
      </svg>
    ),
  },
  {
    titulo: 'Mira tu campo desde el mapa',
    texto: 'Imagen satelital y vigor de cada parcela, sin salir de la app.',
    icono: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 42V24" />
        <path d="M24 26C24 16 16 12 8 14c0 10 7 14 16 12Z" />
        <path d="M24 22c0-8 6-12 14-10 0 8-5 12-14 10Z" />
      </svg>
    ),
  },
  {
    titulo: 'Documenta cada lote',
    texto: 'Siembra, riegos y cosecha en un historial que el comprador verifica con un código QR.',
    icono: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 10h32v28H8Z" />
        <path d="M14 18h20M14 25h14M14 32h9" />
      </svg>
    ),
  },
];

/** Inicio de Agricultura Inteligente: qué hace la app y accesos a parcelas, lotes y planes. */
export function InicioPagina() {
  return (
    <section className="inicio">
      <header className="inicio-presentacion">
        <p className="eyebrow">Agricultura Inteligente</p>
        <h1>Monitorea tus parcelas y vende con historial verificable</h1>
        <p className="texto-suave">
          Sigue el estado de cada parcela con imágenes satelitales y clima, y registra cada lote desde la siembra hasta la entrega.
        </p>
        <div className="inicio-acciones">
          <button type="button" className="primario" onClick={() => irA('/')}>
            Ir a mis parcelas
          </button>
          <button type="button" className="secundario" onClick={() => irA('/lotes')}>
            Ver lotes
          </button>
          <button type="button" className="secundario" onClick={() => irA('/planes')}>
            Ver planes
          </button>
        </div>
      </header>

      <ul className="inicio-beneficios" aria-label="Beneficios">
        {BENEFICIOS.map((b) => (
          <li key={b.titulo} className="beneficio">
            <span className="beneficio-icono">{b.icono}</span>
            <h2>{b.titulo}</h2>
            <p className="texto-suave">{b.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
