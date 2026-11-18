import { useEffect, useRef, useState } from 'react';

interface Deteccion {
  rawValue: string;
}
interface DetectorCodigos {
  detect: (origen: HTMLVideoElement) => Promise<Deteccion[]>;
}
type ConstructorDetector = new (opciones: { formats: string[] }) => DetectorCodigos;

interface Props {
  onDetectado: (codigo: string) => void;
  onCerrar: () => void;
}

/**
 * Lee un código de barras con la cámara usando la API BarcodeDetector del navegador (Chrome y Edge).
 * Donde no existe, el productor escribe el código a mano.
 */
export function EscanerCodigo({ onDetectado, onCerrar }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const alDetectar = useRef(onDetectado);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    alDetectar.current = onDetectado;
  }, [onDetectado]);

  useEffect(() => {
    const Ctor = (window as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;
    if (!Ctor || !navigator.mediaDevices) {
      setError('Este navegador no puede leer códigos de barras. Escribe el código a mano.');
      return;
    }
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    let activo = true;
    let stream: MediaStream | null = null;
    let pendiente = 0;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(
      async (s) => {
        if (!activo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play();
        }
        const leer = async () => {
          if (!activo || !video.current) return;
          try {
            const [hallazgo] = await detector.detect(video.current);
            if (hallazgo?.rawValue) {
              activo = false;
              alDetectar.current(hallazgo.rawValue);
              return;
            }
          } catch {
            /* cuadro sin código: se sigue leyendo */
          }
          pendiente = window.setTimeout(() => void leer(), 250);
        };
        void leer();
      },
      () => setError('No pudimos usar la cámara. Revisa el permiso o escribe el código a mano.'),
    );

    return () => {
      activo = false;
      window.clearTimeout(pendiente);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="escaner" role="dialog" aria-label="Escanear código de barras">
      {error ? <p className="campo-error">{error}</p> : <video ref={video} playsInline muted className="escaner-video" />}
      <p className="pequeno texto-suave">Apunta la cámara al código de barras del envase.</p>
      <button type="button" className="secundario" onClick={onCerrar}>
        Cerrar
      </button>
    </div>
  );
}
