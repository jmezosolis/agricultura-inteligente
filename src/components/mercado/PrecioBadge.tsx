import { type Cultivo } from '../../lib/tipos';
import { compararPrecio } from '../../lib/precios';

export function PrecioBadge({ cultivo, precio }: { cultivo: Cultivo; precio: number }) {
  const c = compararPrecio(cultivo, precio);
  if (c.posicion === 'sin-referencia' || !c.referencia) {
    return <p className="precio-badge neutro">Sin referencia SIAP para este cultivo.</p>;
  }
  const pct = Math.abs(c.diferenciaPct ?? 0).toFixed(1);
  const texto =
    c.posicion === 'dentro'
      ? `Dentro de la referencia SIAP (${c.referencia.ano}).`
      : c.posicion === 'arriba'
        ? `${pct} % sobre la referencia SIAP (${c.referencia.ano}).`
        : `${pct} % bajo la referencia SIAP (${c.referencia.ano}).`;
  return <p className={`precio-badge ${c.posicion}`}>{texto}</p>;
}
