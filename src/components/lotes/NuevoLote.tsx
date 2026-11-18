import { useState, type FormEvent } from 'react';
import { HORTALIZAS, type Hortaliza, type Lote, type Parcela } from '../../lib/tipos';
import { generarCodigo, nuevoEvento } from '../../lib/lotes';
import { nuevoId } from '../../lib/almacen';
import { hoyLocal } from '../../lib/formato';

interface Props {
  parcelas: Parcela[];
  lotes: Lote[];
  onCrear: (lote: Lote) => void;
  onCancelar: () => void;
}

/** Alta de lote: parcela, hortaliza, variedad y fecha de siembra. Crea el primer evento (siembra). */
export function NuevoLote({ parcelas, lotes, onCrear, onCancelar }: Props) {
  const hoy = hoyLocal();
  const [parcelaId, setParcelaId] = useState(parcelas[0]?.id ?? '');
  const [hortaliza, setHortaliza] = useState<Hortaliza>('Jitomate');
  const [variedad, setVariedad] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [error, setError] = useState<string | null>(null);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const parcela = parcelas.find((p) => p.id === parcelaId);
    if (!parcela) return setError('Elige la parcela donde se siembra el lote.');
    if (!fecha || fecha > hoy) return setError('La fecha de siembra no puede ser futura.');
    const codigo = generarCodigo(hortaliza, fecha, lotes);
    onCrear({
      id: nuevoId('l'),
      codigo,
      parcelaId: parcela.id,
      parcelaNombre: parcela.nombre,
      hortaliza,
      variedad: variedad.trim(),
      fechaSiembra: fecha,
      creado: new Date().toISOString(),
      eventos: [nuevoEvento('siembra', fecha, `Siembra en ${parcela.nombre}${variedad.trim() ? ` · ${variedad.trim()}` : ''}`)],
    });
  };

  return (
    <form className="lote-formulario" onSubmit={enviar} noValidate>
      <header className="lotes-cabecera">
        <div>
          <p className="eyebrow">Nuevo lote</p>
          <h1>Registrar siembra</h1>
        </div>
        <button type="button" className="enlace" onClick={onCancelar}>
          Cancelar
        </button>
      </header>

      {parcelas.length === 0 && (
        <p className="nota-lote">
          Para registrar un lote necesitas una parcela de hortalizas. Cambia el cultivo de una parcela o crea una nueva.
        </p>
      )}

      <label className="campo">
        <span>Parcela</span>
        <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
          {parcelas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {p.hectareas.toFixed(2)} ha
            </option>
          ))}
        </select>
      </label>

      <div className="fila-dos">
        <label className="campo">
          <span>Hortaliza</span>
          <select value={hortaliza} onChange={(e) => setHortaliza(e.target.value as Hortaliza)}>
            {HORTALIZAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Variedad (opcional)</span>
          <input value={variedad} onChange={(e) => setVariedad(e.target.value)} maxLength={60} placeholder="Ej. Saladette" />
        </label>
      </div>

      <label className="campo">
        <span>Fecha de siembra</span>
        <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} />
      </label>

      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="primario ancho" disabled={!parcelaId}>
        Crear lote
      </button>
    </form>
  );
}
