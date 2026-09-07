/**
 * Página pública para confirmar asistencia al evento (por familia)
 * Cada familia puede agregar varias personas (adultos y niños).
 * Para los niños se solicita la edad.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Evento } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/format';

interface PersonaForm {
  key: number;
  nombre: string;
  tipo: 'adulto' | 'nino';
  edad: string; // Cadena para controlar el input de forma sencilla
}

export default function ConfirmarAsistencia() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  const [nombreFamilia, setNombreFamilia] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [invitacionToken, setInvitacionToken] = useState('');
  const [personas, setPersonas] = useState<PersonaForm[]>([
    { key: 1, nombre: '', tipo: 'adulto', edad: '' },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(1); // 1: familia, 2: asistentes, 3: notas y confirmar
  const [personaActiva, setPersonaActiva] = useState<number | null>(1);
  const cardFormRef = useRef<HTMLDivElement>(null);
  const [exito, setExito] = useState<{
    nombreFamilia: string;
    adultos: number;
    ninos: number;
  } | null>(null);

  useEffect(() => {
    cargarEvento();
  }, []);

  // Si llegó desde un enlace de invitación (?familia=&token=), precargar los datos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const familiaParam = params.get('familia');
    if (familiaParam) setNombreFamilia(familiaParam);
    const tokenParam = params.get('token');
    if (tokenParam) setInvitacionToken(tokenParam);
  }, []);

  const cargarEvento = async () => {
    try {
      const response = await api.getEvento();
      setEvento(response.data);
    } catch (error) {
      console.error('Error al cargar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const siguienteKey = () =>
    personas.reduce((max, p) => Math.max(max, p.key), 0) + 1;

  const agregarPersona = () => {
    // No se permite agregar más invitados si alguno no tiene nombre aún
    const incompleta = personas.find((p) => !p.nombre.trim());
    if (incompleta) {
      const pos = personas.indexOf(incompleta) + 1;
      setError(
        `Primero completa el nombre de la persona ${pos} antes de agregar a otra persona.`
      );
      setPersonaActiva(incompleta.key);
      setTimeout(() => {
        document.getElementById(`asistente-nombre-${incompleta.key}`)?.focus();
        document.getElementById(`asistente-card-${incompleta.key}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 80);
      return;
    }
    const key = siguienteKey();
    setPersonas([...personas, { key, nombre: '', tipo: 'adulto', edad: '' }]);
    setPersonaActiva(key);
    setError('');
    // Enfocar y centrar la nueva persona para no perder la referencia visual
    setTimeout(() => {
      document.getElementById(`asistente-nombre-${key}`)?.focus();
      document.getElementById(`asistente-card-${key}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  };

  const eliminarPersona = (key: number) => {
    if (personas.length === 1) {
      setError('Debe haber al menos 1 persona. Si te equivocaste, edita los datos.');
      return;
    }
    const restantes = personas.filter((p) => p.key !== key);
    if (personaActiva === key) {
      setPersonaActiva(restantes[0]?.key ?? null);
    }
    setPersonas(restantes);
  };

  // Solo una persona "abierta" a la vez (colapsa las demás para no alargar el formulario)
  const togglePersona = (key: number) =>
    setPersonaActiva((actual) => (actual === key ? null : key));

  const actualizarPersona = (
    key: number,
    campo: keyof PersonaForm,
    valor: string
  ) => {
    setPersonas(
      personas.map((p) => {
        if (p.key !== key) return p;
        if (campo === 'tipo') {
          return {
            ...p,
            tipo: valor as 'adulto' | 'nino',
            edad: valor === 'adulto' ? '' : p.edad,
          };
        }
        return { ...p, [campo]: valor };
      })
    );
  };

  const validarFamilia = (): string =>
    nombreFamilia.trim()
      ? ''
      : 'Ingresa el nombre de la familia (ej: "Familia Pérez").';

  const validarPersonas = (): string => {
    if (personas.length === 0) {
      return 'Debes confirmar al menos 1 persona.';
    }
    for (const p of personas) {
      if (!p.nombre.trim()) {
        return 'Todas las personas deben tener un nombre.';
      }
      if (p.tipo === 'nino') {
        const edad = Number(p.edad);
        if (p.edad === '' || Number.isNaN(edad)) {
          return `Indica la edad de ${p.nombre.trim() || 'el niño/a'}.`;
        }
        if (!Number.isInteger(edad) || edad < 0 || edad > 13) {
          return `La edad de ${p.nombre.trim()} debe ser un número entre 0 y 13 años (mayores de 13 se consideran adultos).`;
        }
      }
    }
    return '';
  };

  const validar = (): string => validarFamilia() || validarPersonas();

  const contarAdultos = () =>
    personas.filter((p) => p.nombre.trim() && p.tipo === 'adulto').length;
  const contarNinos = () =>
    personas.filter((p) => p.nombre.trim() && p.tipo === 'nino').length;

  // Posiciona la vista sobre la tarjeta del formulario al cambiar de paso
  const scrollAlFormulario = () => {
    setTimeout(() => {
      cardFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const avanzarPaso = () => {
    const errorPaso = paso === 1 ? validarFamilia() : validarPersonas();
    if (errorPaso) {
      setError(errorPaso);
      scrollAlFormulario();
      return;
    }
    setError('');
    setPaso((p) => Math.min(p + 1, 2));
    scrollAlFormulario();
  };

  const irAtras = () => {
    setError('');
    setPaso((p) => Math.max(p - 1, 1));
    scrollAlFormulario();
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    // Al presionar Enter (o intentar enviar) antes del último paso, avanzamos
    if (paso < 2) {
      avanzarPaso();
      return;
    }
    setError('');

    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    try {
      const response = await api.confirmarAsistencia({
        nombreFamilia: nombreFamilia.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        invitacionToken: invitacionToken || undefined,
        asistentes: personas.map((p) => ({
          nombre: p.nombre.trim(),
          tipo: p.tipo,
          edad: p.tipo === 'nino' ? Number(p.edad) : null,
        })),
      });
      setExito({
        nombreFamilia: response.data.nombreFamilia,
        adultos: response.data.adultos,
        ninos: response.data.ninos,
      });
    } catch (err: any) {
      setError(err.message || 'Error al confirmar asistencia. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setExito(null);
    setNombreFamilia('');
    setEmail('');
    setTelefono('');
    setPersonas([{ key: 1, nombre: '', tipo: 'adulto', edad: '' }]);
    setInvitacionToken('');
    setPaso(1);
    setPersonaActiva(1);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error al cargar el evento</p>
      </div>
    );
  }

  // Pantalla de éxito
  if (exito) {
    return (
      <div className="min-h-screen bg-soft-gray py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
            <div className="text-6xl mb-6">💌</div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4 section-decoration">
              ¡Gracias, {exito.nombreFamilia}!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Confirmamos la asistencia de{' '}
              <strong className="text-pastel-pink">
                {exito.adultos} adulto{exito.adultos !== 1 ? 's' : ''}
              </strong>{' '}
              y{' '}
              <strong className="text-pastel-lavender">
                {exito.ninos} niño{exito.ninos !== 1 ? 's' : ''}
              </strong>
              .
            </p>
            <p className="text-gray-600 mb-8">
              ¡Los esperamos el {formatDate(evento.fecha)} a las {evento.hora} en{' '}
              {evento.lugar}!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/regalos" className="btn-primary inline-block">
                Ver lista de regalos 🎁
              </Link>
              <button onClick={resetForm} className="btn-secondary inline-block">
                Confirmar otra familia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4 section-decoration">
            Confirmar asistencia
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Cuéntanos quiénes de tu familia nos acompañarán en el bautizo de{' '}
            {evento.nombreMelliza1} y {evento.nombreMelliza2}.💝
          </p>
          <p className="text-pastel-pink font-medium mt-3">
            📅 {formatDate(evento.fecha)} · 🕐 {evento.hora} · 📍 {evento.lugar}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8" ref={cardFormRef}>
          <form onSubmit={enviar} className="space-y-6">
            {/* Indicador de progreso por pasos */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { n: 1, label: 'Familia' },
                { n: 2, label: 'Asistentes' },
              ].map(({ n, label }) => (
                <button
                  key={n}
                  type="button"
                  disabled={paso < n}
                  onClick={() => {
                    setError('');
                    setPaso(n);
                    scrollAlFormulario();
                  }}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    paso === n
                      ? 'bg-pastel-pink text-white shadow-sm'
                      : paso > n
                        ? 'bg-pastel-pink/15 text-pastel-pink hover:bg-pastel-pink/30'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      paso > n ? 'bg-pastel-pink text-white' : ''
                    }`}
                  >
                    {paso > n ? '✓' : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {paso === 1 && (
              <>
            {/* Datos de la familia */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Nombre de la familia *
              </label>
              <input
                type="text"
                value={nombreFamilia}
                onChange={(e) => setNombreFamilia(e.target.value)}
                placeholder="Ej: Familia Pérez"
                className="input-field"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@email.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="input-field"
                />
              </div>
            </div>
              </>
            )}

            {paso === 2 && (
              <>
            {/* Lista de personas */}
            <div>
              <div className="mb-3">
                <label className="block text-gray-700 font-medium">
                  ¿Quiénes asistirán? *
                </label>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    👤 {contarAdultos()} adulto{contarAdultos() !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                    🧒 {contarNinos()} niño{contarNinos() !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {personas.map((p, idx) => {
                  const abierta = personaActiva === p.key;
                  const nombre = p.nombre.trim();
                  const resumen =
                    p.tipo === 'adulto'
                      ? 'Adulto'
                      : `Niño/a${p.edad ? ` · ${p.edad} año${Number(p.edad) !== 1 ? 's' : ''}` : ''}`;
                  return (
                    <div
                      key={p.key}
                      id={`asistente-card-${p.key}`}
                      className={`border-2 rounded-xl transition-colors ${
                        abierta
                          ? 'border-pastel-pink bg-white shadow-sm'
                          : 'border-gray-100 bg-gray-50/60'
                      }`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => togglePersona(p.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            togglePersona(p.key);
                          }
                        }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              abierta
                                ? 'bg-pastel-pink text-white'
                                : 'bg-white text-gray-500 border border-gray-200'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                nombre ? 'text-gray-800' : 'text-gray-400'
                              }`}
                            >
                              {nombre || `Persona ${idx + 1}`}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {resumen}
                              {abierta ? ' · completando…' : ''}
                            </span>
                          </span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarPersona(p.key);
                            }}
                            className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1"
                            title="Quitar persona"
                          >
                            Quitar
                          </button>
                          <span
                            className={`text-gray-400 text-xs transition-transform ${
                              abierta ? 'rotate-180' : ''
                            }`}
                          >
                            ▾
                          </span>
                        </span>
                      </div>

                      {abierta && (
                        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
                          <div className="grid md:grid-cols-3 gap-3">
                            <input
                              id={`asistente-nombre-${p.key}`}
                              type="text"
                              value={p.nombre}
                              onChange={(e) =>
                                actualizarPersona(p.key, 'nombre', e.target.value)
                              }
                              placeholder="Nombre"
                              className="input-field"
                            />
                            <select
                              value={p.tipo}
                              onChange={(e) =>
                                actualizarPersona(p.key, 'tipo', e.target.value)
                              }
                              className="input-field"
                            >
                              <option value="adulto">Adulto</option>
                              <option value="nino">Niño/a</option>
                            </select>
                            {p.tipo === 'nino' ? (
                              <input
                                type="number"
                                min={0}
                                max={13}
                                value={p.edad}
                                onChange={(e) =>
                                  actualizarPersona(p.key, 'edad', e.target.value)
                                }
                                placeholder="Edad *"
                                className="input-field"
                              />
                            ) : (
                              <div className="flex items-center text-gray-400 text-sm px-3">
                                ✓ Adulto (sin edad)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Si confirmas un niño/a, su edad es obligatoria (0 a 13 años). Mayores de 13 se consideran adultos.
              </p>

              <button
                type="button"
                onClick={agregarPersona}
                disabled={personas.some((per) => !per.nombre.trim())}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-dashed border-pastel-pink/60 text-pastel-pink rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-pastel-pink/10 disabled:opacity-40 disabled:cursor-not-allowed mt-3"
              >
                ＋ Agregar otra persona
              </button>
              {personas.some((per) => !per.nombre.trim()) && (
                <p className="text-xs text-amber-600 mt-1.5">
                  Completa el nombre del invitado en edición para poder agregar a otro.
                </p>
              )}

              {/* Resumen previo a confirmar */}
              <div className="rounded-xl border border-pastel-pink/30 bg-pink-50/70 p-4 space-y-1.5 mt-4">
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  Resumen de tu confirmación
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Familia:</strong> {nombreFamilia}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-pastel-pink/40 text-pastel-pink font-medium">
                    👤 {contarAdultos()} adulto{contarAdultos() !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-pastel-lavender text-pastel-lavender font-medium">
                    🧒 {contarNinos()} niño{contarNinos() !== 1 ? 's' : ''}
                  </span>
                </div>
                {(email.trim() || telefono.trim()) && (
                  <p className="text-xs text-gray-500">
                    {email.trim() && <><strong>Email:</strong> {email.trim()}</>}
                    {email.trim() && telefono.trim() && ' · '}
                    {telefono.trim() && <><strong>Tel:</strong> {telefono.trim()}</>}
                  </p>
                )}
                <p className="text-xs text-gray-500 pt-1">
                  Revisa y presiona "Confirmar asistencia" para enviar.
                </p>
              </div>
            </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-100 pt-5">
              {paso > 1 && (
                <button
                  type="button"
                  onClick={irAtras}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  ← Volver
                </button>
              )}
              {paso < 2 ? (
                <button
                  type="button"
                  onClick={avanzarPaso}
                  className="btn-primary flex-1"
                >
                  Continuar →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn-primary flex-1"
                >
                  {enviando ? 'Enviando...' : 'Confirmar asistencia 💌'}
                </button>
              )}
            </div>
            <p className="text-center text-xs text-gray-400">
              Paso {paso} de 2 ·{' '}
              {paso === 1 ? 'Datos de la familia' : 'Asistentes y confirmación'}
            </p>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-500 hover:text-pastel-pink text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}