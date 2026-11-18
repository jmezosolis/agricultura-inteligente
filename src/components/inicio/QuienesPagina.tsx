import '../../inicio.css';

/** Quiénes somos: qué es Agricultura Inteligente y qué hace cada función, con su estado real. */
export function QuienesPagina() {
  return (
    <section className="inicio">
      <header className="inicio-presentacion">
        <p className="eyebrow">Quiénes somos</p>
        <h1>Una herramienta para el productor de hortalizas y granos de Morelos</h1>
        <p className="texto-suave">
          Agricultura Inteligente reúne en un solo lugar lo que el productor necesita para planear su cosecha, demostrar el origen de lo que
          vende y encontrar a un comprador.
        </p>
      </header>

      <ul className="inicio-beneficios" aria-label="Funciones de la app">
        <li className="beneficio">
          <h2>Parcelas</h2>
          <p className="texto-suave">
            Dibuja tu parcela sobre el mapa y calcula su superficie. Registra el cultivo y la fecha de siembra. La app muestra
            el avance del ciclo, un rango de producción con su método y el clima de la zona.
          </p>
          <p className="pequeno">Funciona</p>
        </li>
        <li className="beneficio">
          <h2>Lotes y trazabilidad</h2>
          <p className="texto-suave">
            Cada lote tiene su código y su historial de riegos, aplicaciones y cosecha. Registra el periodo de carencia de
            cada plaguicida, que bloquea la cosecha hasta cumplirse. El comprador puede verificar el lote con el código QR.
          </p>
          <p className="pequeno">Funciona en este dispositivo</p>
        </li>
        <li className="beneficio">
          <h2>Mercado</h2>
          <p className="texto-suave">
            Publica una oferta con su volumen y precio, ligada a un lote si lo tienes. El comprador ve la zona aproximada del
            predio, nunca la ubicación exacta, y puede reservar.
          </p>
          <p className="pequeno">Funciona en este dispositivo</p>
        </li>
        <li className="beneficio">
          <h2>Dron y cosecha</h2>
          <p className="texto-suave">
            Registra imágenes de dron por parcela y calcula el volumen de cosecha con la superficie, el rendimiento y la pérdida.
          </p>
          <p className="pequeno">El registro funciona; el análisis de las imágenes está pendiente</p>
        </li>
        <li className="beneficio">
          <h2>Detectar enfermedades</h2>
          <p className="texto-suave">
            Toma una foto de la planta afectada y guarda tu observación. Todavía no hay diagnóstico automático.
          </p>
          <p className="pequeno">En desarrollo</p>
        </li>
        <li className="beneficio">
          <h2>Detectar plantas</h2>
          <p className="texto-suave">
            Toma una foto para registrar la planta. Todavía no hay identificación automática de especies.
          </p>
          <p className="pequeno">En desarrollo</p>
        </li>
      </ul>

      <div className="beneficio">
        <h2>Equipo</h2>
        <p className="texto-suave">[Completar: nombres, perfil y rol de cada integrante antes de publicar.]</p>
      </div>
    </section>
  );
}
