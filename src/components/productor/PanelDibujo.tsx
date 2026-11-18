import { AREA_MINIMA_M2 } from './comun';
import { type Posicion } from '../../lib/tipos';

export function PanelDibujo({
  puntos,
  area,
  indice,
  raton,
  onCambiarRaton,
  mostrarSelector,
  onAnterior,
  onSiguiente,
  onDeshacer,
  onBorrarTodo,
  onCerrar,
  onCancelar,
}: {
  puntos: Posicion[];
  area: number;
  indice: number;
  raton: boolean;
  onCambiarRaton: (v: boolean) => void;
  mostrarSelector: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  onDeshacer: () => void;
  onBorrarTodo: () => void;
  onCerrar: () => void;
  onCancelar: () => void;
}) {
  const listo = puntos.length >= 3 && area >= AREA_MINIMA_M2;
  const pequeno = puntos.length >= 3 && area < AREA_MINIMA_M2;
  return (
    <section className="dibujo">
      <h2>Marca el perímetro</h2>
      <p className="pequeno texto-suave">
        {puntos.length} de 3 esquinas como mínimo
      </p>

      {mostrarSelector && (
        <div className="segmento-claro" role="group" aria-label="Cómo marcar los puntos">
          <button type="button" aria-pressed={raton} className={raton ? 'activo' : ''} onClick={() => onCambiarRaton(true)}>
            Clic en el mapa
          </button>
          <button type="button" aria-pressed={!raton} className={!raton ? 'activo' : ''} onClick={() => onCambiarRaton(false)}>
            Mira central
          </button>
        </div>
      )}

      {pequeno && (
        <p className="campo-error" role="alert">
          Muy pequeño (menos de {AREA_MINIMA_M2} m²). Marca esquinas más separadas.
        </p>
      )}

      <div className="nav-vertices">
        <button type="button" className="secundario" onClick={onAnterior} disabled={indice <= 0}>
          ← Anterior
        </button>
        <span className="mono texto-suave">
          {puntos.length === 0 ? '0 / 0' : `${indice + 1} / ${puntos.length}`}
        </span>
        <button type="button" className="secundario" onClick={onSiguiente} disabled={indice < 0 || indice >= puntos.length - 1}>
          Siguiente →
        </button>
      </div>

      <div className="acciones-fila">
        <button type="button" className="secundario" onClick={onDeshacer} disabled={puntos.length === 0}>
          Deshacer
        </button>
        <button type="button" className="secundario" onClick={onBorrarTodo} disabled={puntos.length === 0}>
          Borrar todo
        </button>
      </div>

      <button type="button" className="primario ancho pie-accion" onClick={onCerrar} disabled={!listo}>
        Guardar parcela
      </button>
      <button type="button" className="enlace" onClick={onCancelar}>
        Cancelar
      </button>
    </section>
  );
}
