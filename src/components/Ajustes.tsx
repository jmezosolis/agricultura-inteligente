import { useState } from 'react';
import { numeroWhatsapp } from '../lib/whatsapp';

interface Props {
  claveActual: string;
  telefono: string;
  onGuardar: (clave: string) => void;
  onGuardarTelefono: (telefono: string) => void;
  onActualizarTodo: () => void;
  onExportar: () => void;
  onCerrar: () => void;
}

/** Configuración de la app: WhatsApp de contacto, clave de avisos de incendio y datos. */
export function Ajustes({ claveActual, telefono, onGuardar, onGuardarTelefono, onActualizarTodo, onExportar, onCerrar }: Props) {
  const [clave, setClave] = useState(claveActual);
  const [tel, setTel] = useState(telefono);
  const [errorTel, setErrorTel] = useState<string | null>(null);

  const guardarTel = () => {
    const n = numeroWhatsapp(tel);
    if (!n) return setErrorTel('Escribe un número de 10 dígitos, con lada.');
    setErrorTel(null);
    onGuardarTelefono(tel.replace(/\D/g, '').slice(-10));
  };

  return (
    <div className="velo" role="presentation" onClick={onCerrar}>
      <section className="dialogo" role="dialog" aria-modal="true" aria-labelledby="ajustes-titulo" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Agricultura Inteligente</p>
        <h2 id="ajustes-titulo">Configuración</h2>

        <h3 className="subtitulo">Tu WhatsApp</h3>
        <p className="pequeno texto-suave">Los compradores te escriben a este número cuando reservan una oferta.</p>
        <label className="campo">
          <span>Número de 10 dígitos</span>
          <input type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} maxLength={16} placeholder="7771234567" />
        </label>
        {errorTel && (
          <p className="campo-error" role="alert">
            {errorTel}
          </p>
        )}
        <div className="acciones-fila">
          <button type="button" className="primario" onClick={guardarTel}>
            Guardar WhatsApp
          </button>
        </div>

        <h3 className="subtitulo">Avisos de incendio</h3>
        <label className="campo">
          <span>Clave de NASA FIRMS</span>
          <input type="password" autoComplete="off" value={clave} onChange={(e) => setClave(e.target.value.trim())} placeholder="Pega tu MAP_KEY" />
        </label>
        <p className="pequeno texto-suave">Gratuita, en el sitio de NASA FIRMS. Se guarda solo en este navegador.</p>
        <div className="acciones-fila">
          <button type="button" className="primario" onClick={() => onGuardar(clave)}>
            Guardar clave
          </button>
          <button type="button" className="secundario" onClick={onActualizarTodo}>
            Actualizar todas las parcelas
          </button>
        </div>

        <h3 className="subtitulo">Datos</h3>
        <div className="acciones-fila">
          <button type="button" className="secundario" onClick={onExportar}>
            Exportar parcelas (CSV)
          </button>
        </div>

        <div className="acciones-fila">
          <button type="button" className="enlace" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}
