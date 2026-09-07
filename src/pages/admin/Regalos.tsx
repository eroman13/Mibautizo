/**
 * Página de gestión de regalos (CRUD)
 */

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { buildApiUrl } from '../../services/config';
import { comprimirImagen } from '../../utils/imagen';
import { formatCLP } from '../../utils/format';
import { Link } from 'react-router-dom';
import { Regalo } from '../../types';

// ---------- Utilidades de búsqueda y detección de posibles duplicados ----------

const STOP_WORDS = new Set([
  'de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'a', 'al', 'con', 'sin', 'para', 'por', 'en', 'e', 'u',
  'bebe', 'bebes', 'melliza', 'mellizas', 'cada', 'su', 'sus',
  'set', 'pack', 'kit', 'x', 'mas',
]);

/** Normaliza texto: minúsculas, sin tildes, sin puntuación y espacios extra. */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Palabras significativas (sin stopwords) de un texto. */
function tokensRelevantes(texto: string): string[] {
  return normalizarTexto(texto)
    .split(' ')
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/** Índice de Jaccard entre dos listas de tokens (0..1). */
function indiceJaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const comunes = b.filter((t) => setA.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return comunes / union;
}

/** Similitud (0..1) entre el nombre de un regalo existente y otro nombre/criterio. */
function similitudEntreNombres(existente: string, nuevo: string): number {
  const n1 = normalizarTexto(existente);
  const n2 = normalizarTexto(nuevo);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;
  return indiceJaccard(tokensRelevantes(n1), tokensRelevantes(n2));
}

/**
 * Detecta grupos de regalos que podrían repetirse o tener características similares:
 *  - nombre o descripción idénticos (ignorando tildes y mayúsculas), o
 *  - similitud de Jaccard >= 0.5 entre las palabras clave de sus nombres.
 */
function detectarPosiblesDuplicados(regalos: Regalo[]): {
  grupos: number[][];
  porRegalo: Map<number, number[]>;
} {
  const n = regalos.length;
  const padre = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => (padre[i] === i ? i : (padre[i] = find(padre[i])));
  const unir = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) padre[rb] = ra;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = regalos[i];
      const b = regalos[j];
      const nombreA = normalizarTexto(a.nombre);
      const nombreB = normalizarTexto(b.nombre);
      if (!nombreA || !nombreB) continue;
      if (nombreA === nombreB) {
        unir(i, j);
        continue;
      }
      const descA = normalizarTexto(a.descripcion);
      const descB = normalizarTexto(b.descripcion);
      if (descA && descB && descA === descB) {
        unir(i, j);
        continue;
      }
      if (similitudEntreNombres(a.nombre, b.nombre) >= 0.5) unir(i, j);
    }
  }

  const gruposMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const raiz = find(i);
    const grupo = gruposMap.get(raiz) ?? [];
    grupo.push(i);
    gruposMap.set(raiz, grupo);
  }

  const grupos = [...gruposMap.values()].filter((g) => g.length > 1);
  const porRegalo = new Map<number, number[]>();
  for (const grupo of grupos) {
    for (const idx of grupo) {
      porRegalo.set(regalos[idx].id, grupo.map((otro) => regalos[otro].id));
    }
  }
  return { grupos, porRegalo };
}

/** Nombres de los otros regalos del mismo grupo (máx. 3) para mostrar en la tarjeta. */
function otrosDuplicadosDe(
  regalo: Regalo,
  regalos: Regalo[],
  porRegalo: Map<number, number[]>
): { nombres: string[]; total: number } {
  const ids = porRegalo.get(regalo.id) ?? [];
  const nombres = ids
    .filter((id) => id !== regalo.id)
    .map((id) => regalos.find((r) => r.id === id)?.nombre)
    .filter((n): n is string => Boolean(n));
  return { nombres: nombres.slice(0, 3), total: nombres.length };
}

export default function AdminRegalos() {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [regaloEditando, setRegaloEditando] = useState<Regalo | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioCLP: 0,
    imagenUrl: '',
    permiteColaborativo: false,
  });

  // Buscador y revisión de posibles duplicados
  const [busqueda, setBusqueda] = useState('');
  const [soloDuplicados, setSoloDuplicados] = useState(false);

  // Estados para carga masiva
  const [modalMasivoAbierto, setModalMasivoAbierto] = useState(false);
  const [modoCarga, setModoCarga] = useState<'json' | 'formulario'>('json');
  const [jsonText, setJsonText] = useState('');
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [filasMasivo, setFilasMasivo] = useState<Array<{
    nombre: string;
    descripcion: string;
    precioCLP: number;
    imagenUrl: string;
    imagenBase64: string;
    permiteColaborativo: boolean;
  }>>([{ nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false }]);

  useEffect(() => {
    cargarRegalos();
  }, []);

  const cargarRegalos = async () => {
    try {
      const response = await api.getRegalos();
      setRegalos(response.data.regalos);
    } catch (error) {
      console.error('Error al cargar regalos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Detección de posibles duplicados o regalos con características similares
  const { grupos: gruposDuplicados, porRegalo: porRegaloDuplicados } = useMemo(
    () => detectarPosiblesDuplicados(regalos),
    [regalos]
  );

  const idsDuplicados = useMemo(
    () => new Set(porRegaloDuplicados.keys()),
    [porRegaloDuplicados]
  );

  // Regalos visibles según el buscador y/o el filtro de posibles duplicados
  const regalosFiltrados = useMemo(() => {
    const terminos = normalizarTexto(busqueda).split(' ').filter(Boolean);

    return regalos.filter((regalo) => {
      if (soloDuplicados && !idsDuplicados.has(regalo.id)) return false;
      if (terminos.length === 0) return true;

      const texto = normalizarTexto(
        `${regalo.nombre} ${regalo.descripcion} ${regalo.precioCLP} ${formatCLP(regalo.precioCLP)}`
      );
      return terminos.every((t) => texto.includes(t));
    });
  }, [regalos, busqueda, soloDuplicados, idsDuplicados]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setSoloDuplicados(false);
  };

  const abrirModal = (regalo?: Regalo) => {
    if (regalo) {
      setRegaloEditando(regalo);
      setFormData({
        nombre: regalo.nombre,
        descripcion: regalo.descripcion,
        precioCLP: regalo.precioCLP,
        imagenUrl: regalo.imagenUrl,
        permiteColaborativo: regalo.permiteColaborativo,
      });
    } else {
      setRegaloEditando(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precioCLP: 0,
        imagenUrl: '',
        permiteColaborativo: false,
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRegaloEditando(null);
  };

  const guardarRegalo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (regaloEditando) {
        await adminApi.actualizarRegalo(regaloEditando.id, formData);
      } else {
        await adminApi.crearRegalo(formData);
      }
      await cargarRegalos();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar regalo:', error);
      alert('Error al guardar el regalo');
    }
  };

  const subirImagen = async (file: File) => {
    try {
      setSubiendo(true);

      // Comprimir y redimensionar la imagen antes de subirla
      const base64 = await comprimirImagen(file);

      // Enviar al backend
      const response = await fetch(buildApiUrl('/upload-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64 }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, imagenUrl: data.imageUrl });
        console.log('✅ Imagen subida');
      } else {
        alert('Error al subir imagen: ' + data.error);
      }
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type.startsWith('image/')) {
        subirImagen(files[0]);
      } else {
        alert('Por favor sube una imagen');
      }
    }
  };

  const eliminarRegalo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este regalo?')) return;

    try {
      const response = await adminApi.eliminarRegalo(id);
      if (response.success) {
        await cargarRegalos();
      } else {
        alert(response.error);
      }
    } catch (error) {
      console.error('Error al eliminar regalo:', error);
      alert('Error al eliminar el regalo');
    }
  };

  // ---------- Funciones de carga masiva ----------

  const procesarJsonMasivo = async () => {
    setCargandoMasivo(true);
    try {
      const regalos = JSON.parse(jsonText);
      if (!Array.isArray(regalos)) throw new Error('El JSON debe ser un array');

      const response = await adminApi.crearRegalosMasivo(regalos);
      if (response.success) {
        const { creados, errores } = response.data;
        if (errores.length > 0) {
          console.error('Errores en carga masiva:', errores);
          alert(`✅ ${creados} regalos creados.\n⚠️ ${errores.length} con error (ver consola).`);
        } else {
          alert(`✅ ${creados} regalos creados exitosamente.`);
        }
        await cargarRegalos();
        setModalMasivoAbierto(false);
        setJsonText('');
      } else {
        alert(response.error || 'Error en carga masiva');
      }
    } catch (e: any) {
      alert('JSON inválido: ' + (e.message || 'Error al parsear'));
    } finally {
      setCargandoMasivo(false);
    }
  };

  const agregarFilaMasivo = () => {
    setFilasMasivo([
      ...filasMasivo,
      { nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false },
    ]);
  };

  const eliminarFilaMasivo = (index: number) => {
    if (filasMasivo.length === 1) return;
    setFilasMasivo(filasMasivo.filter((_, i) => i !== index));
  };

  const actualizarFilaMasivo = (index: number, campo: string, valor: any) => {
    const nuevas = [...filasMasivo];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setFilasMasivo(nuevas);
  };

  const subirImagenFila = async (index: number, file: File) => {
    const base64 = await comprimirImagen(file);
    actualizarFilaMasivo(index, 'imagenBase64', base64);
  };

  const procesarFormularioMasivo = async () => {
    setCargandoMasivo(true);
    try {
      const regalosValidos = filasMasivo.filter(
        (f) => f.nombre.trim() && f.descripcion.trim() && f.precioCLP > 0 && (f.imagenUrl || f.imagenBase64)
      );

      if (regalosValidos.length === 0) {
        alert('Agrega al menos un regalo completo (nombre, descripción, precio e imagen)');
        return;
      }

      const response = await adminApi.crearRegalosMasivo(regalosValidos);
      if (response.success) {
        const { creados, errores } = response.data;
        if (errores.length > 0) {
          console.error('Errores en carga masiva:', errores);
          alert(`✅ ${creados} regalos creados.\n⚠️ ${errores.length} con error (ver consola).`);
        } else {
          alert(`✅ ${creados} regalos creados exitosamente.`);
        }
        await cargarRegalos();
        setModalMasivoAbierto(false);
        setFilasMasivo([{ nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false }]);
      } else {
        alert(response.error || 'Error en carga masiva');
      }
    } catch (error) {
      console.error('Error en carga masiva:', error);
      alert('Error al procesar la carga masiva');
    } finally {
      setCargandoMasivo(false);
    }
  };

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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-display font-bold text-gray-800">
              🎁 Gestión de Regalos
            </h1>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Botón agregar */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button onClick={() => abrirModal()} className="btn-primary">
            ➕ Agregar Nuevo Regalo
          </button>
          <button onClick={() => setModalMasivoAbierto(true)} className="btn-secondary">
            📦 Carga Masiva
          </button>
        </div>

        {/* Buscador y revisión de posibles duplicados */}
        <div className="mb-6 bg-white rounded-2xl shadow-card p-4 sm:p-5 space-y-3">
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden
            >
              🔍
            </span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field !pl-11"
              placeholder="Buscar por nombre, descripción o precio (ej: coche, bodies, 25000)…"
              aria-label="Buscar regalos"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-gray-600">
              Mostrando{' '}
              <strong className="text-gray-800">{regalosFiltrados.length}</strong> de{' '}
              <strong className="text-gray-800">{regalos.length}</strong> regalos
            </span>

            {gruposDuplicados.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                ⚠️ {gruposDuplicados.length} grupo{gruposDuplicados.length !== 1 ? 's' : ''} con
                posibles duplicados o similares
              </span>
            )}

            {gruposDuplicados.length > 0 && (
              <button
                type="button"
                onClick={() => setSoloDuplicados((v) => !v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  soloDuplicados
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                {soloDuplicados ? '✓ Mostrando solo duplicados' : 'Ver solo posibles duplicados'}
              </button>
            )}

            {(busqueda || soloDuplicados) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-pastel-pink hover:text-pastel-lavender font-medium text-xs"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Grid de regalos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regalosFiltrados.map((regalo) => {
            const duplicados = otrosDuplicadosDe(regalo, regalos, porRegaloDuplicados);
            return (
            <div key={regalo.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="bg-soft-gray md:aspect-square">
                <img
                  src={regalo.imagenUrl}
                  alt={regalo.nombre}
                  className="w-full h-auto md:h-full md:object-contain"
                />
              </div>
              <div className="p-6">
                {duplicados.total > 0 && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-2.5 text-xs text-yellow-800">
                    <p className="font-semibold mb-1">⚠️ Posible duplicado o muy similar</p>
                    <p className="leading-snug">
                      Coincide con:{' '}
                      {duplicados.nombres.map((nombre, i) => (
                        <span key={i}>
                          {i > 0 && ' · '}
                          <span className="font-medium">{nombre}</span>
                        </span>
                      ))}
                      {duplicados.total > duplicados.nombres.length && (
                        <span className="font-medium">
                          {' '}+{duplicados.total - duplicados.nombres.length} más
                        </span>
                      )}
                    </p>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {regalo.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {regalo.descripcion}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xl font-bold text-pastel-pink">
                    {formatCLP(regalo.precioCLP)}
                  </p>
                  <span
                    className={`badge ${
                      regalo.estado === 'disponible'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {regalo.estado}
                  </span>
                </div>
                {regalo.permiteColaborativo && (
                  <div className="mb-4 text-xs text-purple-600">
                    🤝 Regalo colaborativo
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(regalo)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarRegalo(regalo.id)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Mensaje cuando no hay resultados con los filtros aplicados */}
        {regalosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <p className="text-3xl mb-2">🔎</p>
            <p className="text-gray-600 font-medium">
              {regalos.length === 0
                ? 'Aún no hay regalos en el catálogo. Usa "Agregar Nuevo Regalo" o "Carga Masiva" para comenzar.'
                : 'No se encontraron regalos que coincidan con tu búsqueda.'}
            </p>
            {(busqueda || soloDuplicados) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 text-pastel-pink hover:text-pastel-lavender text-sm font-medium underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de agregar/editar */}
      {modalAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={cerrarModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">
                {regaloEditando ? 'Editar Regalo' : 'Nuevo Regalo'}
              </h2>

              <form onSubmit={guardarRegalo} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre del regalo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Pack de 2 bodies de algodón"
                  />

                  {/* Sugerencias de posibles duplicados mientras se escribe el nombre */}
                  {formData.nombre.trim().length >= 3 &&
                    (() => {
                      const candidatos = regalos
                        .filter((r) => r.id !== regaloEditando?.id)
                        .map((r) => ({
                          regalo: r,
                          similitud: similitudEntreNombres(r.nombre, formData.nombre),
                        }))
                        .filter((c) => c.similitud >= 0.4)
                        .sort((a, b) => b.similitud - a.similitud)
                        .slice(0, 4);

                      if (candidatos.length === 0) return null;

                      return (
                        <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-sm">
                          <p className="font-semibold text-yellow-800 mb-1.5">
                            ⚠️ Ya existen regalos con nombre similar:
                          </p>
                          <ul className="space-y-1">
                            {candidatos.map(({ regalo, similitud }) => (
                              <li
                                key={regalo.id}
                                className="flex items-center justify-between gap-3 text-yellow-800"
                              >
                                <span className="truncate">{regalo.nombre}</span>
                                <span className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs bg-white border border-yellow-200 rounded-full px-2 py-0.5">
                                    {formatCLP(regalo.precioCLP)}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {Math.round(similitud * 100)}%
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-yellow-700 mt-1.5">
                            Revisa antes de guardar para evitar regalos repetidos o muy parecidos.
                          </p>
                        </div>
                      );
                    })()}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Descripción
                  </label>
                  <textarea
                    required
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Describe el regalo..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Precio (CLP)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.precioCLP}
                    onChange={(e) => setFormData({ ...formData, precioCLP: parseInt(e.target.value) })}
                    className="input-field"
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Imagen del regalo
                  </label>
                  
                  {/* Vista previa de imagen */}
                  {formData.imagenUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-pastel-pink bg-soft-gray">
                      <img 
                        src={formData.imagenUrl} 
                        alt="Preview" 
                        className="w-full h-auto max-h-72 object-contain"
                      />
                    </div>
                  )}

                  {/* Drag and drop area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-pastel-pink bg-pastel-pink/10'
                        : 'border-gray-300 bg-gray-50 hover:border-pastel-pink'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">📸</span>
                      <p className="text-gray-700 font-medium">
                        Arrastra una imagen aquí
                      </p>
                      <p className="text-gray-500 text-sm">
                        o usa el botón para seleccionar
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
                        disabled={subiendo}
                        className="hidden"
                        id="imageInput"
                      />
                      <label
                        htmlFor="imageInput"
                        className="mt-2 px-4 py-2 bg-pastel-pink text-white rounded-lg hover:bg-pastel-lavender disabled:opacity-50 cursor-pointer inline-block"
                      >
                        {subiendo ? '⏳ Subiendo...' : '📁 Seleccionar archivo'}
                      </label>
                    </div>
                  </div>

                  {/* Alternativa: URL manual */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600 text-sm mb-2">O pega una URL de imagen:</p>
                    <input
                      type="url"
                      value={formData.imagenUrl}
                      onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="colaborativo"
                    checked={formData.permiteColaborativo}
                    onChange={(e) => setFormData({ ...formData, permiteColaborativo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="colaborativo" className="text-gray-700">
                    Permitir aportes colaborativos
                  </label>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    {regaloEditando ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Modal de carga masiva */}
      {modalMasivoAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-gray-800">
                📦 Carga Masiva de Regalos
              </h2>
              <button
                onClick={() => setModalMasivoAbierto(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setModoCarga('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    modoCarga === 'json' ? 'bg-pastel-pink text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  📋 Pegar JSON
                </button>
                <button
                  onClick={() => setModoCarga('formulario')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    modoCarga === 'formulario' ? 'bg-pastel-pink text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ✍️ Formulario múltiple
                </button>
              </div>

              {modoCarga === 'json' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Pega un array JSON de regalos. Cada regalo puede tener <code className="bg-gray-100 px-1 rounded">imagenUrl</code> (URL externa) o <code className="bg-gray-100 px-1 rounded">imagenBase64</code> (data URL).
                  </p>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="input-field w-full font-mono text-sm h-64"
                    placeholder={`[\n  {\n    "nombre": "Coche para bebé",\n    "descripcion": "Coche ligero y plegable",\n    "precioCLP": 120000,\n    "imagenUrl": "https://ejemplo.com/foto.jpg",\n    "permiteColaborativo": false\n  }\n]`}
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={procesarJsonMasivo}
                      disabled={cargandoMasivo}
                      className="btn-primary flex-1"
                    >
                      {cargandoMasivo ? '⏳ Procesando...' : '📦 Cargar regalos'}
                    </button>
                    <button
                      onClick={() => setModalMasivoAbierto(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Completa los campos de cada regalo. Para la imagen puedes subir un archivo o pegar una URL.
                  </p>

                  <div className="space-y-4">
                    {filasMasivo.map((fila, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700 text-sm">
                            Regalo #{index + 1}
                          </span>
                          {filasMasivo.length > 1 && (
                            <button
                              onClick={() => eliminarFilaMasivo(index)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              ✕ Eliminar
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={fila.nombre}
                              onChange={(e) => actualizarFilaMasivo(index, 'nombre', e.target.value)}
                              className="input-field"
                              placeholder="Ej: Coche para bebé"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Precio (CLP) *</label>
                            <input
                              type="number"
                              value={fila.precioCLP}
                              onChange={(e) => actualizarFilaMasivo(index, 'precioCLP', Number(e.target.value))}
                              className="input-field"
                              placeholder="120000"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">Descripción *</label>
                          <input
                            type="text"
                            value={fila.descripcion}
                            onChange={(e) => actualizarFilaMasivo(index, 'descripcion', e.target.value)}
                            className="input-field"
                            placeholder="Coche ligero y plegable"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">Imagen</label>
                          <div className="flex items-center gap-3">
                            {fila.imagenBase64 || fila.imagenUrl ? (
                              <img
                                src={fila.imagenBase64 || fila.imagenUrl}
                                alt="preview"
                                className="w-16 h-16 object-contain rounded-lg border bg-gray-50"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-2xl">
                                📸
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                              <label className="inline-block px-3 py-1.5 bg-gray-100 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                                📁 Subir imagen
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && subirImagenFila(index, e.target.files[0])}
                                />
                              </label>
                              <input
                                type="url"
                                value={fila.imagenUrl}
                                onChange={(e) => actualizarFilaMasivo(index, 'imagenUrl', e.target.value)}
                                className="input-field"
                                placeholder="... o pega URL de imagen"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`colaborativo-masivo-${index}`}
                            checked={fila.permiteColaborativo}
                            onChange={(e) => actualizarFilaMasivo(index, 'permiteColaborativo', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`colaborativo-masivo-${index}`} className="text-sm text-gray-700">
                            Permitir aportes colaborativos
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={agregarFilaMasivo}
                      className="btn-secondary flex-1"
                    >
                      ➕ Agregar otro regalo
                    </button>
                    <button
                      onClick={procesarFormularioMasivo}
                      disabled={cargandoMasivo}
                      className="btn-primary flex-1"
                    >
                      {cargandoMasivo ? '⏳ Procesando...' : '📦 Cargar todos'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
