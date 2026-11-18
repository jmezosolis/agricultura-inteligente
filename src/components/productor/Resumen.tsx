import { ListaParcelas } from './ListaParcelas';
import type { Oferta, Parcela } from '../../lib/tipos';

export function Resumen({
  parcelas,
  ofertas,
  onDibujar,
  onElegir,
  onDemo,
}: {
  parcelas: Parcela[];
  ofertas: Oferta[];
  onDibujar: () => void;
  onElegir: (id: string) => void;
  onDemo: () => void;
}) {
  if (parcelas.length === 0) {
    return (
      <section className="vacio">
        <p className="eyebrow">Sin parcelas</p>
        <h2>Dibuja tu primera parcela</h2>
        <ol className="pasos-inicio">
          <li>Dibuja la parcela sobre el mapa.</li>
          <li>Indica la fecha de siembra y el cultivo.</li>
          <li>Publica tu oferta para compradores.</li>
        </ol>
        <button type="button" className="primario ancho" onClick={onDibujar}>
          Dibujar parcela
        </button>
        <button type="button" className="secundario ancho" onClick={onDemo}>
          Cargar parcela de ejemplo
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="cabecera-panel">
        <div>
          <p className="eyebrow">Inicio · Mis parcelas</p>
          <h2>Mis parcelas</h2>
          <p className="texto-suave pequeno">
            Panel de seguimiento de {parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'}.
          </p>
        </div>
        <button type="button" className="primario" onClick={onDibujar}>
          Nueva parcela
        </button>
      </div>
      <ListaParcelas parcelas={parcelas} ofertas={ofertas} onElegir={onElegir} />
    </section>
  );
}
