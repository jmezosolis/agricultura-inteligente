import { useState } from 'react';
import { LEYENDA_FILTRO, RANGO_INDICE, type Filtro } from '../lib/satelite';

interface Props {
  filtro: Filtro;
}

/** Barra de colores del índice con un deslizador: al moverlo se lee el valor y su significado. */
export function EspectroSlider({ filtro }: Props) {
  const [pos, setPos] = useState(50);
  const leyenda = LEYENDA_FILTRO[filtro];
  const rango = RANGO_INDICE[filtro];
  if (!leyenda || !rango) return null;

  const [min, max] = rango;
  const valor = min + ((max - min) * pos) / 100;
  const nivel = pos < 33 ? leyenda.bajo : pos < 66 ? 'Valor medio' : leyenda.alto;

  return (
    <div className="espectro" aria-label={`Escala de ${filtro}`}>
      <div className="espectro-cabeza">
        <strong>{valor.toFixed(2)}</strong>
        <span className="pequeno texto-suave">{nivel}</span>
      </div>
      <div className="espectro-barra" style={{ background: leyenda.colores }}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Valor de ${filtro}`}
          aria-valuetext={`${valor.toFixed(2)}, ${nivel}`}
        />
      </div>
      <div className="espectro-extremos pequeno texto-suave">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
