import { useState, type FormEvent } from 'react';
import type { Manejo, Parcela } from '../lib/tipos';
import { comparacionCosecha, estimar } from '../lib/modelo';
import { fmtNumero } from '../lib/formato';

interface Props {
  parcela: Parcela;
  onGuardar: (manejo: Manejo) => void;
}

const numeroONulo = (v: string): number | null => (v.trim() === '' ? null : Number(v));

/** Datos de manejo y cosecha real. Todo es opcional; se guarda lo que el productor llene. */
export function ManejoForm({ parcela: p, onGuardar }: Props) {
  const m = p.manejo;
  const [riego, setRiego] = useState(m?.riego ?? false);
  const [variedad, setVariedad] = useState(m?.variedad ?? '');
  const [densidad, setDensidad] = useState(m?.densidad?.toString() ?? '');
  const [nitrogeno, setNitrogeno] = useState(m?.nitrogenoKgHa?.toString() ?? '');
  const [riegos, setRiegos] = useState(m?.riegos?.toString() ?? '');
  const [fechaCosecha, setFechaCosecha] = useState(m?.fechaCosecha ?? '');
  const [toneladas, setToneladas] = useState(m?.toneladasReales?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const comparacion = comparacionCosecha(p);
  const estimado = estimar(p).tHa;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const tn = numeroONulo(toneladas);
    const dens = numeroONulo(densidad);
    const nit = numeroONulo(nitrogeno);
    const rg = numeroONulo(riegos);
    if ([tn, dens, nit, rg].some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
      setError('Los valores numéricos no pueden ser negativos.');
      return;
    }
    if (fechaCosecha && p.siembra && fechaCosecha < p.siembra) {
      setError('La fecha de cosecha es anterior a la siembra. Revísala.');
      return;
    }
    setError(null);
    onGuardar({
      riego,
      variedad: variedad.trim(),
      densidad: dens,
      nitrogenoKgHa: nit,
      riegos: riego ? rg : null,
      fechaCosecha: fechaCosecha || null,
      toneladasReales: tn,
    });
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <form className="bloque" onSubmit={enviar} noValidate aria-labelledby="manejo-titulo">
      <h3 id="manejo-titulo">Manejo y cosecha</h3>

      <label className="casilla">
        <input type="checkbox" checked={riego} onChange={(e) => setRiego(e.target.checked)} />
        <span>Tiene riego</span>
      </label>

      <div className="fila-dos">
        <label className="campo">
          <span>Variedad</span>
          <input value={variedad} onChange={(e) => setVariedad(e.target.value)} maxLength={60} placeholder="Ej. H-516" />
        </label>
        <label className="campo">
          <span>Densidad (plantas/ha)</span>
          <input type="number" inputMode="numeric" min={0} step={1000} value={densidad} onChange={(e) => setDensidad(e.target.value)} />
        </label>
      </div>

      <div className="fila-dos">
        <label className="campo">
          <span>Nitrógeno (kg/ha)</span>
          <input type="number" inputMode="decimal" min={0} step={1} value={nitrogeno} onChange={(e) => setNitrogeno(e.target.value)} />
        </label>
        <label className="campo">
          <span>Riegos en el ciclo</span>
          <input type="number" inputMode="numeric" min={0} step={1} value={riegos} onChange={(e) => setRiegos(e.target.value)} disabled={!riego} />
        </label>
      </div>

      <h4 className="subtitulo">Cosecha real</h4>
      <div className="fila-dos">
        <label className="campo">
          <span>Fecha de cosecha</span>
          <input type="date" value={fechaCosecha} onChange={(e) => setFechaCosecha(e.target.value)} />
        </label>
        <label className="campo">
          <span>Toneladas medidas</span>
          <input type="number" inputMode="decimal" min={0} step={0.1} value={toneladas} onChange={(e) => setToneladas(e.target.value)} />
        </label>
      </div>

      {comparacion && (
        <p className="comparacion" role="status">
          Cosecha real: <strong className="mono">{fmtNumero(comparacion.realTHa, 2)} t/ha</strong>. La estimación
          ({fmtNumero(estimado, 2)} t/ha) fue{' '}
          <strong className="mono">
            {Math.abs(comparacion.errorPct).toFixed(1)} % {comparacion.errorPct >= 0 ? 'mayor' : 'menor'}
          </strong>.
        </p>
      )}

      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}

      <div className="acciones-fila">
        <button type="submit" className="primario">
          {guardado ? 'Guardado' : 'Guardar manejo y cosecha'}
        </button>
      </div>
    </form>
  );
}
