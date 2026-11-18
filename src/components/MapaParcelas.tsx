import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { type Parcela, type Posicion } from '../lib/tipos';
import { colorParcela } from '../lib/modelo';
import { type Filtro } from '../lib/satelite';
import { cajaDe, imagenPotrero } from '../lib/satelite-cliente';
import { FiltrosSatelite } from './FiltrosSatelite';
import { EspectroSlider } from './EspectroSlider';

// Vite no emite el worker de MapLibre por defecto; se indica su URL explícitamente.
maplibregl.setWorkerUrl(mapWorkerUrl);

// Foto satelital de Esri de alta resolución: el mapa de fondo, igual que en Ganader AI.
const ESTILO: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satelite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Imágenes: © Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'satelite', type: 'raster', source: 'satelite' }],
};

/** Color por estado, igual que colorEstadoPotrero en potreoGPS: verde en cultivo, azul sin sembrar, ámbar lista. */
export const COLOR_ESTADO = {
  'en-cultivo': '#0F2A4A',
  'sin-sembrar': '#5E7593',
  lista: '#2F6DB5',
} as const;

const VACIO: FeatureCollection = { type: 'FeatureCollection', features: [] };

type Caja = [number, number, number, number];

/** Quita una capa y su fuente del mapa, si existen. */
function quitarCapa(m: maplibregl.Map, id: string) {
  if (m.getLayer(id)) m.removeLayer(id);
  if (m.getSource(id)) m.removeSource(id);
}

/**
 * Muestra la imagen satelital de la parcela encima de la anterior y la desvanece en 350 ms.
 * Así cambiar de mapa se ve fluido, sin parpadeo. Devuelve el id de la capa actual.
 */
function aplicarImagen(m: maplibregl.Map, imagen: { url: string; bbox: Caja } | null, previa: string | null): string | null {
  if (!imagen) {
    if (previa) quitarCapa(m, previa);
    return null;
  }
  const id = `imagen-${Date.now()}`;
  const [minLon, minLat, maxLon, maxLat] = imagen.bbox;
  m.addSource(id, {
    type: 'image',
    url: imagen.url,
    coordinates: [
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat],
    ],
  });
  m.addLayer({ id, type: 'raster', source: id, paint: { 'raster-opacity': 0 } }, 'parcelas-relleno');
  const inicio = performance.now();
  const paso = () => {
    if (!m.getLayer(id)) return;
    const t = Math.min(1, (performance.now() - inicio) / 350);
    m.setPaintProperty(id, 'raster-opacity', t);
    if (t < 1) requestAnimationFrame(paso);
    else if (previa && previa !== id) quitarCapa(m, previa);
  };
  requestAnimationFrame(paso);
  return id;
}

interface Props {
  parcelas: Parcela[];
  seleccionada: string | null;
  dibujando: boolean;
  puntos: Posicion[];
  indiceSeleccionado: number;
  /** Cambia cada vez que hay que centrar el mapa en un vértice. */
  enfoque: { punto: Posicion; n: number } | null;
  onSeleccionar: (id: string | null) => void;
  /** Entrega una función que devuelve el centro actual de la mira. */
  registrarMira: (centro: () => Posicion) => void;
  /** true = computadora: cada clic en el mapa agrega un vértice. false = móvil: se usa la mira central. */
  raton: boolean;
  onPunto: (p: Posicion) => void;
}

function parcelasFC(parcelas: Parcela[], seleccionada: string | null): FeatureCollection {
  const features: Feature<Polygon, { id: string; color: string; sel: boolean }>[] = parcelas.map((p) => ({
    type: 'Feature',
    properties: { id: p.id, color: colorParcela(p), sel: p.id === seleccionada },
    geometry: { type: 'Polygon', coordinates: [[...p.anillo, p.anillo[0]]] },
  }));
  return { type: 'FeatureCollection', features };
}

/** Polígono en curso: vértices (el seleccionado se marca aparte), línea y relleno. */
function dibujoFC(puntos: Posicion[], indiceSeleccionado: number): FeatureCollection {
  const features: Feature[] = puntos.map((p, i) => ({
    type: 'Feature',
    properties: { sel: i === indiceSeleccionado },
    geometry: { type: 'Point', coordinates: p },
  }));
  if (puntos.length >= 2) {
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: puntos } });
  }
  if (puntos.length >= 3) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[...puntos, puntos[0]]] },
    });
  }
  return { type: 'FeatureCollection', features };
}

function encuadrar(m: maplibregl.Map, parcelas: Parcela[]) {
  const coords = parcelas.flatMap((p) => p.anillo);
  if (!coords.length) return;
  const limites = coords.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coords[0], coords[0]),
  );
  m.fitBounds(limites, { padding: 56, maxZoom: 16, duration: 0 });
}

export function MapaParcelas({
  parcelas,
  seleccionada,
  dibujando,
  puntos,
  indiceSeleccionado,
  enfoque,
  onSeleccionar,
  registrarMira,
  raton,
  onPunto,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const listo = useRef(false);
  const encuadrado = useRef(false);
  const ultimo = useRef({ parcelas, seleccionada, puntos, indiceSeleccionado });
  const accion = useRef({ dibujando, onSeleccionar, raton, onPunto });
  const capaImagen = useRef<string | null>(null);
  const imagenActual = useRef<{ url: string; bbox: Caja } | null>(null);

  const [filtro, setFiltro] = useState<Filtro>('natural');
  const [imagen, setImagen] = useState<{ url: string; bbox: Caja } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const parcelaSel = parcelas.find((p) => p.id === seleccionada) ?? null;

  useEffect(() => {
    accion.current = { dibujando, onSeleccionar, raton, onPunto };
  }, [dibujando, onSeleccionar, raton, onPunto]);

  // Imagen satelital de la parcela seleccionada, según el filtro. "Color real" usa la foto del mapa.
  useEffect(() => {
    if (!parcelaSel || filtro === 'natural') {
      setImagen(null);
      setErrorImagen(null);
      setCargando(false);
      return;
    }
    let vigente = true;
    setCargando(true);
    setErrorImagen(null);
    imagenPotrero(parcelaSel.anillo, filtro)
      .then((url) => {
        if (vigente) setImagen({ url, bbox: cajaDe(parcelaSel.anillo) });
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        setImagen(null);
        setErrorImagen(e instanceof Error ? e.message : 'No pudimos obtener la imagen satelital.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // Se pide solo al cambiar la parcela o el filtro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada, filtro]);

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!contenedor.current) return;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: ESTILO,
      center: [-99.0765, 18.8905],
      zoom: 13,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    m.on('load', () => {
      m.addSource('parcelas', { type: 'geojson', data: VACIO });
      m.addLayer({
        id: 'parcelas-relleno',
        type: 'fill',
        source: 'parcelas',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['get', 'sel'], 0.55, 0.3],
        },
      });
      m.addLayer({
        id: 'parcelas-borde',
        type: 'line',
        source: 'parcelas',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['get', 'sel'], 3, 1.5],
        },
      });

      m.addSource('dibujo', { type: 'geojson', data: VACIO });
      m.addLayer({
        id: 'dibujo-relleno',
        type: 'fill',
        source: 'dibujo',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#2F6DB5', 'fill-opacity': 0.25 },
      });
      m.addLayer({
        id: 'dibujo-linea',
        type: 'line',
        source: 'dibujo',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': '#2F6DB5', 'line-width': 2, 'line-dasharray': [2, 2] },
      });
      m.addLayer({
        id: 'dibujo-puntos',
        type: 'circle',
        source: 'dibujo',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['case', ['get', 'sel'], 9, 6],
          'circle-color': ['case', ['get', 'sel'], '#2F6DB5', '#FFFDF7'],
          'circle-stroke-color': '#2F6DB5',
          'circle-stroke-width': 2.5,
        },
      });

      listo.current = true;
      capaImagen.current = aplicarImagen(m, imagenActual.current, null);
      sincronizar(m, ultimo.current);
      if (ultimo.current.parcelas.length) {
        encuadrado.current = true;
        // Al volver de otra pestaña el contenedor puede medir cero en este instante: se reajusta en el siguiente cuadro.
        requestAnimationFrame(() => {
          m.resize();
          encuadrar(m, ultimo.current.parcelas);
        });
      }
    });

    // Tocar una parcela la selecciona; tocar fuera la deselecciona (solo fuera del modo dibujo).
    m.on('click', (e) => {
      if (accion.current.dibujando) {
        // En computadora, cada clic es un vértice. En móvil se agrega desde la mira.
        if (accion.current.raton) accion.current.onPunto([e.lngLat.lng, e.lngLat.lat]);
        return;
      }
      const hit = m.queryRenderedFeatures(e.point, { layers: ['parcelas-relleno'] });
      const id = hit[0]?.properties?.id;
      accion.current.onSeleccionar(typeof id === 'string' ? id : null);
    });

    registrarMira(() => {
      const c = m.getCenter();
      return [c.lng, c.lat];
    });

    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      listo.current = false;
      encuadrado.current = false;
    };
    // El mapa se crea una sola vez; registrarMira es estable en Productor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambiar la imagen satelital solo reemplaza la capa de imagen, con desvanecido.
  useEffect(() => {
    imagenActual.current = imagen;
    const m = mapa.current;
    if (m && listo.current) capaImagen.current = aplicarImagen(m, imagen, capaImagen.current);
  }, [imagen]);

  // Sincronizar capas con el estado de React.
  useEffect(() => {
    ultimo.current = { parcelas, seleccionada, puntos, indiceSeleccionado };
    const m = mapa.current;
    if (!m || !listo.current) return;
    sincronizar(m, ultimo.current);
    if (!encuadrado.current && parcelas.length) {
      encuadrado.current = true;
      encuadrar(m, parcelas);
    }
  }, [parcelas, seleccionada, puntos, indiceSeleccionado]);

  // Centrar el mapa en el vértice elegido (navegación entre vértices).
  useEffect(() => {
    const m = mapa.current;
    if (!m || !enfoque) return;
    m.easeTo({ center: enfoque.punto, duration: 300 });
  }, [enfoque]);

  useEffect(() => {
    const m = mapa.current;
    if (m) m.getCanvas().style.cursor = dibujando && raton ? 'crosshair' : '';
  }, [dibujando, raton]);

  return (
    <div className="mapa-wrap">
      <div ref={contenedor} className="mapa" role="region" aria-label="Mapa de parcelas" />
      {dibujando && !raton && (
        <div className="mira" aria-hidden="true">
          <span />
        </div>
      )}
      {parcelaSel && !dibujando && (
        <div className="mapa-satelite-panel" aria-label="Imagen satelital de la parcela">
          <FiltrosSatelite valor={filtro} onCambiar={setFiltro} />
          {filtro !== 'natural' && <EspectroSlider key={filtro} filtro={filtro} />}
          {cargando && <p className="pequeno texto-suave">Cargando la imagen satelital…</p>}
          {errorImagen && (
            <p className="pequeno" role="alert">
              {errorImagen}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function sincronizar(
  m: maplibregl.Map,
  d: { parcelas: Parcela[]; seleccionada: string | null; puntos: Posicion[]; indiceSeleccionado: number },
) {
  (m.getSource('parcelas') as maplibregl.GeoJSONSource | undefined)?.setData(parcelasFC(d.parcelas, d.seleccionada));
  (m.getSource('dibujo') as maplibregl.GeoJSONSource | undefined)?.setData(
    dibujoFC(d.puntos, d.indiceSeleccionado),
  );
}
