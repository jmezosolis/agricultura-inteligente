import { ETIQUETA_FILTRO, FILTROS, type Filtro } from '../lib/satelite';

interface Props {
  valor: Filtro;
  onCambiar: (f: Filtro) => void;
}

/**
 * Barra deslizadora que recorre los mapas del satélite: color real, NDVI, NDMI, GNDVI, NDRE, EVI, NDWI y falso color.
 * Al deslizarla cambia el mapa; la imagen nueva se desvanece sobre la anterior.
 */
export function FiltrosSatelite({ valor, onCambiar }: Props) {
  const indice = Math.max(0, FILTROS.indexOf(valor));
  const ultimo = FILTROS.length - 1;

  return (
    <div className="selector-mapas">
      <div className="selector-mapas-cabeza">
        <strong>{ETIQUETA_FILTRO[valor]}</strong>
        <span className="pequeno texto-suave">
          {indice + 1} de {FILTROS.length}
        </span>
      </div>
      <div className="selector-mapas-pista">
        <input
          type="range"
          min={0}
          max={ultimo}
          step={1}
          value={indice}
          onChange={(e) => onCambiar(FILTROS[Number(e.target.value)])}
          aria-label="Mapa a mostrar"
          aria-valuetext={ETIQUETA_FILTRO[valor]}
        />
        <div className="selector-mapas-marcas" aria-hidden="true">
          {FILTROS.map((f, i) => (
            <span
              key={f}
              className={i <= indice ? 'activa' : ''}
              style={{ left: `${(i / ultimo) * 100}%` }}
              title={ETIQUETA_FILTRO[f]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
