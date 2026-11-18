import { useEffect, useState } from 'react';

/** Rutas con hash (#/potreros, #/potreros/:id). Sin dependencias: funcionan en cualquier hosting estático. */
function leer(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

export function irA(ruta: string) {
  if (window.location.hash === `#${ruta}`) return;
  window.location.hash = ruta;
}

export function useRuta(): string {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const cambio = () => setRuta(leer());
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return ruta;
}

/** Devuelve el id de /potreros/:id o null. */
export function idDeRuta(ruta: string): string | null {
  const m = ruta.match(/^\/potreros\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
