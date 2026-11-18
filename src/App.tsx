import { useCallback, useEffect, useState } from 'react';
import { nuevoId, parcelaEjemplo } from './lib/almacen';
import { repositorioLocal } from './data/repositorio';
import { useSesion, ModalSesion } from './auth/Sesion';
import { conBaseCompartida, supabase } from './lib/supabase';
import { listarOfertasCompartidas, publicarOfertaCompartida, reservarOfertaCompartida, liberarOfertaCompartida } from './data/ofertasCompartidas';
import { zonaAproximada } from './lib/privacidad';
import { consultarClima, consultarFuego } from './lib/servicios';
import { centroide, cosechaEstimadaFecha, estimar, hectareas, rangoProduccion } from './lib/modelo';
import { mensaje } from './lib/formato';
import type { Clima, Estado, Fuego, ImagenDron, Manejo, NuevaParcela, Oferta, Parcela, Plaguicida } from './lib/tipos';
import type { DatosParcela } from './components/EditarDatos';
import { Productor } from './components/Productor';
import { Mercado } from './components/Mercado';
import { Ajustes } from './components/Ajustes';
import { useReservas } from './hooks/useReservas';
import { descargarCsv, parcelasACsv } from './lib/exportar';
import { irA, useRuta } from './lib/ruta';
import { leerAccesoLocal, guardarAccesoLocal } from './lib/acceso';
import { LotesPagina } from './components/lotes/LotesPagina';
import { VerificarLote } from './components/lotes/VerificarLote';
import { PlanesPagina } from './components/planes/PlanesPagina';
import { InicioPagina } from './components/inicio/InicioPagina';
import { QuienesPagina } from './components/inicio/QuienesPagina';
import { HerramientasPagina } from './components/herramientas/HerramientasPagina';
import { DeteccionPagina } from './components/deteccion/DeteccionPagina';
import { AccesoPagina } from './components/acceso/AccesoPagina';
import './lotes.css';

// El clima se vuelve a pedir cada 3 h, como la ventana de caché de potreoGPS (24 h para datos satelitales).
const TRES_HORAS = 3 * 60 * 60 * 1000;

/** Pantallas que requieren haber entrado: parcelas, lotes, mercado y herramientas. */
const esRutaDeApp = (r: string) =>
  r === '/campo' || r === '/mercado' || r === '/herramientas' || r === '/enfermedades' || r === '/plantas' || /^\/lotes(\/|$)/.test(r);

export default function App() {
  const [estado, setEstado] = useState<Estado>(() => repositorioLocal.cargar());
  const [ajustes, setAjustes] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(0);
  const usuario = useSesion();
  const [accesoLocal, setAccesoLocal] = useState<boolean>(leerAccesoLocal);
  const [pedirSesion, setPedirSesion] = useState<string | null>(null);
  const ruta = useRuta();
  const verMatch = ruta.match(/^\/verificar\/([^/]+)$/);

  // Con base compartida hay sesión de Supabase; sin ella, la del dispositivo.
  const dentro = conBaseCompartida ? usuario !== null : accesoLocal;

  const rutaEfectiva = ruta === '/' ? (dentro ? '/campo' : '/inicio') : ruta;
  const lotesMatch = rutaEfectiva.match(/^\/lotes(?:\/([^/]+))?$/);
  const enLotes = lotesMatch !== null;
  const enCampo = rutaEfectiva === '/campo';
  const enMercado = rutaEfectiva === '/mercado';
  const enHerramientas = rutaEfectiva === '/herramientas';
  const enEnfermedades = rutaEfectiva === '/enfermedades';
  const enPlantas = rutaEfectiva === '/plantas';
  const enInicio = rutaEfectiva === '/inicio';
  const enQuienes = rutaEfectiva === '/quienes';
  const enPlanes = rutaEfectiva === '/planes';
  const enAcceso = rutaEfectiva === '/acceso';
  const pedirAcceso = !dentro && esRutaDeApp(rutaEfectiva);

  // Con sesión, la pantalla de acceso no tiene sentido: se va a Mis parcelas.
  useEffect(() => {
    if (dentro && enAcceso) irA('/campo');
  }, [dentro, enAcceso]);

  // Con base compartida: las ofertas de todos los productores se cargan al abrir y se actualizan cada minuto.
  useEffect(() => {
    if (!conBaseCompartida) return;
    let vivo = true;
    const cargar = () =>
      listarOfertasCompartidas().then(
        (ofertas) => {
          if (vivo) setEstado((prev) => ({ ...prev, ofertas }));
        },
        (e: unknown) => {
          if (vivo) setAviso(mensaje(e));
        },
      );
    void cargar();
    const id = window.setInterval(cargar, 60_000);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    repositorioLocal.guardar(estado);
  }, [estado]);

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 3500);
    return () => window.clearTimeout(id);
  }, [aviso]);

  const refrescar = useCallback(async (p: Parcela, clave: string) => {
    const centro = centroide(p.anillo);
    let clima: Clima | undefined;
    let climaError: string | undefined;
    let fuego: Fuego | undefined;
    let fuegoError: string | undefined;

    setConsultando((n) => n + 1);
    try {
      clima = await consultarClima(centro);
    } catch (e) {
      climaError = mensaje(e);
    }
    if (clave) {
      try {
        fuego = await consultarFuego(centro, clave);
      } catch (e) {
        fuegoError = mensaje(e);
      }
    }
    setConsultando((n) => n - 1);

    setEstado((prev) => ({
      ...prev,
      parcelas: prev.parcelas.map((x) =>
        x.id === p.id ? { ...x, clima, climaError, fuego, fuegoError } : x,
      ),
    }));
  }, []);

  // Al abrir: actualizar parcelas sin clima o con datos de más de una hora.
  useEffect(() => {
    const ahora = Date.now();
    estado.parcelas.forEach((p) => {
      const viejo = !p.clima || ahora - new Date(p.clima.consultado).getTime() > TRES_HORAS;
      if (viejo) void refrescar(p, estado.firmsKey);
    });
    // Solo al montar: las acciones siguientes disparan su propio refresco.
  }, []);

  const crear = (datos: NuevaParcela) => {
    const p: Parcela = {
      id: nuevoId('p'),
      nombre: datos.nombre,
      cultivo: datos.cultivo,
      siembra: datos.siembra,
      ndvi: datos.ndvi,
      anillo: datos.anillo,
      hectareas: hectareas(datos.anillo),
    };
    setEstado((prev) => ({ ...prev, parcelas: [...prev.parcelas, p] }));
    setAviso('Parcela guardada. Consultando clima…');
    void refrescar(p, estado.firmsKey);
  };

  const cargarDemo = () => {
    const ejemplo = parcelaEjemplo();
    crear(ejemplo);
  };

  const editarDatos = (id: string, datos: DatosParcela) => {
    setEstado((prev) => ({
      ...prev,
      parcelas: prev.parcelas.map((p) => (p.id === id ? { ...p, ...datos } : p)),
    }));
    setAviso('Datos de la parcela guardados.');
  };

  const guardarManejo = (id: string, manejo: Manejo) => {
    setEstado((prev) => ({
      ...prev,
      parcelas: prev.parcelas.map((p) => (p.id === id ? { ...p, manejo } : p)),
    }));
    setAviso('Manejo y cosecha guardados.');
  };

  const cambiarColor = (id: string, color: string) => {
    setEstado((prev) => ({
      ...prev,
      parcelas: prev.parcelas.map((p) => (p.id === id ? { ...p, color } : p)),
    }));
  };

  const eliminar = (id: string) => {
    setEstado((prev) => ({
      ...prev,
      parcelas: prev.parcelas.filter((p) => p.id !== id),
      ofertas: prev.ofertas.filter((o) => o.parcelaId !== id),
    }));
    setAviso('Parcela eliminada.');
  };

  const publicar = (parcelaId: string, precio: number, loteId: string | null) => {
    const p = estado.parcelas.find((x) => x.id === parcelaId);
    if (!p) return;
    if (!estado.telefono) {
      setAviso('Antes de publicar, escribe tu WhatsApp en Ajustes.');
      return;
    }
    if (conBaseCompartida && !usuario) {
      setPedirSesion('Inicia sesión para publicar tu oferta. Así evitamos publicaciones falsas.');
      return;
    }
    const est = estimar(p);
    const lote = loteId ? (estado.lotes.find((l) => l.id === loteId) ?? null) : null;
    const oferta: Oferta = {
      id: nuevoId('o'),
      parcelaId: p.id,
      parcelaNombre: p.nombre,
      cultivo: p.cultivo,
      toneladas: est.total,
      precio,
      estado: 'abierta',
      publicada: new Date().toISOString(),
      rangoT: rangoProduccion(p),
      cosechaEstimada: cosechaEstimadaFecha(p),
      riego: !!p.manejo?.riego,
      variedad: p.manejo?.variedad ?? '',
      // Para compradores se usa la zona aproximada, nunca la ubicación exacta.
      centro: zonaAproximada(centroide(p.anillo)),
      basada: p.manejo?.toneladasReales ? 'real' : 'modelo',
      telefonoProductor: estado.telefono ?? '',
      reserva: null,
      lote: lote ? { id: lote.id, codigo: lote.codigo } : null,
    };
    setEstado((prev) => ({ ...prev, ofertas: [...prev.ofertas, oferta] }));
    if (conBaseCompartida) {
      publicarOfertaCompartida(oferta, usuario?.id ?? '').then(
        () => setAviso('Oferta publicada. Los compradores ya la pueden ver.'),
        (e: unknown) => setAviso(mensaje(e)),
      );
    } else {
      setAviso('Oferta publicada en este dispositivo.');
    }
  };

  const { actualizarOferta: actualizarOfertaDe, reservar: reservarLocal, liberarReserva } = useReservas({ setEstado, setAviso });
  const reservar = (ofertaId: string, comprador: string, telefono: string) => {
    const reserva = { comprador, telefono, fecha: new Date().toISOString() };
    if (conBaseCompartida && !usuario) {
      setPedirSesion('Inicia sesión para reservar. Así el productor sabe con quién trata.');
      return;
    }
    if (conBaseCompartida) {
      reservarOfertaCompartida(ofertaId, { ...reserva, comprador_uid: usuario?.id ?? '' }).then(
        () => reservarLocal(ofertaId, comprador, telefono),
        (e: unknown) => setAviso(mensaje(e)),
      );
    } else {
      reservarLocal(ofertaId, comprador, telefono);
    }
  };
  const actualizarOferta = (parcelaId: string) => actualizarOfertaDe(parcelaId, estado);

  const liberarOferta = (ofertaId: string) => {
    if (!conBaseCompartida) return liberarReserva(ofertaId);
    liberarOfertaCompartida(ofertaId).then(
      () => liberarReserva(ofertaId),
      (e: unknown) => setAviso(mensaje(e)),
    );
  };

  const guardarTelefono = (telefono: string) => {
    setEstado((prev) => ({ ...prev, telefono }));
    setAviso('WhatsApp guardado.');
  };

  const guardarClave = (clave: string) => {
    setEstado((prev) => ({ ...prev, firmsKey: clave }));
    setAviso(clave ? 'Clave guardada.' : 'Clave eliminada.');
  };

  // Registro de imágenes de dron importadas: solo se guarda el nombre, tamaño y parcela.
  const agregarImagenDron = (imagen: ImagenDron) => {
    setEstado((prev) => ({ ...prev, imagenesDron: [...(prev.imagenesDron ?? []), imagen] }));
    setAviso(`Imagen ${imagen.nombre} registrada.`);
  };

  // Catálogo de plaguicidas: un producto por código de barras; si ya existe, se actualiza.
  const catalogarPlaguicida = (p: Plaguicida) => {
    setEstado((prev) => ({ ...prev, plaguicidas: [...prev.plaguicidas.filter((x) => x.gtin !== p.gtin), p] }));
  };

  const entrarLocal = () => {
    guardarAccesoLocal(true);
    setAccesoLocal(true);
    irA('/campo');
  };

  const cerrarSesion = () => {
    if (conBaseCompartida) {
      void supabase?.auth.signOut();
    } else {
      guardarAccesoLocal(false);
      setAccesoLocal(false);
    }
    irA('/inicio');
  };

  if (verMatch) {
    return (
      <div className="app">
        <header className="cabecera">
          <div className="marca">
            <img className="sello" src="/icono-blanco.png" alt="" aria-hidden="true" width={40} height={40} />
            <div>
              <h1>Agricultura Inteligente</h1>
            </div>
          </div>
        </header>
        <main className="principal">
          <VerificarLote codigo={decodeURIComponent(verMatch[1])} lotes={estado.lotes} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="cabecera">
        <div className="marca">
          <img className="sello" src="/icono-blanco.png" alt="" aria-hidden="true" width={40} height={40} />
          <div>
            <h1>Agricultura Inteligente</h1>
          </div>
        </div>

        {dentro ? (
          <>
            <div className="segmento" role="tablist" aria-label="Secciones">
              <button role="tab" aria-selected={enCampo} className={enCampo ? 'activo' : ''} onClick={() => irA('/campo')}>
                Parcelas
              </button>
              <button role="tab" aria-selected={enEnfermedades} className={enEnfermedades ? 'activo' : ''} onClick={() => irA('/enfermedades')}>
                Detectar enfermedades
              </button>
              <button role="tab" aria-selected={enPlantas} className={enPlantas ? 'activo' : ''} onClick={() => irA('/plantas')}>
                Detectar plantas
              </button>
            </div>
            <button type="button" className="icono-ajustes" onClick={() => setAjustes(true)} aria-label="Ajustes" title="Ajustes">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <button type="button" className="ghost" onClick={cerrarSesion} title={usuario?.email ?? 'Cerrar sesión'}>
              Salir
            </button>
          </>
        ) : (
          <>
            <div className="segmento" role="tablist" aria-label="Secciones">
              <button role="tab" aria-selected={enInicio} className={enInicio ? 'activo' : ''} onClick={() => irA('/inicio')}>
                Inicio
              </button>
              <button role="tab" aria-selected={enQuienes} className={enQuienes ? 'activo' : ''} onClick={() => irA('/quienes')}>
                Quiénes somos
              </button>
              <button role="tab" aria-selected={enPlanes} className={enPlanes ? 'activo' : ''} onClick={() => irA('/planes')}>
                Planes
              </button>
            </div>
            <button type="button" className="ghost" onClick={() => irA('/acceso')}>
              Iniciar sesión
            </button>
          </>
        )}
      </header>

      <main className="principal">
        {pedirAcceso || enAcceso ? (
          <AccesoPagina onEntrarLocal={entrarLocal} onListo={() => { setPedirSesion(null); irA('/campo'); }} />
        ) : enInicio ? (
          <InicioPagina />
        ) : enQuienes ? (
          <QuienesPagina />
        ) : enPlanes ? (
          <PlanesPagina />
        ) : enHerramientas ? (
          <HerramientasPagina parcelas={estado.parcelas} imagenes={estado.imagenesDron ?? []} onAgregarImagen={agregarImagenDron} />
        ) : enEnfermedades ? (
          <DeteccionPagina modo="enfermedad" parcelas={estado.parcelas} />
        ) : enPlantas ? (
          <DeteccionPagina modo="planta" parcelas={estado.parcelas} />
        ) : enLotes ? (
          <LotesPagina
            id={lotesMatch?.[1]}
            parcelas={estado.parcelas}
            lotes={estado.lotes}
            plaguicidas={estado.plaguicidas}
            onCatalogar={catalogarPlaguicida}
            onCrear={(lote) => {
              setEstado((prev) => ({ ...prev, lotes: [...prev.lotes, lote] }));
              setAviso(`Lote ${lote.codigo} creado.`);
              irA(`/lotes/${lote.id}`);
            }}
            onAgregar={(loteId, evento) => {
              setEstado((prev) => ({
                ...prev,
                lotes: prev.lotes.map((l) => (l.id === loteId ? { ...l, eventos: [...l.eventos, evento] } : l)),
              }));
              setAviso('Registro guardado en el historial.');
            }}
          />
        ) : enMercado ? (
          <Mercado
            ofertas={estado.ofertas}
            onReservar={(ofertaId, comprador, telefono) => reservar(ofertaId, comprador, telefono)}
          />
        ) : (
          <>
            <nav className="accesos-campo" aria-label="Más secciones">
              <button type="button" onClick={() => irA('/lotes')}>
                Lotes y trazabilidad
              </button>
              <button type="button" onClick={() => irA('/mercado')}>
                Mercado
              </button>
              <button type="button" onClick={() => irA('/herramientas')}>
                Dron y cosecha
              </button>
            </nav>
          <Productor
            parcelas={estado.parcelas}
            ofertas={estado.ofertas}
            lotes={estado.lotes}
            cargando={consultando > 0}
            onCrear={crear}
            onEliminar={eliminar}
            onPublicar={publicar}
            onCambiarColor={cambiarColor}
            onGuardarManejo={guardarManejo}
            onEditarDatos={editarDatos}
            onActualizarOferta={actualizarOferta}
            onLiberarReserva={liberarOferta}
            onActualizar={(p) => void refrescar(p, estado.firmsKey)}
            onDemo={cargarDemo}
          />
          </>
        )}
      </main>

      <footer className="pie-app">
        <div className="pie-marca">
          <strong>Agricultura Inteligente</strong>
          <span>Inteligencia satelital a tu alcance</span>
        </div>
        <nav className="pie-enlaces" aria-label="Pie de página">
          <a href="#/soporte">Soporte</a>
          <a href="#/legales">Legales</a>
          <span className="pie-version">V1.4.0</span>
        </nav>
        <p className="pie-copia">© 2026 Agricultura Inteligente</p>
      </footer>

      {pedirSesion && (
        <ModalSesion
          motivo={pedirSesion}
          onCerrar={() => setPedirSesion(null)}
          onListo={() => {
            setPedirSesion(null);
            setAviso('Sesión iniciada. Vuelve a intentarlo.');
          }}
        />
      )}

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}

      {ajustes && (
        <Ajustes
          claveActual={estado.firmsKey}
          telefono={estado.telefono ?? ''}
          onGuardarTelefono={guardarTelefono}
          onGuardar={guardarClave}
          onActualizarTodo={() => estado.parcelas.forEach((p) => void refrescar(p, estado.firmsKey))}
          onExportar={() => descargarCsv('parcelas_agrointeligencia.csv', parcelasACsv(estado.parcelas))}
          onCerrar={() => setAjustes(false)}
        />
      )}
    </div>
  );
}
