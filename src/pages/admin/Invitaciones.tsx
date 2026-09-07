/**
 * Panel admin: invitaciones por familia
 * Cada invitación tiene un enlace único /invitacion para compartir por WhatsApp
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Invitacion } from '../../types';

interface FormInvitacion {
  familia: string;
  contacto: string;
  telefono: string;
  asistentes: string;
  modalidad: 'familiar' | 'pareja' | 'individual' | 'adulto-hijos';
  parejaNombre1: string;
  parejaNombre2: string;
}

const FORM_VACIO: FormInvitacion = {
  familia: '',
  contacto: '',
  telefono: '',
  asistentes: '',
  modalidad: 'familiar',
  parejaNombre1: '',
  parejaNombre2: '',
};

type EstadoFiltro = 'todos' | Invitacion['estado'];

const ETIQUETA_ESTADO: Record<Invitacion['estado'], string> = {
  pendiente: 'Pendiente',
  enviada: 'Enviada',
  confirmada: 'Confirmada',
};

const COLOR_ESTADO: Record<Invitacion['estado'], string> = {
  pendiente: 'bg-gray-100 text-gray-600',
  enviada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
};

const ETIQUETA_MODALIDAD: Record<Invitacion['modalidad'], string> = {
  familiar: '👨‍👩‍👧 Familiar',
  pareja: '👫 Pareja (sin niños)',
  individual: '🙋 Individual',
  'adulto-hijos': '🧑‍🧒 Adulto + hijos',
};

const COLOR_MODALIDAD: Record<Invitacion['modalidad'], string> = {
  familiar: 'bg-gray-100 text-gray-500',
  pareja: 'bg-teal-100 text-teal-700',
  individual: 'bg-purple-100 text-purple-700',
  'adulto-hijos': 'bg-amber-100 text-amber-700',
};

function enlaceInvitacion(inv: Invitacion): string {
  const base = window.location.origin;
  return `${base}/i/${inv.token}`;
}

function mensajeWhatsApp(inv: Invitacion): string {
  // Individual: saluda por el nombre de la persona invitada (inv.familia = la persona)
  const saludo = inv.contacto
    ? `¡Hola ${inv.contacto}!`
    : inv.modalidad === 'individual' && inv.familia
      ? `¡Hola ${inv.familia}!`
      : '¡Hola!';
  return `${saludo} ✨
Nos hace una ilusión enorme compartir contigo un momento muy especial para nuestra familia 💖 Te dejamos la invitación con toda la información del bautizo de las mellizas 🎀

${enlaceInvitacion(inv)}

¡Esperamos contar con tu presencia! 🙏 Nos encantaría que nos acompañaras: te pedimos confirmar tu asistencia hasta el 30 de septiembre 💌`;
}

function telefonoWa(inv: Invitacion): string {
  const limpio = (inv.telefono || '').replace(/[^\d]/g, '');
  if (limpio.length >= 9) {
    if (limpio.startsWith('56')) return limpio;
    return '56' + limpio;
  }
  return '';
}

function formatearFecha(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminInvitaciones() {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [resumen, setResumen] = useState({ total: 0, pendientes: 0, enviadas: 0, confirmadas: 0 });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [guardando, setGuardando] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormInvitacion>(FORM_VACIO);
  const [importarAbierto, setImportarAbierto] = useState(false);
  const [textoImportar, setTextoImportar] = useState('');
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const response = await adminApi.getInvitaciones();
      setInvitaciones(response.data || []);
      setResumen(
        response.resumen || { total: 0, pendientes: 0, enviadas: 0, confirmadas: 0 }
      );
    } catch (error) {
      console.error('Error al cargar invitaciones:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar invitaciones' });
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setFormAbierto(true);
  };

  const abrirEditar = (inv: Invitacion) => {
    setEditandoId(inv.id);
    const nombresPareja =
      inv.modalidad === 'pareja'
        ? (inv.asistentes || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    setForm({
      familia: inv.familia,
      contacto: inv.contacto || '',
      telefono: inv.telefono || '',
      asistentes: inv.asistentes || '',
      modalidad: inv.modalidad || 'familiar',
      parejaNombre1: nombresPareja[0] || '',
      parejaNombre2: nombresPareja[1] || '',
    });
    setFormAbierto(true);
  };

  const guardar = async () => {
    let payload: any;
    if (form.modalidad === 'individual') {
      if (!form.familia.trim()) {
        setMensaje({ tipo: 'error', texto: 'El nombre de la persona es obligatorio.' });
        return;
      }
      payload = {
        modalidad: 'individual',
        familia: form.familia.trim(),
        contacto: '',
        telefono: form.telefono.trim(),
        asistentes: '',
      };
    } else if (form.modalidad === 'pareja') {
      const n1 = form.parejaNombre1.trim();
      const n2 = form.parejaNombre2.trim();
      if (!n1 || !n2) {
        setMensaje({ tipo: 'error', texto: 'Ingresa los nombres de las dos personas de la pareja.' });
        return;
      }
      payload = {
        modalidad: 'pareja',
        familia: `${n1} y ${n2}`,
        contacto: n1,
        telefono: form.telefono.trim(),
        asistentes: `${n1}\n${n2}`,
      };
    } else if (form.modalidad === 'adulto-hijos') {
      const adulto = form.contacto.trim();
      if (!adulto) {
        setMensaje({ tipo: 'error', texto: 'Ingresa el nombre del adulto.' });
        return;
      }
      payload = {
        modalidad: 'adulto-hijos',
        familia: `${adulto} y sus hijos`,
        contacto: adulto,
        telefono: form.telefono.trim(),
        asistentes: form.asistentes.trim(),
      };
    } else {
      if (!form.familia.trim()) {
        setMensaje({ tipo: 'error', texto: 'El nombre de la familia es obligatorio.' });
        return;
      }
      payload = {
        modalidad: 'familiar',
        familia: form.familia.trim(),
        contacto: form.contacto.trim(),
        telefono: form.telefono.trim(),
        asistentes: form.asistentes.trim(),
      };
    }

    setGuardando(true);
    setMensaje(null);
    try {
      const response = editandoId
        ? await adminApi.actualizarInvitacion(editandoId, payload)
        : await adminApi.crearInvitacion(payload);
      if (!response.success) throw new Error(response.error || 'Error');
      setMensaje({
        tipo: 'ok',
        texto: editandoId
          ? 'Invitación actualizada.'
          : 'Invitación creada. Ahora puedes enviarla por WhatsApp.',
      });
      setFormAbierto(false);
      await cargar();
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al guardar invitación' });
    } finally {
      setGuardando(false);
    }
  };

  const enviarWhatsApp = async (inv: Invitacion) => {
    const num = telefonoWa(inv);
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(mensajeWhatsApp(inv))}`
      : `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(inv))}`;
    window.open(url, '_blank');
    // Marcar como enviada (no bloqueante)
    if (inv.estado === 'pendiente') {
      await adminApi.marcarEnviadaInvitacion(inv.id).catch(() => undefined);
      await cargar();
    }
  };

  const copiarEnlace = async (inv: Invitacion) => {
    try {
      await navigator.clipboard.writeText(enlaceInvitacion(inv));
      setCopiadoId(inv.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      alert('No se pudo copiar el enlace.');
    }
  };

  const cambiarEstado = async (inv: Invitacion, estado: Invitacion['estado']) => {
    const response = await adminApi.actualizarInvitacion(inv.id, { estado });
    if (response.success) {
      await cargar();
      setMensaje({
        tipo: 'ok',
        texto: `"${inv.familia}" ahora está ${ETIQUETA_ESTADO[estado].toLowerCase()}.`,
      });
    } else {
      setMensaje({ tipo: 'error', texto: response.error || 'Error al cambiar estado' });
    }
  };

  const eliminar = async (inv: Invitacion) => {
    if (!confirm(`⚠️ ¿Eliminar la invitación de "${inv.familia}"?`)) return;
    const response = await adminApi.eliminarInvitacion(inv.id);
    if (response.success) {
      setMensaje({ tipo: 'ok', texto: response.message || 'Invitación eliminada' });
      await cargar();
    } else {
      setMensaje({ tipo: 'error', texto: response.error || 'Error al eliminar' });
    }
  };

  const importar = async () => {
    const lineas = textoImportar
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const filas: Array<{ familia: string; contacto: string; telefono: string }> = [];
    for (const linea of lineas) {
      const partes = linea.split(/[\t;]/).map((p) => p.trim());
      if (!partes[0]) continue;
      filas.push({ familia: partes[0], contacto: partes[1] || '', telefono: partes[2] || '' });
    }
    if (filas.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Pega al menos una línea con el formato: Familia; Contacto; Teléfono',
      });
      return;
    }
    setImportando(true);
    setMensaje(null);
    try {
      const response = await adminApi.crearInvitacionesMasivo(filas);
      if (!response.success) throw new Error(response.error || 'Error');
      const data = response.data;
      setMensaje({
        tipo: data.errores && data.errores.length > 0 ? 'error' : 'ok',
        texto:
          `✅ ${data.creados} de ${data.total} invitaciones importadas` +
          (data.errores && data.errores.length > 0
            ? ` (${data.errores.length} con error)`
            : ''),
      });
      setImportarAbierto(false);
      setTextoImportar('');
      await cargar();
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al importar' });
    } finally {
      setImportando(false);
    }
  };

  const filtradas = invitaciones.filter((inv) => {
    if (filtroEstado !== 'todos' && inv.estado !== filtroEstado) return false;
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      inv.familia.toLowerCase().includes(q) ||
      (inv.contacto || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">
                📲 Invitaciones por WhatsApp
              </h1>
              <p className="text-gray-600 text-sm">
                Un enlace por familia para confirmar asistencia y ver regalos
              </p>
            </div>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender text-sm">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {mensaje && (
          <div
            className={`mb-4 p-4 rounded-lg text-sm ${
              mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{resumen.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{resumen.pendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
          <div className="bg-white rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{resumen.enviadas}</p>
            <p className="text-xs text-gray-500">Enviadas</p>
          </div>
          <div className="bg-white rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{resumen.confirmadas}</p>
            <p className="text-xs text-gray-500">Confirmadas</p>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar familia o contacto…"
              className="input-field md:flex-1"
            />
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'pendiente', 'enviada', 'confirmada'] as EstadoFiltro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltroEstado(f)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                    filtroEstado === f
                      ? 'bg-pastel-pink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : ETIQUETA_ESTADO[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={abrirCrear} className="btn-primary text-sm px-4 py-2">
              ➕ Nueva invitación
            </button>
            <button
              type="button"
              onClick={() => setImportarAbierto(true)}
              className="btn-secondary text-sm px-4 py-2"
            >
              📄 Importar lista
            </button>
          </div>
        </div>

        {/* Lista */}
        {filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center text-gray-500">
            No hay invitaciones para mostrar.{' '}
            {invitaciones.length === 0
              ? 'Crea tu primera invitación o importa una lista.'
              : 'Prueba con otro filtro.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl shadow-card p-4 md:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800">{inv.familia}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[inv.estado]}`}
                      >
                        {ETIQUETA_ESTADO[inv.estado]}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_MODALIDAD[inv.modalidad]}`}
                      >
                        {ETIQUETA_MODALIDAD[inv.modalidad]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {inv.contacto && <span>{inv.contacto}</span>}
                      {inv.contacto && inv.telefono && <span> · </span>}
                      {inv.telefono && <span>{inv.telefono}</span>}
                      {!inv.contacto && !inv.telefono && <span>Sin contacto</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Enviada: {formatearFecha(inv.fechaEnviada)} · Confirmada:{' '}
                      {formatearFecha(inv.fechaConfirmada)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => enviarWhatsApp(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      📲 WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => copiarEnlace(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      {copiadoId === inv.id ? '✅ Copiado' : '🔗 Copiar enlace'}
                    </button>
                    <select
                      value={inv.estado}
                      onChange={(e) =>
                        cambiarEstado(inv, e.target.value as Invitacion['estado'])
                      }
                      title="Cambiar estado: pendiente / enviada / confirmada"
                      className="px-2 py-2 rounded-full border-2 border-gray-200 bg-white text-xs font-semibold text-gray-700 cursor-pointer focus:border-pastel-pink focus:outline-none"
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="enviada">📨 Enviada</option>
                      <option value="confirmada">✓ Confirmada</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => abrirEditar(inv)}
                      className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(inv)}
                      className="px-3 py-2 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Modal crear/editar */}
        {formAbierto && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFormAbierto(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                {editandoId ? '✏️ Editar invitación' : '➕ Nueva invitación'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tipo de invitación</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-pastel-pink transition-colors">
                      <input
                        type="radio"
                        name="modalidad"
                        checked={form.modalidad === 'familiar'}
                        onChange={() => setForm({ ...form, modalidad: 'familiar' })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-gray-800">👨‍👩‍👧 Familiar</span>
                        <span className="text-xs text-gray-500">
                          Pueden confirmar varias personas de la familia.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-teal-300 transition-colors">
                      <input
                        type="radio"
                        name="modalidad"
                        checked={form.modalidad === 'pareja'}
                        onChange={() => setForm({ ...form, modalidad: 'pareja' })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-gray-800">👫 Pareja (sin niños)</span>
                        <span className="text-xs text-gray-500">
                          Invitas solo al matrimonio: máximo 2 adultos, sin niños.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-purple-300 transition-colors">
                      <input
                        type="radio"
                        name="modalidad"
                        checked={form.modalidad === 'individual'}
                        onChange={() => setForm({ ...form, modalidad: 'individual' })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-gray-800">🙋 Individual</span>
                        <span className="text-xs text-gray-500">
                          Solo confirma a la persona invitada (no podrá agregar más).
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-amber-300 transition-colors">
                      <input
                        type="radio"
                        name="modalidad"
                        checked={form.modalidad === 'adulto-hijos'}
                        onChange={() => setForm({ ...form, modalidad: 'adulto-hijos' })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-gray-800">🧑‍🧒 Adulto + hijos</span>
                        <span className="text-xs text-gray-500">
                          Invitas a un adulto con su(s) hijo(s).
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                {form.modalidad === 'individual' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Nombre de la persona * <span className="text-gray-400">(ej: Francisco)</span>
                    </label>
                    <input
                      type="text"
                      value={form.familia}
                      onChange={(e) => setForm({ ...form, familia: e.target.value })}
                      className="input-field"
                      placeholder="Francisco"
                    />
                  </div>
                )}

                {form.modalidad === 'adulto-hijos' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nombre del adulto * <span className="text-gray-400">(ej: María)</span>
                      </label>
                      <input
                        type="text"
                        value={form.contacto}
                        onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                        className="input-field"
                        placeholder="María"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nombres de los hijos <span className="text-gray-400">(opcional, uno por línea)</span>
                      </label>
                      <textarea
                        value={form.asistentes}
                        onChange={(e) => setForm({ ...form, asistentes: e.target.value })}
                        className="input-field"
                        rows={3}
                        placeholder={'Josefina (5)\nPedro (2)'}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Aquí todos se cargan como hijos (niño/a). Puedes indicar la edad entre
                        paréntesis, ej: <code className="bg-gray-100 px-1 rounded">Pedro (3)</code>.
                      </p>
                    </div>
                  </>
                )}

                {form.modalidad === 'pareja' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nombre de la persona 1 * <span className="text-gray-400">(ej: Lili)</span>
                      </label>
                      <input
                        type="text"
                        value={form.parejaNombre1}
                        onChange={(e) => setForm({ ...form, parejaNombre1: e.target.value })}
                        className="input-field"
                        placeholder="Lili"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nombre de la persona 2 * <span className="text-gray-400">(ej: Julio)</span>
                      </label>
                      <input
                        type="text"
                        value={form.parejaNombre2}
                        onChange={(e) => setForm({ ...form, parejaNombre2: e.target.value })}
                        className="input-field"
                        placeholder="Julio"
                      />
                    </div>
                  </>
                )}

                {form.modalidad === 'familiar' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nombre de la familia * <span className="text-gray-400">(ej: Familia Pérez)</span>
                      </label>
                      <input
                        type="text"
                        value={form.familia}
                        onChange={(e) => setForm({ ...form, familia: e.target.value })}
                        className="input-field"
                        placeholder="Familia Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Contacto <span className="text-gray-400">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.contacto}
                        onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                        className="input-field"
                        placeholder="María José"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Personas invitadas <span className="text-gray-400">(opcional, una por línea)</span>
                      </label>
                      <textarea
                        value={form.asistentes}
                        onChange={(e) => setForm({ ...form, asistentes: e.target.value })}
                        className="input-field"
                        rows={3}
                        placeholder={'Mamá\nPapá\nJosefina (5)\nPedro (2)'}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Para marcarlo como niño/a escribe su edad entre paréntesis, ej:{' '}
                        <code className="bg-gray-100 px-1 rounded">Josefina (5)</code>. También se
                        reconocen las palabras niño/a, hijo/a o bebé. Si no lleva edad se carga como
                        adulto (puedes cambiarlo al confirmar).
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Teléfono WhatsApp <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="input-field"
                    placeholder="+56 9 1234 5678"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Si lo agregas, el botón WhatsApp abre la conversación directa.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormAbierto(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="btn-primary flex-1"
                >
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear invitación'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal importar lista */}
        {importarAbierto && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setImportarAbierto(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-display font-bold text-gray-800 mb-2">
                📄 Importar lista de invitados
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                Pega una fila por línea. Cada línea con el formato:{' '}
                <code className="bg-gray-100 px-1 rounded">Familia; Contacto; Teléfono</code>
              </p>
              <textarea
                value={textoImportar}
                onChange={(e) => setTextoImportar(e.target.value)}
                className="input-field"
                rows={6}
                placeholder={'Familia Pérez; María; +56912345678\nFamilia González;;+56987654321\nFamilia Soto; Pablo;'}
              />
              <p className="text-xs text-gray-400 mt-2">
                Solo "Familia" es obligatorio. Puedes separar las columnas con{" "}
                <code className="bg-gray-100 px-1 rounded">;</code> o tabulaciones (copiar de Excel).
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setImportarAbierto(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={importar}
                  disabled={importando}
                  className="btn-primary flex-1"
                >
                  {importando ? 'Importando...' : 'Importar invitaciones'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


