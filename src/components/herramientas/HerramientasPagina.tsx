import { useEffect, useMemo, useState } from 'react';
import { CULTIVOS, type ImagenDron, type Parcela } from '../../lib/tipos';
import { estimar, hectareas as hectareasDe } from '../../lib/modelo';
import { fmtNumero } from '../../lib/formato';
import { nuevoId } from '../../lib/almacen';
import '../../herramientas.css';

interface Props {
  parcelas: Parcela[];
  imagenes: ImagenDron[];
  onAgregarImagen: (imagen: ImagenDron) => void;
}

const EXTENSIONES_DRON = '.tif,.tiff,.jpg,.jpeg,.png';

/** Herramientas de cosecha: importación de imágenes de dron y calculadora de volumen. */
export function HerramientasPagina({ parcelas, imagenes, onAgregarImagen }: Props) {
  return (
    <section className="herramientas">
      <header className="herramientas-cabecera">
        <p className="eyebrow">Parcelas</p>
        <h1>Dron y cosecha</h1>
        <p className="texto-suave">Registra imágenes de dron y calcula el volumen de cosecha de cada parcela.</p>
      </header>

      <Dron parcelas={parcelas} imagenes={imagenes} onAgregar={onAgregarImagen} />
      <Biomasa parcelas={parcelas} />
      <Cosecha parcelas={parcelas} />
    </section>
  );
}

function Dron({ parcelas, imagenes, onAgregar }: { parcelas: Parcela[]; imagenes: ImagenDron[]; onAgregar: (i: ImagenDron) => void }) {
  const [parcelaId, setParcelaId] = useState(parcelas[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  const importar = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!parcelaId) {
      setError('Elige la parcela a la que pertenece la imagen.');
      return;
    }
    setError(null);
    onAgregar({
      id: nuevoId('d'),
      parcelaId,
      nombre: archivo.name,
      tamanoKb: Math.round(archivo.size / 1024),
      fecha: new Date().toISOString().slice(0, 10),
    });
  };

  const registros = useMemo(() => imagenes.slice().reverse(), [imagenes]);

  return (
    <section className="herramienta" aria-labelledby="h-dron">
      <h2 id="h-dron">Conectar dron</h2>
      <div className="dron-estado" role="status">
        <span className="dron-punto" aria-hidden="true" />
        <div>
          <strong>Sin conexión en vivo</strong>
          <p className="pequeno texto-suave">
            Por ahora puedes cargar los archivos que exporta el dron. La conexión directa requiere la app del fabricante
            y su SDK, y todavía no está desarrollada.
          </p>
        </div>
      </div>
      <p className="aviso-pendiente" role="note">
        El archivo se registra por parcela. El análisis automático de las imágenes está pendiente.
      </p>
      <div className="fila-dos">
        <label className="campo">
          <span>Parcela</span>
          <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
            <option value="">Elige una parcela</option>
            {parcelas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Archivo (TIFF, JPG o PNG)</span>
          <input
            type="file"
            accept={EXTENSIONES_DRON}
            onChange={(e) => {
              importar(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}
      {registros.length === 0 ? (
        <p className="texto-suave pequeno">Aún no hay imágenes importadas.</p>
      ) : (
        <ul className="herramienta-lista">
          {registros.map((i) => (
            <li key={i.id}>
              <strong>{i.nombre}</strong>
              <span className="pequeno texto-suave">
                {parcelas.find((p) => p.id === i.parcelaId)?.nombre ?? 'Parcela eliminada'} · {fmtNumero(i.tamanoKb, 0)} KB · {i.fecha}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Vista visual del volumen de biomasa. No calcula nada: el cálculo requiere fotos procesadas y calibración en campo. */
function Biomasa({ parcelas }: { parcelas: Parcela[] }) {
  const [parcelaId, setParcelaId] = useState(parcelas[0]?.id ?? '');

  return (
    <section className="herramienta" aria-labelledby="h-biomasa">
      <h2 id="h-biomasa">Volumen de biomasa</h2>
      <p className="aviso-pendiente" role="note">
        Vista previa. El cálculo de biomasa no está activo en esta versión.
      </p>
      <label className="campo">
        <span>Parcela</span>
        <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
          {parcelas.length === 0 && <option value="">Sin parcelas</option>}
          {parcelas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <div className="biomasa-visual" aria-hidden="true">
        <svg viewBox="0 0 240 90" role="presentation">
          <line x1="0" y1="86" x2="240" y2="86" />
          <rect x="18" y="52" width="22" height="34" rx="4" />
          <rect x="52" y="38" width="22" height="48" rx="4" />
          <rect x="86" y="24" width="22" height="62" rx="4" />
          <rect x="120" y="44" width="22" height="42" rx="4" />
          <rect x="154" y="30" width="22" height="56" rx="4" />
          <rect x="188" y="58" width="22" height="28" rx="4" />
        </svg>
      </div>
      <div className="cosecha-resultado">
        <p className="cifra">
          — <span className="cifra-unidad">t/ha</span>
        </p>
        <p className="pequeno texto-suave">Se mostrará cuando haya fotos del dron procesadas y una calibración con cortes en campo.</p>
      </div>
    </section>
  );
}

function Cosecha({ parcelas }: { parcelas: Parcela[] }) {
  const [parcelaId, setParcelaId] = useState(parcelas[0]?.id ?? '');
  const parcela = parcelas.find((p) => p.id === parcelaId) ?? null;
  const rendimientoBase = parcela ? estimar(parcela).tHa : 0;
  const [rendimiento, setRendimiento] = useState<string>('');
  const [perdida, setPerdida] = useState('0');

  useEffect(() => {
    setRendimiento(parcela ? String(rendimientoBase) : '');
    // Al cambiar de parcela, el rendimiento vuelve a su valor base.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelaId]);

  const rend = Number(rendimiento.replace(',', '.'));
  const perd = Number(perdida.replace(',', '.'));
  const valido = parcela !== null && rend > 0 && perd >= 0 && perd < 100;
  const toneladas = valido && parcela ? hectareasDe(parcela.anillo) * rend * (1 - perd / 100) : 0;
  const supuesto = parcela ? !CULTIVOS[parcela.cultivo].calibrado : false;

  return (
    <section className="herramienta" aria-labelledby="h-cosecha">
      <h2 id="h-cosecha">Calculadora de cosecha</h2>
      <p className="texto-suave pequeno">Volumen = superficie × rendimiento × (1 − pérdida). Puedes cambiar el rendimiento y la pérdida.</p>
      <div className="fila-dos">
        <label className="campo">
          <span>Parcela</span>
          <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
            {parcelas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Rendimiento (t/ha)</span>
          <input inputMode="decimal" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} />
        </label>
      </div>
      <label className="campo">
        <span>Pérdida estimada en cosecha (%)</span>
        <input inputMode="decimal" value={perdida} onChange={(e) => setPerdida(e.target.value)} />
      </label>
      {parcela ? (
        <div className="cosecha-resultado" aria-live="polite">
          <p className="cifra">
            {fmtNumero(toneladas, 1)}
            <span className="cifra-unidad"> t</span>
          </p>
          <p className="pequeno texto-suave">
            {fmtNumero(toneladas * 1000, 0)} kg · {fmtNumero(hectareasDe(parcela.anillo), 2)} ha
            {supuesto ? ' · rendimiento supuesto, sin calibrar' : ' · rendimiento de modelo SIAP Morelos'}
          </p>
        </div>
      ) : (
        <p className="texto-suave pequeno">Dibuja una parcela para calcular su cosecha.</p>
      )}
    </section>
  );
}
