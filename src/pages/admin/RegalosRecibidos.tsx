/**
 * Vista de regalos recibidos (exclusiva del panel admin)
 *
 * Muestra quién ha realizado un regalo/aporte, con qué método lo hizo, a qué
 * regalo lo destinó y permite registrar a mano los regalos recibidos por
 * transferencia bancaria (o efectivo), que no pasan por Mercado Pago.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { api } from '../../services/api';
import { formatCLP } from '../../utils/format';
import {
  Contribucion,
  MetodoPagoAporte,
  Regalo,
  ResumenContribuciones,
} from '../../types';

const ETIQUETAS_METODO: Record<MetodoPagoAporte, string> = {
  mercadopago: '💳 Mercado Pago',
  transferencia: '🏦 Transferencia',
  efectivo: '💵 Efectivo',
  otro: '📦 Otro',
};

const ESTILOS_METODO: Record<MetodoPagoAporte, string> = {
  mercadopago: 'bg-blue-100 text-blue-700',
  transferencia: 'bg-green-100 text-green-700',
  efectivo: 'bg-yellow-100 text-yellow-700',
  otro: 'bg-gray-100 text-gray-700',
};

/** Métodos que el admin puede registrar a mano (sin Mercado Pago) */
const METODOS_MANUALES: Array<'transferencia' | 'efectivo' | 'otro'> = [
  'transferencia',
  'efectivo',
  'otro',
];

/** Para qué melliza es el regalo */
const ETIQUETAS_MELLIZA: Record<string, string> = {
  melliza1: '👧 Melliza 1',
  melliza2: '👧 Melliza 2',
};

interface FormAporte {
  nombreInvitado: string;
  emailInvitado: string;
  montoCLP: string;
  giftId: string;
  paraMelliza: '' | 'melliza1' | 'melliza2';
  metodoPago: 'transferencia' | 'efectivo' | 'otro';
  referencia: string;
  fecha: string;
  dedicatoria: string;
}

/** Fecha de hoy en formato YYYY-MM-DD (para el <input type="date">) */
function hoyISO(): string {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offset).toISOString().split('T')[0];
}

function formInicial(): FormAporte {
  return {
    nombreInvitado: '',
    emailInvitado: '',
    montoCLP: '',
    giftId: '',
    paraMelliza: '',
    metodoPago: 'transferencia',
    referencia: '',
    fecha: hoyISO(),
    dedicatoria: '',
  };
}

function metodoDe(aporte: Contribucion): MetodoPagoAporte {
  return (aporte.metodoPago || 'mercadopago') as MetodoPagoAporte;
}

/** Los aportes de Mercado Pago son registros de auditoría: no se editan aquí */
function esManual(aporte: Contribucion): boolean {
  return metodoDe(aporte) !== 'mercadopago';
}

interface ResumenInvitado {
  nombre: string;
  email: string | null;
  aportes: number;
  total: number;
  ultimoAporte: string;
  regalos: string[];
  metodos: MetodoPagoAporte[];
}

/** Tarjeta de totales del encabezado */
function TarjetaResumen({
  titulo,
  valor,
  detalle,
  color,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{valor}</p>
      <p className="text-xs text-gray-500 mt-1">{detalle}</p>
    </div>
  );
}

/** Badge con el método con que se recibió el aporte */
function EtiquetaMetodo({ metodo }: { metodo: MetodoPagoAporte }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_METODO[metodo]}`}
    >
      {ETIQUETAS_METODO[metodo]}
    </span>
  );
}

export default function AdminRegalosRecibidos() {
  const [aportes, setAportes] = useState<Contribucion[]>([]);
  const [resumen, setResumen] = useState<ResumenContribuciones | null>(null);
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [vista, setVista] = useState<'invitados' | 'detalle'>('invitados');
  const [filtro, setFiltro] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<'todos' | MetodoPagoAporte>('todos');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormAporte>(formInicial());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      const [respuestaAportes, respuestaRegalos] = await Promise.all([
        adminApi.getContribuciones(),
        api.getRegalos(),
      ]);

      if (respuestaAportes?.success) {
        setAportes(respuestaAportes.data || []);
        setResumen(respuestaAportes.resumen || null);
      } else {
        setError(respuestaAportes?.error || 'Error al cargar los regalos recibidos');
      }

      if (respuestaRegalos?.success) {
        setRegalos(respuestaRegalos.data?.regalos || []);
      }
    } catch (err) {
      console.error('Error al cargar regalos recibidos:', err);
      setError('Error al cargar los regalos recibidos');
    } finally {
      setLoading(false);
    }
  };

  const avisar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 4000);
  };

  // ------------------------------- Datos derivados --------------------------

  /** Aportes que cumplen el filtro de texto y de método de pago */
  const aportesFiltrados = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    return aportes.filter((aporte) => {
      if (filtroMetodo !== 'todos' && metodoDe(aporte) !== filtroMetodo) return false;
      if (!texto) return true;
      return (
        aporte.nombreInvitado.toLowerCase().includes(texto) ||
        (aporte.emailInvitado || '').toLowerCase().includes(texto) ||
        (aporte.gift?.nombre || 'aporte libre').toLowerCase().includes(texto) ||
        (aporte.referencia || '').toLowerCase().includes(texto) ||
        (aporte.dedicatoria || '').toLowerCase().includes(texto)
      );
    });
  }, [aportes, filtro, filtroMetodo]);

  /** Quién ha regalado: aportes agrupados por invitado (de mayor a menor total) */
  const resumenPorInvitado = useMemo<ResumenInvitado[]>(() => {
    const mapa = new Map<string, ResumenInvitado>();

    for (const aporte of aportesFiltrados) {
      const clave = aporte.nombreInvitado.trim().toLowerCase();
      const actual: ResumenInvitado = mapa.get(clave) || {
        nombre: aporte.nombreInvitado,
        email: aporte.emailInvitado || null,
        aportes: 0,
        total: 0,
        ultimoAporte: aporte.createdAt,
        regalos: [],
        metodos: [],
      };

      actual.aportes += 1;
      actual.total += aporte.montoNetoCLP;
      if (new Date(aporte.createdAt) > new Date(actual.ultimoAporte)) {
        actual.ultimoAporte = aporte.createdAt;
      }

      const nombreRegalo = aporte.gift?.nombre || 'Aporte libre';
      if (!actual.regalos.includes(nombreRegalo)) actual.regalos.push(nombreRegalo);

      const metodo = metodoDe(aporte);
      if (!actual.metodos.includes(metodo)) actual.metodos.push(metodo);

      if (!actual.email && aporte.emailInvitado) actual.email = aporte.emailInvitado;

      mapa.set(clave, actual);
    }

    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [aportesFiltrados]);

  /** Totales de lo que se está mostrando (según filtros) */
  const totales = useMemo(() => {
    const aprobados = aportesFiltrados.filter((a) => a.estadoPago === 'approved');
    return {
      cantidad: aportesFiltrados.length,
      bruto: aprobados.reduce((sum, a) => sum + a.montoBrutoCLP, 0),
      neto: aprobados.reduce((sum, a) => sum + a.montoNetoCLP, 0),
      montoManual: aprobados.filter(esManual).reduce((sum, a) => sum + a.montoNetoCLP, 0),
      cantidadManuales: aportesFiltrados.filter(esManual).length,
    };
  }, [aportesFiltrados]);

  // --------------------------------- Acciones -------------------------------

  const cambiarCampo = (campo: keyof FormAporte, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(formInicial());
    setError('');
    setMostrarForm(true);
  };

  const abrirEditar = (aporte: Contribucion) => {
    const metodo = metodoDe(aporte);
    setEditandoId(aporte.id);
    setError('');
    setForm({
      nombreInvitado: aporte.nombreInvitado,
      emailInvitado: aporte.emailInvitado || '',
      montoCLP: String(aporte.montoBrutoCLP),
      giftId: aporte.giftId ? String(aporte.giftId) : '',
      paraMelliza:
        aporte.paraMelliza === 'melliza1' || aporte.paraMelliza === 'melliza2'
          ? aporte.paraMelliza
          : '',
      metodoPago: metodo === 'mercadopago' ? 'transferencia' : metodo,
      referencia: aporte.referencia || '',
      fecha: aporte.createdAt ? aporte.createdAt.split('T')[0] : hoyISO(),
      dedicatoria: aporte.dedicatoria || '',
    });
    setMostrarForm(true);
  };

  const cancelarForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(formInicial());
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const monto = Number(form.montoCLP);
    if (!form.nombreInvitado.trim()) {
      setError('Indica quién realizó el regalo');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('El monto debe ser un número mayor a 0');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        nombreInvitado: form.nombreInvitado.trim(),
        emailInvitado: form.emailInvitado.trim() || undefined,
        montoCLP: Math.round(monto),
        giftId: form.giftId ? Number(form.giftId) : null,
        paraMelliza: form.paraMelliza || null,
        metodoPago: form.metodoPago,
        referencia: form.referencia.trim() || undefined,
        fecha: form.fecha || undefined,
        dedicatoria: form.dedicatoria.trim() || undefined,
      };

      const respuesta = editandoId
        ? await adminApi.actualizarContribucion(editandoId, payload)
        : await adminApi.crearContribucion(payload);

      if (respuesta?.success) {
        avisar(editandoId ? '✅ Aporte actualizado' : '✅ Regalo por transferencia registrado');
        cancelarForm();
        await cargarDatos();
      } else {
        setError(respuesta?.error || 'No se pudo guardar el aporte');
      }
    } catch (err) {
      console.error('Error al guardar el aporte:', err);
      setError('No se pudo guardar el aporte');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (aporte: Contribucion) => {
    const confirmacion = confirm(
      `¿Eliminar el aporte de "${aporte.nombreInvitado}" por ${formatCLP(aporte.montoBrutoCLP)}?\n\n` +
        'Se descontará del monto recaudado del regalo. Esta acción no se puede deshacer.'
    );
    if (!confirmacion) return;

    try {
      const respuesta = await adminApi.eliminarContribucion(aporte.id);
      if (respuesta?.success) {
        avisar('🗑️ Aporte eliminado');
        await cargarDatos();
      } else {
        setError(respuesta?.error || 'No se pudo eliminar el aporte');
      }
    } catch (err) {
      console.error('Error al eliminar el aporte:', err);
      setError('No se pudo eliminar el aporte');
    }
  };

  // ---------------------------------- Render --------------------------------

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
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-gray-800">
              🎁 Regalos recibidos
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/admin/contribuciones" className="text-pastel-pink hover:text-pastel-lavender">
                📊 Contribuciones
              </Link>
              <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
                ← Volver al dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Resumen de lo mostrado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaResumen
            titulo="Aportes mostrados"
            valor={String(totales.cantidad)}
            detalle={`${resumenPorInvitado.length} invitado(s) distintos`}
            color="text-gray-800"
          />
          <TarjetaResumen
            titulo="Recaudado (neto)"
            valor={formatCLP(totales.neto)}
            detalle={`Bruto ${formatCLP(totales.bruto)}`}
            color="text-green-600"
          />
          <TarjetaResumen
            titulo="Registrados a mano"
            valor={formatCLP(totales.montoManual)}
            detalle={`${totales.cantidadManuales} aporte(s) por transferencia/efectivo`}
            color="text-pastel-lavender"
          />
          <TarjetaResumen
            titulo="Mercado Pago (histórico)"
            valor={
              resumen ? formatCLP(resumen.montoNeto - resumen.montoManual) : formatCLP(0)
            }
            detalle={resumen ? `${resumen.total} aporte(s) en total` : 'Sin datos de resumen'}
            color="text-blue-600"
          />
        </div>

        {/* Registrar / editar un aporte hecho a mano */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-display font-bold text-gray-800">
                {editandoId
                  ? '✏️ Editar aporte registrado'
                  : '🏦 Registrar regalo recibido por transferencia'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Usa este formulario para los regalos que llegan fuera de Mercado Pago:
                transferencia bancaria, efectivo o entregas en mano.
              </p>
            </div>
            {!mostrarForm && (
              <button onClick={abrirNuevo} className="btn-primary">
                ➕ Registrar aporte
              </button>
            )}
          </div>

          {mostrarForm && (
            <form onSubmit={guardar} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ¿Quién realizó el regalo? *
                </label>
                <input
                  type="text"
                  value={form.nombreInvitado}
                  onChange={(e) => cambiarCampo('nombreInvitado', e.target.value)}
                  placeholder="Nombre y apellido"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.emailInvitado}
                  onChange={(e) => cambiarCampo('emailInvitado', e.target.value)}
                  placeholder="opcional@correo.cl"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Monto (CLP) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.montoCLP}
                  onChange={(e) => cambiarCampo('montoCLP', e.target.value)}
                  placeholder="50000"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Método de pago *
                </label>
                <select
                  value={form.metodoPago}
                  onChange={(e) => cambiarCampo('metodoPago', e.target.value)}
                  className="input-field"
                >
                  {METODOS_MANUALES.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {ETIQUETAS_METODO[metodo]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Regalo (opcional)
                </label>
                <select
                  value={form.giftId}
                  onChange={(e) => cambiarCampo('giftId', e.target.value)}
                  className="input-field"
                >
                  <option value="">— Aporte libre (sin regalo asignado) —</option>
                  {regalos.map((regalo) => (
                    <option key={regalo.id} value={regalo.id}>
                      {regalo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ¿Para cuál melliza?
                </label>
                <select
                  value={form.paraMelliza}
                  onChange={(e) => cambiarCampo('paraMelliza', e.target.value)}
                  className="input-field"
                >
                  <option value="">— Sin especificar —</option>
                  <option value="melliza1">👧 Melliza 1</option>
                  <option value="melliza2">👧 Melliza 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Referencia / N° de comprobante
                </label>
                <input
                  type="text"
                  value={form.referencia}
                  onChange={(e) => cambiarCampo('referencia', e.target.value)}
                  placeholder="Ej: transferencia 12345678"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fecha del aporte
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => cambiarCampo('fecha', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dedicatoria / mensaje (opcional)
                </label>
                <textarea
                  rows={2}
                  value={form.dedicatoria}
                  onChange={(e) => cambiarCampo('dedicatoria', e.target.value)}
                  placeholder="Mensaje que dejó quien regaló..."
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 flex-wrap">
                <button type="submit" disabled={guardando} className="btn-primary">
                  {guardando
                    ? '⏳ Guardando...'
                    : editandoId
                      ? '💾 Guardar cambios'
                      : '✅ Registrar regalo'}
                </button>
                <button type="button" onClick={cancelarForm} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filtros y cambio de vista */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por invitado, regalo, referencia o mensaje..."
              className="input-field w-full md:max-w-md"
            />
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'mercadopago', 'transferencia', 'efectivo', 'otro'] as const).map(
                (opcion) => (
                  <button
                    key={opcion}
                    onClick={() => setFiltroMetodo(opcion)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
                      filtroMetodo === opcion
                        ? 'border-pastel-pink bg-pastel-pink text-white'
                        : 'border-gray-200 text-gray-600 hover:border-pastel-pink'
                    }`}
                  >
                    {opcion === 'todos' ? 'Todos' : ETIQUETAS_METODO[opcion]}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-5 border-b">
            <button
              onClick={() => setVista('invitados')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                vista === 'invitados'
                  ? 'border-pastel-pink text-pastel-pink'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Quién regaló ({resumenPorInvitado.length})
            </button>
            <button
              onClick={() => setVista('detalle')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                vista === 'detalle'
                  ? 'border-pastel-pink text-pastel-pink'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🧾 Detalle de aportes ({totales.cantidad})
            </button>
          </div>
        </div>

        {/* Listado */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            {vista === 'invitados' ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Invitado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Aportes
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Método
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Regalos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Último aporte
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resumenPorInvitado.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No hay aportes que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    resumenPorInvitado.map((invitado) => (
                      <tr key={invitado.nombre} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{invitado.nombre}</div>
                          {invitado.email && (
                            <div className="text-xs text-gray-500">{invitado.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {invitado.aportes}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                          {formatCLP(invitado.total)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {invitado.metodos.map((metodo) => (
                              <EtiquetaMetodo key={metodo} metodo={metodo} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {invitado.regalos.join(', ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(invitado.ultimoAporte).toLocaleDateString('es-CL')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Invitado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Regalo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Método
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Para
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aportesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        No hay aportes que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    aportesFiltrados.map((aporte) => (
                      <tr key={aporte.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(aporte.createdAt).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">
                            {aporte.nombreInvitado}
                          </div>
                          {aporte.emailInvitado && (
                            <div className="text-xs text-gray-500">{aporte.emailInvitado}</div>
                          )}
                          {aporte.dedicatoria && (
                            <div className="text-xs text-gray-500 italic mt-1">
                              "{aporte.dedicatoria}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {aporte.gift?.nombre || (
                            <span className="text-gray-400">Aporte libre</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <EtiquetaMetodo metodo={metodoDe(aporte)} />
                          {aporte.referencia && (
                            <div className="text-xs text-gray-500 mt-1">{aporte.referencia}</div>
                          )}
                          {aporte.registradoPor && esManual(aporte) && (
                            <div className="text-xs text-gray-400 mt-1">
                              Registrado por {aporte.registradoPor}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {aporte.paraMelliza
                            ? ETIQUETAS_MELLIZA[aporte.paraMelliza] || aporte.paraMelliza
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-gray-800">
                            {formatCLP(aporte.montoBrutoCLP)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Neto {formatCLP(aporte.montoNetoCLP)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              aporte.estadoPago === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : aporte.estadoPago === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {aporte.estadoPago === 'approved'
                              ? 'Aprobado'
                              : aporte.estadoPago === 'pending'
                                ? 'Pendiente'
                                : aporte.estadoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {esManual(aporte) ? (
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => abrirEditar(aporte)}
                                className="text-pastel-lavender hover:underline text-sm font-semibold"
                                title="Editar este aporte"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => eliminar(aporte)}
                                className="text-red-500 hover:underline text-sm font-semibold"
                                title="Eliminar este aporte"
                              >
                                🗑️
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-center text-xs text-gray-400"
                              title="Registrado por Mercado Pago: no se edita ni elimina"
                            >
                              🔒 MP
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 pb-6">
          Los aportes de Mercado Pago se registran automáticamente y no se pueden editar ni eliminar
          (se conservan como registro de auditoría). Los aportes que registres a mano actualizan el
          monto recaudado del regalo y su estado.
        </p>
      </div>
    </div>
  );
}

