import { useEffect, useState, type FormEvent } from 'react';
import { CULTIVOS, type Parcela } from '../../lib/tipos';
import '../../herramientas.css';

export type ModoDeteccion = 'enfermedad' | 'planta';

interface Props {
  modo: ModoDeteccion;
  parcelas: Parcela[];
}

const TEXTO: Record<ModoDeteccion, { eyebrow: string; titulo: string; intro: string; aviso: string; boton: string; exito: string }> = {
  enfermedad: {
    eyebrow: 'Detectar enfermedades',
    titulo: 'Revisa si tu cultivo tiene una enfermedad',
    intro: 'Toma una foto de la hoja o la planta afectada, describe lo que ves y guárdala en tu registro.',
    aviso:
      'En desarrollo. Todavía no hay diagnóstico automático de enfermedades. La foto se queda en este dispositivo y no se envía a ningún servicio.',
    boton: 'Guardar observación',
    exito: 'Observación guardada en este dispositivo. Por ahora no se genera un diagnóstico automático.',
  },
  planta: {
    eyebrow: 'Detectar plantas',
    titulo: 'Identifica la planta de una foto',
    intro: 'Toma una foto de la planta para registrarla. Puedes indicar el cultivo y la parcela donde está.',
    aviso:
      'En desarrollo. Todavía no hay identificación automática de especies. La foto se queda en este dispositivo y no se envía a ningún servicio.',
    boton: 'Guardar foto',
    exito: 'Foto guardada en este dispositivo. Por ahora no se identifica la especie.',
  },
};

/** Pantalla para detectar enfermedades o plantas: la foto y los datos se registran; el análisis automático está pendiente. */
export function DeteccionPagina({ modo, parcelas }: Props) {
  const t = TEXTO[modo];
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [cultivo, setCultivo] = useState<keyof typeof CULTIVOS>('hortalizas');
  const [parcelaId, setParcelaId] = useState('');
  const [notas, setNotas] = useState('');
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!foto) {
      setVista(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    // La foto no sale del dispositivo: el análisis automático todavía no está conectado.
    setEnviado(true);
  };

  return (
    <section className="herramientas">
      <header className="herramientas-cabecera">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.titulo}</h1>
        <p className="texto-suave">{t.intro}</p>
      </header>

      <section className="herramienta">
        <p className="aviso-pendiente" role="note">
          {t.aviso}
        </p>
        <form className="herramienta-form" onSubmit={guardar} noValidate>
          <label className="campo">
            <span>Foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                setFoto(e.target.files?.[0] ?? null);
                setEnviado(false);
              }}
            />
          </label>
          {vista && <img className="herramienta-vista" src={vista} alt="Vista previa de la foto" />}
          <div className="fila-dos">
            <label className="campo">
              <span>Cultivo</span>
              <select value={cultivo} onChange={(e) => setCultivo(e.target.value as keyof typeof CULTIVOS)}>
                {(Object.keys(CULTIVOS) as (keyof typeof CULTIVOS)[]).map((c) => (
                  <option key={c} value={c}>
                    {CULTIVOS[c].nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Parcela (opcional)</span>
              <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
                <option value="">Sin parcela</option>
                {parcelas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="campo">
            <span>{modo === 'enfermedad' ? 'Síntomas que observas' : 'Notas'}</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder={modo === 'enfermedad' ? 'Manchas, color, dónde aparecen' : 'Dónde la encontraste, para qué la usas'}
            />
          </label>
          <button type="submit" className="primario" disabled={!foto}>
            {t.boton}
          </button>
          {enviado && (
            <p className="pequeno texto-suave" role="status">
              {t.exito}
            </p>
          )}
        </form>
      </section>
    </section>
  );
}
