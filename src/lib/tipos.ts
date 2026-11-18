export type Cultivo = 'maiz' | 'cebada' | 'hortalizas';

/** Posición en orden [longitud, latitud], igual que GeoJSON. */
export type Posicion = [number, number];

export const CULTIVOS: Record<
  Cultivo,
  {
    nombre: string;
    tHa: number;
    ndviRef: number;
    cicloDias: number;
    /** true solo si tHa sale de un modelo calibrado con datos oficiales (SIAP Morelos). */
    calibrado: boolean;
  }
> = {
  // tHa son rendimientos base SUPUESTOS salvo el maíz: calibrar con SIAP antes de usar en contratos.
  // cicloDias es una referencia aproximada de siembra a cosecha; varía por variedad y clima.
  maiz: { nombre: 'Maíz', tHa: 4.0, ndviRef: 0.7, cicloDias: 120, calibrado: true },
  cebada: { nombre: 'Cebada', tHa: 3.0, ndviRef: 0.65, cicloDias: 110, calibrado: false },
  // Un solo valor para seis hortalizas distintas: es una cifra general, no de una especie.
  hortalizas: { nombre: 'Hortalizas', tHa: 15.0, ndviRef: 0.6, cicloDias: 70, calibrado: false },
};

/** Estado de la parcela según su siembra, igual que el estado de un potrero en potreoGPS. */
export type EstadoParcela = 'sin-sembrar' | 'en-cultivo' | 'lista';

export interface Clima {
  lluvia14: number;
  tmin: number;
  tmax: number;
  consultado: string;
}

export interface Fuego {
  focos7d: number;
  consultado: string;
}

/** Azules de la paleta de GanaID. Cada parcela puede tomar uno para distinguirla en el mapa. */
export const PALETA_PARCELAS = [
  '#0F2A4A', // marino
  '#24487A', // azul medio
  '#2F6DB5', // azul vivo
  '#5E7593', // gris azulado
  '#7FA7D6', // celeste
  '#B9D0EA', // hielo
] as const;

export interface Parcela {
  id: string;
  nombre: string;
  /** Color elegido por el usuario; si no existe, se asigna uno de la paleta según el id. */
  color?: string;
  cultivo: Cultivo;
  siembra: string | null;
  /** NDVI actual capturado a mano; null si no se conoce. */
  ndvi: number | null;
  /** Anillo del polígono sin repetir el primer punto. */
  anillo: Posicion[];
  hectareas: number;
  clima?: Clima;
  climaError?: string;
  fuego?: Fuego;
  fuegoError?: string;
  manejo?: Manejo;
}

/** Datos de manejo y cosecha real: lo que el productor registra y sirve para validar y entrenar el modelo. */
export interface Manejo {
  riego: boolean;
  variedad: string;
  /** Plantas por hectárea. */
  densidad: number | null;
  /** Kilos de nitrógeno por hectárea. */
  nitrogenoKgHa: number | null;
  /** Número de riegos en el ciclo (solo si hay riego). */
  riegos: number | null;
  /** Fecha de cosecha real, AAAA-MM-DD. */
  fechaCosecha: string | null;
  /** Toneladas cosechadas en total, medidas (báscula o pesada). */
  toneladasReales: number | null;
}

export interface Oferta {
  id: string;
  parcelaId: string;
  parcelaNombre: string;
  cultivo: Cultivo;
  toneladas: number;
  precio: number;
  estado: 'abierta' | 'reservada';
  publicada: string;
  /** WhatsApp del productor al publicar. */
  telefonoProductor: string;
  /** Comprador que reservó, si existe. */
  reserva: Reserva | null;
  /** Rango de producción (t) según el error del modelo. */
  rangoT: [number, number];
  /** Fecha estimada de cosecha (AAAA-MM-DD) o null si no hay siembra. */
  cosechaEstimada: string | null;
  riego: boolean;
  variedad: string;
  /** Centro de la parcela [lon, lat], para ubicar la oferta. */
  centro: Posicion;
  /** Fuente del dato: 'modelo' si solo hay estimación, 'real' si el productor ya registró la cosecha. */
  basada: 'modelo' | 'real';
  /** Lote de trazabilidad que se vende con esta oferta. Opcional: las ofertas anteriores no lo tienen. */
  lote?: { id: string; codigo: string } | null;
}

/** Reserva de una oferta por un comprador. El contacto final se hace por WhatsApp. */
export interface Reserva {
  comprador: string;
  /** WhatsApp del comprador, solo dígitos (10 a 13). */
  telefono: string;
  fecha: string;
}

/** Imagen de dron importada a una parcela. Solo se guarda el registro; el análisis automático está pendiente. */
export interface ImagenDron {
  id: string;
  parcelaId: string;
  nombre: string;
  tamanoKb: number;
  fecha: string;
}

export interface Estado {
  parcelas: Parcela[];
  ofertas: Oferta[];
  /** Lotes de hortalizas con su historial de trazabilidad. */
  lotes: Lote[];
  /** Catálogo de plaguicidas escaneados o capturados por el productor. */
  plaguicidas: Plaguicida[];
  /** Registro de imágenes de dron importadas (opcional: las versiones anteriores no lo tienen). */
  imagenesDron?: ImagenDron[];
  firmsKey: string;
  /** WhatsApp del productor, solo dígitos. Lo ven los compradores al contactar. */
  telefono?: string;
}

export interface NuevaParcela {
  nombre: string;
  cultivo: Cultivo;
  siembra: string | null;
  ndvi: number | null;
  anillo: Posicion[];
}


/* ───────────── Trazabilidad de hortalizas ───────────── */

export const HORTALIZAS = ['Jitomate', 'Cebolla', 'Chile', 'Calabacita', 'Pepino', 'Lechuga'] as const;
export type Hortaliza = (typeof HORTALIZAS)[number];

export const TIPOS_EVENTO = {
  siembra: 'Siembra',
  riego: 'Riego',
  fertilizante: 'Fertilización',
  plaguicida: 'Control de plagas',
  cosecha: 'Cosecha',
  entrega: 'Entrega al comprador',
} as const;
export type TipoEvento = keyof typeof TIPOS_EVENTO;

/** Datos de una aplicación de plaguicida que la etiqueta exige registrar. */
export interface Carencia {
  producto: string;
  /** Días de periodo de carencia que indica la etiqueta. */
  dias: number;
  /** Código de barras (GTIN) del envase, si se escaneó. */
  gtin?: string;
  ingrediente?: string;
  /** Número de registro del producto ante COFEPRIS. */
  registro?: string;
  dosis?: string;
  superficieHa?: number;
  responsable?: string;
}

/** Producto del catálogo local de plaguicidas, identificado por su código de barras. */
export interface Plaguicida {
  gtin: string;
  producto: string;
  ingrediente: string;
  registro: string;
  /** Último periodo de carencia usado con este producto; se propone al volver a aplicarlo. */
  carenciaDias: number;
}

/** Un hecho registrado en la vida del lote: siembra, riego, aplicación de insumo, cosecha o entrega. */
export interface EventoLote {
  id: string;
  tipo: TipoEvento;
  /** Fecha del hecho, AAAA-MM-DD. */
  fecha: string;
  /** Texto libre: producto, dosis, comprador, etc. */
  detalle: string;
  /** Kilos, solo en la cosecha. */
  kg?: number;
  /** Solo en plaguicidas: producto y días de periodo de carencia que indica su etiqueta. */
  carencia?: Carencia;
  /** Momento en que se registró en la app (ISO). */
  registrado: string;
}

export interface Lote {
  id: string;
  /** Código público que va en el QR, por ejemplo JIT-261107-001. */
  codigo: string;
  parcelaId: string;
  /** Nombre de la parcela al crear el lote (por si luego se renombra). */
  parcelaNombre: string;
  hortaliza: Hortaliza;
  variedad: string;
  fechaSiembra: string;
  creado: string;
  eventos: EventoLote[];
}
