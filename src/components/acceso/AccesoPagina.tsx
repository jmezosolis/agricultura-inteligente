import { ModalSesion } from '../../auth/Sesion';
import { conBaseCompartida } from '../../lib/supabase';
import { irA } from '../../lib/ruta';
import '../../acceso.css';

interface Props {
  onEntrarLocal: () => void;
  onListo: () => void;
}

/** Acceso: con base compartida pide correo y contraseña; sin ella ofrece entrar en este dispositivo. */
export function AccesoPagina({ onEntrarLocal, onListo }: Props) {
  if (conBaseCompartida) {
    return (
      <section className="acceso">
        <p className="eyebrow">Acceso</p>
        <h1>Entra a tu campo</h1>
        <p className="texto-suave">Inicia sesión o crea tu cuenta para ver tus parcelas, lotes y ofertas.</p>
        <ModalSesion motivo="Tus datos se sincronizan con tu cuenta." onListo={onListo} onCerrar={() => irA('/inicio')} />
      </section>
    );
  }

  return (
    <section className="acceso">
      <p className="eyebrow">Acceso</p>
      <h1>Entra a tu campo</h1>
      <p className="texto-suave">Elige cómo quieres usar Agricultura Inteligente.</p>

      <div className="acceso-tarjeta">
        <h2>Usar en este dispositivo</h2>
        <p className="pequeno texto-suave">
          Tus parcelas, lotes y ofertas se guardan en este navegador. No hay contraseña ni sincronización entre dispositivos.
        </p>
        <button type="button" className="primario ancho" onClick={onEntrarLocal}>
          Entrar en este dispositivo
        </button>
      </div>

      <div className="acceso-tarjeta bloqueada" aria-disabled="true">
        <h2>Iniciar sesión o crear cuenta</h2>
        <p className="pequeno texto-suave">
          No disponible todavía: falta conectar la base compartida (Supabase) con sus claves de acceso.
        </p>
        <button type="button" className="secundario ancho" disabled>
          Próximamente
        </button>
      </div>
    </section>
  );
}
