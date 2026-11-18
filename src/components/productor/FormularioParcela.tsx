import { useState, type FormEvent } from 'react';
import { CULTIVOS, type Cultivo, type NuevaParcela } from '../../lib/tipos';
import { fmtSuperficie } from '../../lib/formato';

export function FormularioParcela({
  superficie,
  onGuardar,
  onVolverADibujar,
  onCancelar,
}: {
  superficie: number;
  onGuardar: (datos: Omit<NuevaParcela, 'anillo'>) => void;
  onVolverADibujar: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [cultivo, setCultivo] = useState<Cultivo>('maiz');
  const [siembra, setSiembra] = useState('');
  const [error, setError] = useState<string | null>(null);
  const porDefecto = `Parcela ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    // Igual que en potreoGPS: si no escribes nombre se usa "Parcela <fecha>".
    onGuardar({ nombre: nombre.trim() || porDefecto, cultivo, siembra: siembra || null, ndvi: null });
  };

  return (
    <form onSubmit={enviar} noValidate>
      <p className="eyebrow">Superficie {fmtSuperficie(superficie)}</p>
      <h2>Datos de la parcela</h2>

      <label className="campo">
        <span>Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} placeholder={porDefecto} autoFocus />
      </label>

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


      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}

      <div className="acciones-columna">
        <button type="submit" className="primario ancho">
          Guardar parcela
        </button>
        <button type="button" className="secundario ancho" onClick={onVolverADibujar}>
          Volver a dibujar
        </button>
        <button type="button" className="enlace" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
