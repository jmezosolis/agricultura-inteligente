import { useState } from 'react';
import { CULTIVOS, type Cultivo, type Parcela } from '../lib/tipos';

export interface DatosParcela {
  nombre: string;
  cultivo: Cultivo;
  siembra: string | null;
  ndvi: number | null;
}

/** Edita nombre, cultivo, fecha de siembra de una parcela ya creada. */
export function EditarDatos({ parcela: p, onGuardar }: { parcela: Parcela; onGuardar: (d: DatosParcela) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(p.nombre);
  const [cultivo, setCultivo] = useState<Cultivo>(p.cultivo);
  const [siembra, setSiembra] = useState(p.siembra ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <div className="bloque paso-linea">
        <span className="texto-suave pequeno">
          Siembra: {p.siembra ?? 'sin registrar'} · Cultivo: {CULTIVOS[p.cultivo].nombre}
        </span>
        <button type="button" className="enlace" onClick={() => setAbierto(true)}>
          Editar datos
        </button>
      </div>
    );
  }

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('El nombre no puede quedar vacío.');
    setError(null);
    onGuardar({ nombre: nombre.trim(), cultivo, siembra: siembra || null, ndvi: p.ndvi });
    setAbierto(false);
  };

  return (
    <form className="bloque" onSubmit={guardar} noValidate>
      <h3>Datos de la parcela</h3>
      <label className="campo">
        <span>Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
      </label>
      <div className="fila-dos">
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
        <label className="campo">
          <span>Fecha de siembra</span>
          <input type="date" value={siembra} onChange={(e) => setSiembra(e.target.value)} />
        </label>
      </div>
      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}
      <div className="acciones-fila">
        <button type="submit" className="primario">
          Guardar datos
        </button>
        <button type="button" className="enlace" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
