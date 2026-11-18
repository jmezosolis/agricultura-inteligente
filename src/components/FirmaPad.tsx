import { useEffect, useRef, useState } from 'react';

interface Props {
  onCambio: (vacia: boolean) => void;
  /** Recibe la firma como imagen PNG (data URL). */
  registrar: (fn: () => string) => void;
}

/** Área para firmar con mouse, dedo o lápiz. Guarda la firma como imagen PNG. */
export function FirmaPad({ onCambio, registrar }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const trazando = useRef(false);
  const [vacia, setVacia] = useState(true);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const escala = window.devicePixelRatio || 1;
    const ancho = c.clientWidth;
    const alto = c.clientHeight;
    c.width = Math.round(ancho * escala);
    c.height = Math.round(alto * escala);
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f2a4a';
  }, []);

  useEffect(() => {
    registrar(() => canvas.current?.toDataURL('image/png') ?? '');
  }, [registrar]);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const inicio = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* sin captura activa: el trazo sigue funcionando */
    }
    trazando.current = true;
    const [x, y] = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!trazando.current) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const [x, y] = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (vacia) {
      setVacia(false);
      onCambio(false);
    }
  };

  const fin = () => {
    trazando.current = false;
  };

  const limpiar = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setVacia(true);
    onCambio(true);
  };

  return (
    <div className="firma-pad">
      <canvas
        ref={canvas}
        className="firma-lienzo"
        onPointerDown={inicio}
        onPointerMove={mover}
        onPointerUp={fin}
        onPointerLeave={fin}
        onPointerCancel={fin}
        aria-label="Área para firmar"
      />
      <div className="firma-linea" aria-hidden="true">
        Firma aquí
      </div>
      <button type="button" className="enlace" onClick={limpiar}>
        Borrar firma
      </button>
    </div>
  );
}
