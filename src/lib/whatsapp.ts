/** Deja solo dígitos y agrega la clave de México (52) si el número tiene 10 dígitos. */
export function numeroWhatsapp(entrada: string): string | null {
  const solo = entrada.replace(/\D/g, '');
  if (solo.length === 10) return '52' + solo;
  if (solo.length === 12 && solo.startsWith('52')) return solo;
  return null;
}

/** Enlace directo a un chat de WhatsApp con un mensaje ya escrito. */
export function enlaceWhatsapp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
