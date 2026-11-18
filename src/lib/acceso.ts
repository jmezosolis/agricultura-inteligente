/** Acceso en modo local (sin base compartida): se recuerda en este navegador. Es solo una preferencia, no una contraseña. */
const CLAVE = 'agro-acceso-local';

export function leerAccesoLocal(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function guardarAccesoLocal(activo: boolean): void {
  try {
    if (activo) localStorage.setItem(CLAVE, '1');
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento disponible: la sesión dura mientras la página esté abierta */
  }
}
