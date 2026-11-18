import { useEffect, useState } from 'react';
import '../../herramientas.css';

export type ModoDeteccion = 'enfermedad' | 'planta';

const TITULO: Record<ModoDeteccion, { eyebrow: string; titulo: string; boton: string }> = {
  enfermedad: { eyebrow: 'Detectar enfermedades', titulo: 'Carga las fotos del cultivo', boton: 'Guardar foto' },
  planta: { eyebrow: 'Detectar plantas', titulo: 'Carga la foto de la planta', boton: 'Guardar foto' },
};

/** Solo carga de fotos: la imagen se guarda en este dispositivo. El análisis automático está en desarrollo. */
export function DeteccionPagina({ modo }: { modo: ModoDeteccion }) {
  const t = TITULO[modo];
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [guardada, setGuardada] = useState(false);

  useEffect(() => {
    if (!foto) {
      setVista(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  return (
    <section className="herramientas">
      <header className="herramientas-cabecera">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.titulo}</h1>
      </header>

      <section className="herramienta">
        <form
          className="herramienta-form"
          onSubmit={(e) => {
            e.preventDefault();
            setGuardada(true);
          }}
        >
          <label className="campo">
            <span>Foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                setFoto(e.target.files?.[0] ?? null);
                setGuardada(false);
              }}
            />
          </label>
          {vista && <img className="herramienta-vista" src={vista} alt="Vista previa de la foto" />}
          <button type="submit" className="primario" disabled={!foto}>
            {t.boton}
          </button>
          {guardada && (
            <p className="pequeno texto-suave" role="status">
              Foto guardada en este dispositivo.
            </p>
          )}
        </form>
        <p className="pequeno texto-suave">Las fotos se quedan en este dispositivo.</p>
      </section>
    </section>
  );
}
