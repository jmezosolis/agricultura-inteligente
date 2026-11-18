import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export interface Usuario {
  id: string;
  email: string;
}

/** Sesión actual. null si no hay inicio de sesión. */
export function useSesion(): Usuario | null {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const a = (s: { user: { id: string; email?: string } } | null) => setUsuario(s ? { id: s.user.id, email: s.user.email ?? '' } : null);
    void supabase.auth.getSession().then(({ data }) => a(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => a(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return usuario;
}

/** Inicio de sesión o registro con correo y contraseña. Se pide solo al publicar o reservar. */
export function ModalSesion({ motivo, onListo, onCerrar }: { motivo: string; onListo: () => void; onCerrar: () => void }) {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!correo.trim() || clave.length < 8) return setError('Escribe un correo y una contraseña de al menos 8 caracteres.');
    setCargando(true);
    setError(null);
    const credenciales = { email: correo.trim(), password: clave };
    const { error: err } = modo === 'entrar' ? await supabase.auth.signInWithPassword(credenciales) : await supabase.auth.signUp(credenciales);
    setCargando(false);
    if (err) return setError(traducir(err.message));
    if (modo === 'crear') {
      return setError('Cuenta creada. Si tu proyecto pide confirmar el correo, revisa tu bandeja y entra después.');
    }
    onListo();
  };

  return (
    <div className="velo" role="presentation" onClick={onCerrar}>
      <section className="dialogo" role="dialog" aria-modal="true" aria-labelledby="sesion-titulo" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Agricultura Inteligente</p>
        <h2 id="sesion-titulo">{modo === 'entrar' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
        <p className="pequeno texto-suave">{motivo}</p>
        <form onSubmit={(e) => void enviar(e)} noValidate className="formulario-partes">
          <label className="campo">
            <span>Correo</span>
            <input type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} value={clave} onChange={(e) => setClave(e.target.value)} />
          </label>
          {error && (
            <p className="campo-error" role="alert">
              {error}
            </p>
          )}
          <div className="acciones-fila">
            <button type="submit" className="primario" disabled={cargando}>
              {cargando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
            </button>
            <button type="button" className="enlace" onClick={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')}>
              {modo === 'entrar' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function traducir(m: string): string {
  if (/invalid login/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  return m;
}
