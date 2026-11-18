import { useState } from 'react';
import { CULTIVOS, type Cultivo, type NuevaParcela } from '../../lib/tipos';
import { hectareas } from '../../lib/modelo';
import { fmtNumero, fmtSuperficie } from '../../lib/formato';
import { type PoligonoImportado } from '../../lib/importar';

export function PanelImportar({
  poligonos,
  onImportar,
  onCancelar,
}: {
  poligonos: PoligonoImportado[];
  onImportar: (datos: NuevaParcela[]) => void;
  onCancelar: () => void;
}) {
  const [cultivo, setCultivo] = useState<Cultivo>('maiz');
  const [marcados, setMarcados] = useState<boolean[]>(() => poligonos.map(() => true));

  const seleccionados = poligonos.filter((_, i) => marcados[i]);
  const totalHa = seleccionados.reduce((s, p) => s + hectareas(p.anillo), 0);

  const importar = () => {
    onImportar(
      seleccionados.map((p) => ({
        nombre: p.nombre,
        cultivo,
        siembra: null,
        ndvi: null,
        anillo: p.anillo,
      })),
    );
  };

  return (
    <section>
      <p className="eyebrow">Importar archivo</p>
      <h2>{poligonos.length} polígono{poligonos.length === 1 ? '' : 's'} encontrado{poligonos.length === 1 ? '' : 's'}</h2>
      <p className="texto-suave">
        Elige cuáles importar y el cultivo para todas. Después puedes cambiar cada parcela.
      </p>

      <label className="campo">
        <span>Cultivo</span>
        <select value={cultivo} onChange={(e) => setCultivo(e.target.value as Cultivo)}>
          {(Object.keys(CULTIVOS) as Cultivo[]).map((c) => (
            <option key={c} value={c}>
              {CULTIVOS[c].nombre}
            </option>
          ))}
        </select>
      </label>

      <ul className="lista-importar">
        {poligonos.map((p, i) => (
          <li key={i}>
            <label>
              <input
                type="checkbox"
                checked={marcados[i]}
                onChange={(e) => setMarcados((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span className="fila-texto">
                <strong>{p.nombre}</strong>
                <span className="texto-suave mono">
                  {fmtSuperficie(hectareas(p.anillo) * 10_000)} · {p.anillo.length} vértices
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="acciones-columna pie-accion">
        <button type="button" className="primario ancho" onClick={importar} disabled={seleccionados.length === 0}>
          Importar {seleccionados.length} parcela{seleccionados.length === 1 ? '' : 's'} · {fmtNumero(totalHa, 1)} ha
        </button>
        <button type="button" className="enlace" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
