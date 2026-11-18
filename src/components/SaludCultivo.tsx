import { useEffect, useState } from 'react';
import type { Parcela } from '../lib/tipos';
import { ETIQUETA_FILTRO, type Filtro } from '../lib/satelite';
import { imagenPotrero } from '../lib/satelite-cliente';
import { FiltrosSatelite } from './FiltrosSatelite';
import { EspectroSlider } from './EspectroSlider';

/**
 * Salud del cultivo, con la misma lógica de Ganader AI: filtros de imagen satelital y escala del índice.
 * La imagen sale del servidor de Copernicus; sin servidor se muestra el aviso.
 */
export function SaludCultivo({ parcela }: { parcela: Parcela }) {
  const [filtro, setFiltro] = useState<Filtro>('natural');
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    imagenPotrero(parcela.anillo, filtro)
      .then((u) => {
        if (vigente) setUrl(u);
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        setUrl(null);
        setError(e instanceof Error ? e.message : 'No pudimos obtener la imagen satelital.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // Se pide la imagen al cambiar la parcela o el filtro.
  }, [parcela.id, parcela.anillo, filtro]);

  return (
    <section className="bloque" aria-label="Salud del cultivo">
      <p className="eyebrow">Salud del cultivo · {ETIQUETA_FILTRO[filtro]}</p>
      <FiltrosSatelite valor={filtro} onCambiar={setFiltro} />
      {filtro !== 'natural' && <EspectroSlider key={filtro} filtro={filtro} />}
      {cargando && <p className="pequeno texto-suave">Cargando la imagen satelital…</p>}
      {error && (
        <p className="pequeno" role="alert">
          {error} La imagen satelital solo se muestra cuando el servidor de Copernicus está activo.
        </p>
      )}
      {url && !cargando && <img className="salud-imagen" src={url} alt={`Imagen satelital de ${parcela.nombre}, ${ETIQUETA_FILTRO[filtro]}`} />}
    </section>
  );
}
