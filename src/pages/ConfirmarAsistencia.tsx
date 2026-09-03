/**
 * Página pública para confirmar asistencia al evento (por familia)
 * Cada familia puede agregar varias personas (adultos y niños).
 * Para los niños se solicita la edad.
 */

import { useEffect, useState } from 'react';
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
  const [mensaje, setMensaje] = useState('');
  const [personas, setPersonas] = useState<PersonaForm[]>([
    { key: 1, nombre: '', tipo: 'adulto', edad: '' },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState<{
    nombreFamilia: string;
    adultos: number;
    ninos: number;
  } | null>(null);

  useEffect(() => {
    cargarEvento();
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
    setPersonas([
      ...personas,
      { key: siguienteKey(), nombre: '', tipo: 'adulto', edad: '' },
    ]);
    setError('');
  };

  const eliminarPersona = (key: number) => {
    if (personas.length === 1) {
      setError('Debe haber al menos 1 persona. Si te equivocaste, edita los datos.');
      return;
    }
    setPersonas(personas.filter((p) => p.key !== key));
  };

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

  const validar = (): string => {
    if (!nombreFamilia.trim()) {
      return 'Ingresa el nombre de la familia (ej: "Familia Pérez").';
    }
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

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
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
        mensaje: mensaje.trim() || undefined,
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
    setMensaje('');
    setPersonas([{ key: 1, nombre: '', tipo: 'adulto', edad: '' }]);
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
            {evento.nombreGemela1} y {evento.nombreGemela2}.💝
          </p>
          <p className="text-pastel-pink font-medium mt-3">
            📅 {formatDate(evento.fecha)} · 🕐 {evento.hora} · 📍 {evento.lugar}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={enviar} className="space-y-6">
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
            {/* Lista de personas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-gray-700 font-medium">
                  ¿Quiénes asistirán? *
                </label>
                <button
                  type="button"
                  onClick={agregarPersona}
                  className="text-sm bg-pastel-pink text-white px-3 py-1.5 rounded-full hover:bg-pastel-lavender transition-colors"
                >
                  + Agregar persona
                </button>
              </div>

              <div className="space-y-3">
                {personas.map((p) => (
                  <div
                    key={p.key}
                    className="border-2 border-gray-100 rounded-xl p-4 bg-gray-50/60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Persona
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarPersona(p.key)}
                        className="text-red-400 hover:text-red-600 text-sm font-medium"
                        title="Quitar persona"
                      >
                        ✕ Quitar
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <input
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
                          Adulto
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Si confirmas un niño/a, su edad es obligatoria (0 a 13 años). Mayores de 13 se consideran adultos.
              </p>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Mensaje o notas (opcional)
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Alergias, necesidad de silla, etc."
                className="input-field"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="btn-primary w-full"
            >
              {enviando ? 'Enviando...' : 'Confirmar asistencia 💌'}
            </button>
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