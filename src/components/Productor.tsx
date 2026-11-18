import { useRef, useState } from 'react';
import { MapaParcelas } from './MapaParcelas';
import { Boleta } from './Boleta';
import { type Lote, type Manejo, type NuevaParcela, type Oferta, type Parcela, type Posicion } from '../lib/tipos';
import { hectareas, perimetroM } from '../lib/modelo';
import { fmtDistancia, fmtSuperficie } from '../lib/formato';
import type { DatosParcela } from './EditarDatos';
import { Resumen } from './productor/Resumen';
import { PanelDibujo } from './productor/PanelDibujo';
import { FormularioParcela } from './productor/FormularioParcela';

type Modo = 'explorar' | 'dibujando' | 'nueva';

interface Props {
  parcelas: Parcela[];
  ofertas: Oferta[];
  lotes: Lote[];
  cargando: boolean;
  onCrear: (datos: NuevaParcela) => void;
  onEliminar: (id: string) => void;
  onPublicar: (parcelaId: string, precio: number, loteId: string | null) => void;
  onCambiarColor: (parcelaId: string, color: string) => void;
  onGuardarManejo: (parcelaId: string, manejo: Manejo) => void;
  onEditarDatos: (parcelaId: string, datos: DatosParcela) => void;
  onActualizarOferta: (parcelaId: string) => void;
  onLiberarReserva: (ofertaId: string) => void;
  onActualizar: (p: Parcela) => void;
  onDemo: () => void;
}

/** Computadora si el puntero es fino (mouse); móvil si es táctil. */
const esRaton = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export function Productor({
  parcelas,
  ofertas,
  lotes,
  cargando,
  onCrear,
  onEliminar,
  onPublicar,
  onCambiarColor,
  onGuardarManejo,
  onEditarDatos,
  onActualizarOferta,
  onLiberarReserva,
  onActualizar,
  onDemo,
}: Props) {
  const [modo, setModo] = useState<Modo>('explorar');
  // El mapa solo se muestra mientras se marca el área de cultivo.
  const [puntos, setPuntos] = useState<Posicion[]>([]);
  const [indice, setIndice] = useState(-1);
  const [enfoque, setEnfoque] = useState<{ punto: Posicion; n: number } | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [raton, setRaton] = useState<boolean>(esRaton);
  const centroMira = useRef<(() => Posicion) | null>(null);

  const parcela = parcelas.find((p) => p.id === seleccionada) ?? null;
  const area = hectareas(puntos) * 10_000;
  const perimetro = perimetroM(puntos);

  const empezarDibujo = () => {
    setPuntos([]);
    setIndice(-1);
    setSeleccionada(null);
    setModo('dibujando');
  };

  const cancelarDibujo = () => {
    setPuntos([]);
    setIndice(-1);
    setModo('explorar');
  };

  // Agrega un vértice, ignorando uno igual al anterior.
  const anadirPunto = (p: Posicion) => {
    const ultimo = puntos[puntos.length - 1];
    if (ultimo && ultimo[0] === p[0] && ultimo[1] === p[1]) return;
    setPuntos((prev) => [...prev, p]);
    setIndice(puntos.length);
  };

  // Móvil: el vértice es el centro de la mira.
  const agregarEnMira = () => {
    const centro = centroMira.current?.();
    if (centro) anadirPunto(centro);
  };

  const moverIndice = (nuevo: number) => {
    if (puntos.length === 0) return;
    const i = Math.min(puntos.length - 1, Math.max(0, nuevo));
    setIndice(i);
    setEnfoque({ punto: puntos[i], n: (enfoque?.n ?? 0) + 1 });
  };

  const deshacer = () => {
    setPuntos((prev) => prev.slice(0, -1));
    setIndice((i) => Math.max(-1, Math.min(i, puntos.length - 2)));
  };

  const borrarTodo = () => {
    setPuntos([]);
    setIndice(-1);
  };

  const guardar = (datos: Omit<NuevaParcela, 'anillo'>) => {
    onCrear({ ...datos, anillo: puntos });
    setPuntos([]);
    setIndice(-1);
    setModo('explorar');
  };

  return (
    <div className={`productor ${modo === 'dibujando' ? 'mapa-grande' : 'sin-mapa'}`}>
      {modo === 'dibujando' && (
      <div className="mapa-marco">
        {modo === 'dibujando' && !raton && (
          <button type="button" className="boton-agregar" onClick={agregarEnMira}>
            Agregar punto
          </button>
        )}
        <MapaParcelas
          parcelas={parcelas}
          seleccionada={seleccionada}
          dibujando={modo === 'dibujando'}
          puntos={puntos}
          indiceSeleccionado={indice}
          enfoque={enfoque}
          onSeleccionar={() => undefined}
          registrarMira={(fn) => {
            centroMira.current = fn;
          }}
          raton={raton}
          onPunto={anadirPunto}
        />

        {modo === 'dibujando' && (
          <div className="barra-medicion" role="status" aria-live="polite">
            <div>
              <span className="etiqueta-mini">Área</span>
              <strong className="mono">{puntos.length >= 3 ? fmtSuperficie(area) : '—'}</strong>
            </div>
            <div>
              <span className="etiqueta-mini">Perímetro</span>
              <strong className="mono">{puntos.length >= 2 ? fmtDistancia(perimetro) : '—'}</strong>
            </div>
            <div>
              <span className="etiqueta-mini">Vértices</span>
              <strong className="mono">{puntos.length}</strong>
            </div>
          </div>
        )}
      </div>
      )}

      <aside className="panel" aria-label="Panel de parcelas">
        {modo === 'explorar' && parcela && (
          <Boleta
            parcela={parcela}
            lotes={parcela.cultivo === 'hortalizas' ? lotes.filter((l) => l.parcelaId === parcela.id) : []}
            oferta={ofertas.find((o) => o.parcelaId === parcela.id && (o.estado === 'abierta' || o.estado === 'reservada'))}
            onLiberarReserva={() => onLiberarReserva(parcela.id)}
            onActualizarOferta={() => onActualizarOferta(parcela.id)}
            cargando={cargando}
            onPublicar={(precio, loteId) => onPublicar(parcela.id, precio, loteId)}
            onCambiarColor={(color) => onCambiarColor(parcela.id, color)}
            onGuardarManejo={(manejo) => onGuardarManejo(parcela.id, manejo)}
            onEditarDatos={(datos) => onEditarDatos(parcela.id, datos)}
            onActualizar={() => onActualizar(parcela)}
            onEliminar={() => {
              if (window.confirm(`¿Eliminar "${parcela.nombre}"? También se quitan sus ofertas.`)) {
                onEliminar(parcela.id);
                setSeleccionada(null);
              }
            }}
            onCerrar={() => setSeleccionada(null)}
          />
        )}

        {modo === 'explorar' && !parcela && (
          <Resumen
            parcelas={parcelas}
            ofertas={ofertas}
            onDibujar={empezarDibujo}
            onElegir={setSeleccionada}
            onDemo={onDemo}
          />
        )}

        {modo === 'dibujando' && (
          <PanelDibujo
            puntos={puntos}
            area={area}
            indice={indice}
            raton={raton}
            onCambiarRaton={setRaton}
            mostrarSelector={esRaton()}
            onAnterior={() => moverIndice(indice - 1)}
            onSiguiente={() => moverIndice(indice + 1)}
            onDeshacer={deshacer}
            onBorrarTodo={borrarTodo}
            onCerrar={() => setModo('nueva')}
            onCancelar={cancelarDibujo}
          />
        )}

        {modo === 'nueva' && (
          <FormularioParcela
            superficie={area}
            onGuardar={guardar}
            onVolverADibujar={() => {
              setPuntos([]);
              setIndice(-1);
              setModo('dibujando');
            }}
            onCancelar={cancelarDibujo}
          />
        )}
      </aside>
    </div>
  );
}
