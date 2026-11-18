import { useEffect, useState } from 'react';
import type { Parcela, Posicion } from '../lib/tipos';
import { ETIQUETA_FILTRO, type Filtro } from '../lib/satelite';
import { cajaDe, imagenPotrero } from '../lib/satelite-cliente';
import { FiltrosSatelite } from './FiltrosSatelite';
import { EspectroSlider } from './EspectroSlider';

/** Imagen satelital del área de la parcela (Esri), sin servidor. Es la misma base que el mapa. */
function urlImagenArea(anillo: Posicion[]): string {
  const [minLon, minLat, maxLon, maxLat] = cajaDe(anillo);
  const lat = (minLat + maxLat) / 2;
  // Relación de aspecto corregida por la latitud, para que la imagen no se deforme.
  const ancho = 900;
  const alto = Math.round(Math.min(700, Math.max(240, ancho * ((maxLat - minLat) / ((maxLon - minLon) * Math.cos((lat * Math.PI) / 180))))));
  const bbox = [minLon, minLat, maxLon, maxLat].join(',');
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${ancho},${alto}&format=jpg&f=image`;
}

/** Filtros visuales: solo cambian el aspecto de la foto. No indican vigor ni datos de la planta. */
const PRESETS_VISUALES = {
  natural: { etiqueta: 'Natural', filtro: 'none' },
  contraste: { etiqueta: 'Contraste', filtro: 'contrast(1.3) saturate(1.1)' },
  falso: { etiqueta: 'Falso color (visual)', filtro: 'saturate(2) hue-rotate(-35deg) contrast(1.2)' },
} as const;
type Preset = keyof typeof PRESETS_VISUALES;

/**
 * Salud del cultivo. Con el servidor de Copernicus activo, muestra los índices reales (lógica de Ganader AI).
 * Sin servidor, muestra la imagen satelital del área con filtros visuales, sin datos de vigor.
 */
export function SaludCultivo({ parcela }: { parcela: Parcela }) {
  const [filtro, setFiltro] = useState<Filtro>('natural');
  const [preset, setPreset] = useState<Preset>('natural');
  const [url, setUrl] = useState<string | null>(null);
  const [sinServidor, setSinServidor] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setSinServidor(false);
    imagenPotrero(parcela.anillo, filtro)
      .then((u) => {
        if (!vigente) return;
        setUrl(u);
      })
      .catch(() => {
        if (!vigente) return;
        setUrl(urlImagenArea(parcela.anillo));
        setSinServidor(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // Se pide la imagen al cambiar la parcela o el filtro.
  }, [parcela.id, parcela.anillo, filtro]);

  const visual = sinServidor;
  const estiloImagen = visual ? { filter: PRESETS_VISUALES[preset].filtro } : undefined;

  return (
    <section className="bloque" aria-label="Salud del cultivo">
      <p className="eyebrow">Salud del cultivo · {visual ? PRESETS_VISUALES[preset].etiqueta : ETIQUETA_FILTRO[filtro]}</p>

      {visual ? (
        <div className="salud-presets" role="group" aria-label="Filtros visuales">
          {(Object.keys(PRESETS_VISUALES) as Preset[]).map((p) => (
            <button key={p} type="button" className={preset === p ? 'activo' : ''} aria-pressed={preset === p} onClick={() => setPreset(p)}>
              {PRESETS_VISUALES[p].etiqueta}
            </button>
          ))}
        </div>
      ) : (
        <>
          <FiltrosSatelite valor={filtro} onCambiar={setFiltro} />
          {filtro !== 'natural' && <EspectroSlider key={filtro} filtro={filtro} />}
        </>
      )}

      {cargando && <p className="pequeno texto-suave">Cargando la imagen…</p>}
      {visual && (
        <p className="pequeno texto-suave" role="note">
          Vista visual de la imagen satelital del área, sin servidor de Copernicus. Los filtros solo cambian el aspecto: no
          muestran el vigor real de la planta.
        </p>
      )}
      {url && !cargando && (
        <img
          className="salud-imagen"
          src={url}
          style={estiloImagen}
          alt={`Imagen satelital de ${parcela.nombre}${visual ? ', vista visual' : `, ${ETIQUETA_FILTRO[filtro]}`}`}
        />
      )}
    </section>
  );
}
