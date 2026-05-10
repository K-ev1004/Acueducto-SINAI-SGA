import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Home, Users, FileText, BarChart3, Plus, Edit, Trash2,
  LogOut, Search, Eye, DollarSign, CheckCircle, AlertCircle,
  Calendar, Filter, Printer, RefreshCw, AlertTriangle, Shield,
  Clock
} from 'lucide-react';
import {
  obtenerSuscriptores, crearSuscriptor, obtenerDetalleSuscriptor,
  actualizarSuscriptor, registrarLectura, obtenerHistorialLecturas,
  registrarPago, obtenerHistorialPagos, obtenerFacturas, generarFacturas,
  obtenerPeriodos, crearPeriodo, obtenerDashboard, cortarServicio,
  reconectarServicio
} from '../../services/api';
import { logout } from '../../services/auth';

/* ============ ICONOS PARA EL MENÚ ============ */
const menuIcons = {
  Inicio: Home,
  Suscriptores: Users,
  Lecturas: FileText,
  Facturacion: DollarSign,
  Pagos: Calendar,
  Dashboard: BarChart3,
};

/* ============ COMPONENTES REUTILIZABLES ============ */
function ModalConfirmar({ isOpen, titulo, mensaje, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle size={28} />
          <h3 className="text-xl font-bold">{titulo}</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalExito({ isOpen, mensaje, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-green-600 mb-4">
          <CheckCircle size={28} />
          <h3 className="text-xl font-bold">Éxito</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <button onClick={onClose} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
          Entendido
        </button>
      </div>
    </div>
  );
}

function TablaGenerica({ columnas, datos, acciones, filasVacias }) {
  if (datos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {filasVacias || "No se encontraron registros"}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {columnas.map((col, i) => (
              <th key={i} className="px-4 py-3">{col}</th>
            ))}
            {acciones && <th className="px-4 py-3 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {datos.map((fila, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              {Object.values(fila).map((val, i) => (
                <td key={i} className="px-4 py-3 text-sm text-gray-700">
                  {typeof val === 'boolean' ? (
                    val ? <span className="text-green-600 font-medium">✔</span> : <span className="text-red-400">✘</span>
                  ) : typeof val === 'number' && i > 0 ? (
                    typeof val === 'number' && val?.toLocaleString ? (
                      <span className="font-mono">{val.toLocaleString()}</span>
                    ) : (
                      val
                    )
                  ) : val}
                </td>
              ))}
              {acciones && (
                <td className="px-4 py-3 text-center">
                  {acciones(fila, idx)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============ VISTA: INICIO ============ */
function VistaInicio({ dashboard, suscriptores }) {
  const tarjetas = [
    { titulo: 'Total Suscriptores', valor: suscriptores.length, icono: Users, color: 'blue' },
    { titulo: 'Suscriptores Activos', valor: suscriptores.filter(s => s.estado_servicio === 'ACTIVO').length, icono: CheckCircle, color: 'green' },
    { titulo: 'Suscriptores Cortados', valor: suscriptores.filter(s => s.estado_servicio === 'CORTADO').length, icono: AlertCircle, color: 'red' },
    { titulo: 'Facturas Pendientes', valor: dashboard.facturas_pendientes, icono: FileText, color: 'orange' },
    { titulo: 'Total Deuda', valor: `$${Number(dashboard.total_deuda || 0).toLocaleString()}`, icono: DollarSign, color: 'red' },
    { titulo: 'Total Pagos', valor: dashboard.total_pagos, icono: DollarSign, color: 'green' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tarjetas.map((t, i) => {
          const Icon = t.icono;
          return (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Icon size={24} className={`text-${t.color}-500`} />
                </div>
                <span className={`text-3xl font-bold text-${t.color === 'blue' ? 'blue' : t.color === 'green' ? 'green' : t.color === 'red' ? 'red' : t.color === 'orange' ? 'orange' : 'gray'}-600 font-mono`}>
                  {t.valor}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{t.titulo}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <Clock size={18} className="inline mr-2 text-blue-500" />
          Información del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <p><span className="font-medium">Última lectura:</span> {dashboard.ultima_lectura || 'Sin lecturas'}</p>
          <p><span className="font-medium">Total lecturas:</span> {dashboard.total_lecturas}</p>
          <p><span className="font-medium">Usuarios totales:</span> {dashboard.total_suscriptores}</p>
          <p><span className="font-medium">Facturas generadas:</span> {dashboard.facturas_pendientes + dashboard.facturas_pagadas}</p>
          <p><span className="font-medium">Facturas pagadas:</span> <span className="text-green-600 font-medium">{dashboard.facturas_pagadas}</span></p>
          <p><span className="font-medium">Facturas pendientes:</span> <span className="text-orange-600 font-medium">{dashboard.facturas_pendientes}</span></p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <Shield size={16} className="inline mr-2" />
          <strong>Sistema Seguro</strong> — Autenticación JWT, CORS restringido, rate limiting y auditoría activa.
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

/* ============ VISTA: SUSCRIPTORES ============ */
function VistaSuscriptores({ suscriptores, onCrear, onEditar, onEliminar, onGestionCorte }) {
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', medidor_id: '', direccion: '' });
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const filtrados = suscriptores.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.medidor_id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await onEditar(editando.id, form);
      } else {
        await onCrear(form);
      }
      setModal(false);
      setEditando(null);
      setForm({ nombre: '', medidor_id: '', direccion: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirModal = (s = null) => {
    if (s) {
      setEditando(s);
      setForm({ nombre: s.nombre, medidor_id: s.medidor_id, direccion: s.direccion });
    } else {
      setEditando(null);
      setForm({ nombre: '', medidor_id: '', direccion: '' });
    }
    setModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o medidor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={16} />
          Nuevo Suscriptor
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">ID Medidor</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((s) => (
                <tr key={s.medidor_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">{s.medidor_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.direccion || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      s.estado_servicio === 'ACTIVO'
                        ? 'bg-green-100 text-green-700'
                        : s.estado_servicio === 'CORTADO'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {s.estado_servicio}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => abrirModal(s)} title="Editar" className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit size={15} />
                      </button>
                      {s.estado_servicio === 'ACTIVO' ? (
                        <button onClick={() => onGestionCorte(s.medidor_id, true)} title="Cortar servicio" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <AlertTriangle size={15} />
                        </button>
                      ) : (
                        <button onClick={() => onGestionCorte(s.medidor_id, false)} title="Reconectar servicio" className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                          <CheckCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No se encontraron suscriptores
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {editando ? 'Editar Suscriptor' : 'Nuevo Suscriptor'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">Complete los datos del suscriptor</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ej: Juan Carlos Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código del Medidor</label>
                <input
                  type="text"
                  value={form.medidor_id}
                  onChange={(e) => setForm({ ...form, medidor_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono uppercase"
                  placeholder="Ej: MED001"
                  required
                  disabled={!!editando}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ej: Calle 10 #20-30"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setModal(false); setEditando(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all"
                >
                  {editando ? 'Guardar Cambios' : 'Crear Suscriptor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <ModalConfirmar
          isOpen={true}
          titulo="Eliminar Suscriptor"
          mensaje={`¿Está seguro de eliminar al suscriptor "${confirmarEliminar.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={() => { onEliminar(confirmarEliminar.id); setConfirmarEliminar(null); }}
          onCancel={() => setConfirmarEliminar(null)}
        />
      )}
    </div>
  );
}

/* ============ VISTA: LECTURAS ============ */
function VistaLecturas({ onRegistrar }) {
  const [busqueda, setBusqueda] = useState('');
  const [lecturas, setLecturas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ medidor_id: '', valor: '' });

  const buscarLecturas = async () => {
    setCargando(true);
    const params = {};
    if (busqueda) params.medidor_id = busqueda;
    const result = await obtenerHistorialLecturas(params);
    setLecturas(result);
    setCargando(false);
  };

  const handleRegistrar = async () => {
    try {
      await registrarLectura({
        medidor_id: form.medidor_id,
        valor: parseFloat(form.valor)
      });
      setModalVisible(false);
      setForm({ medidor_id: '', valor: '' });
      buscarLecturas();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Medidor</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Ingrese código del medidor"
            />
          </div>
        </div>
        <button
          onClick={buscarLecturas}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all"
        >
          <Filter size={16} /> Filtrar
        </button>
        <button
          onClick={() => setModalVisible(true)}
          className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} /> Registrar Lectura
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Medidor</th>
                  <th className="px-4 py-3">Suscriptor</th>
                  <th className="px-4 py-3 text-right">Valor (m³)</th>
                  <th className="px-4 py-3">Lecturista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lecturas.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.fecha_lectura).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 font-mono text-sm">{l.suscriptor_medidor_id || '-'}</td>
                    <td className="px-4 py-3 text-sm">{l.suscriptor_nombre || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{l.valor?.toLocaleString()} m³</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{l.lecturista_nombre || 'Sistema'}</td>
                  </tr>
                ))}
                {lecturas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Presione "Filtrar" o "Registrar Lectura" para comenzar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Lectura */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Registrar Lectura</h3>
            <p className="text-sm text-gray-500 mb-6">Ingrese el medidor y el valor actual</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Medidor</label>
                <input
                  type="text"
                  value={form.medidor_id}
                  onChange={(e) => setForm({ ...form, medidor_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ej: MED001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor del Medidor (m³)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-2xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="0"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrar}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all"
                >
                  Guardar Lectura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ VISTA: FACTURACIÓN ============ */
function VistaFacturacion({ suscriptores }) {
  const [periodos, setPeriodos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [activa, setActiva] = useState('generar');
  const [pendientePago, setPendientePago] = useState({ mes: '', anio: '' });

  useEffect(() => {
    (async () => {
      setPeriodos(await obtenerPeriodos());
    })();
  }, []);

  const handleGenerarFacturas = async (mes, anio, tarifa) => {
    try {
      const r = await generarFacturas({ mes: parseInt(mes), anio: parseInt(anio), tarifa: parseFloat(tarifa) || 1500 });
      alert(`Se generaron ${r.length} facturas`);
      setFacturas(await obtenerFacturas());
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  useEffect(() => {
    (async () => {
      setFacturas(await obtenerFacturas());
    })();
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiva('generar')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activa === 'generar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Generar Facturas
        </button>
        <button
          onClick={() => setActiva('lista')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activa === 'lista' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Listado de Facturas
        </button>
      </div>

      {/* Generar Facturas */}
      {activa === 'generar' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generar Facturas del Período</h3>
          <GeneradorFacturas periodos={periodos} onGenerar={handleGenerarFacturas} crearPeriodo={crearPeriodo} />
        </div>
      )}

      {/* Listado */}
      {activa === 'lista' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Medidor</th>
                  <th className="px-4 py-3">Suscriptor</th>
                  <th className="px-4 py-3">Consumo</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3 text-right">Abonos</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {facturas.map((f, i) => {
                  const saldo = f.monto - f.monto_pagado - f.abonos;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm">{f.suscriptor_medidor_id}</td>
                      <td className="px-4 py-3 text-sm">{f.suscriptor_nombre}</td>
                      <td className="px-4 py-3 text-sm">{f.consumo} m³</td>
                      <td className="px-4 py-3 font-mono text-sm">${f.monto?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm text-green-600">${f.monto_pagado?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm text-blue-600">${f.abonos?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: saldo > 0 ? '#dc2626' : '#16a34a' }}>
                        ${saldo?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${f.estado === 'PAGADA' ? 'bg-green-100 text-green-700' : f.estado === 'VENCIDA' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {f.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {facturas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No hay facturas generadas aún. Use "Generar Facturas" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function GeneradorFacturas({ periodos, onGenerar, crearPeriodo }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [tarifa, setTarifa] = useState('1500');
  const [creandoPeriodo, setCreandoPeriodo] = useState(false);
  const [nuevoMes, setNuevoMes] = useState('');
  const [nuevoAnio, setNuevoAnio] = useState('');

  const periodoExistente = periodos.find(p => p.mes === parseInt(mes) && p.anio === parseInt(anio));

  const handleGenerar = () => {
    if (!periodoExistente) {
      alert('Primero cree el período o seleccione uno existente.');
      return;
    }
    if (periodoExistente.estado === 'CERRADO') {
      alert('Este período ya fue cerrado y facturado.');
      return;
    }
    onGenerar(mes, anio, tarifa);
  };

  const handleCrearPeriodo = async () => {
    if (!nuevoMes || !nuevoAnio) return;
    await crearPeriodo({ mes: parseInt(nuevoMes), anio: parseInt(nuevoAnio) });
    const updated = await obtenerPeriodos();
    // Recargar la página para obtener los periodos actualizados
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa $/m³</label>
          <input
            type="number"
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {periodoExistente ? (
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${
            periodoExistente.estado === 'CERRADO'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            Período: {periodoExistente.estado}
          </span>
        ) : (
          <span className="text-sm text-orange-500">Sin período creado</span>
        )}

        <button
          onClick={() => setCreandoPeriodo(!creandoPeriodo)}
          className="text-sm text-blue-600 hover:underline"
        >
          {creandoPeriodo ? 'Cancelar' : '+ Crear nuevo período'}
        </button>
      </div>

      {creandoPeriodo && (
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="number"
            placeholder="Mes"
            min="1" max="12"
            value={nuevoMes}
            onChange={(e) => setNuevoMes(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Año"
            value={nuevoAnio}
            onChange={(e) => setNuevoAnio(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button
            onClick={handleCrearPeriodo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Crear
          </button>
        </div>
      )}

      <button
        onClick={handleGenerar}
        disabled={!periodoExistente || periodoExistente.estado === 'CERRADO'}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Generar Facturas del Período
      </button>
    </div>
  );
}

/* ============ VISTA: PAGOS ============ */
function VistaPagos({ suscriptores }) {
  const [busqueda, setBusqueda] = useState('');
  const [pagos, setPagos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ medidor_id: '', monto: '', tipo: 'PAGO', metodo_pago: 'EFECTIVO', comentario: '', factura_id: '' });
  const [historial, setHistorial] = useState(true);
  const [facturasPend, setFacturasPend] = useState([]);

  const buscarPagos = async () => {
    const params = {};
    if (busqueda) params.medidor_id = busqueda;
    const result = await obtenerHistorialPagos(params);
    setPagos(result);
  };

  const buscarFacturasPend = async (medidor_id) => {
    const facts = await obtenerFacturas({ medidor_id, estado: 'PENDIENTE' });
    setFacturasPend(facts);
  };

  const handleRegistrar = async () => {
    try {
      const payload = {
        medidor_id: form.medidor_id,
        monto: parseFloat(form.monto),
        tipo: form.tipo,
        metodo_pago: form.metodo_pago,
        comentario: form.comentario,
      };
      if (form.factura_id) payload.factura_id = parseInt(form.factura_id);
      await registrarPago(payload);
      setModal(false);
      setForm({ medidor_id: '', monto: '', tipo: 'PAGO', metodo_pago: 'EFECTIVO', comentario: '', factura_id: '' });
      buscarPagos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div>
      {/* Resumen rápido */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => { setHistorial(true); setForm({ ...form, tipo: 'PAGO' }); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${historial ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'}`}
        >
          Historial de Pagos
        </button>
        <button
          onClick={() => { setHistorial(false); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${!historial ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'}`}
        >
          Registrar Pago/Abono
        </button>
      </div>

      {historial ? (
        /* HISTORIAL */
        <div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar por medidor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarPagos()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <button
              onClick={buscarPagos}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
              <Filter size={16} /> Buscar
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Medidor</th>
                    <th className="px-4 py-3">Suscriptor</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3">Registró</th>
                    <th className="px-4 py-3">Comentario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagos.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.fecha_pago).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.tipo === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{p.suscriptor_medidor_id}</td>
                      <td className="px-4 py-3 text-sm">{p.suscriptor_nombre}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-right">${p.monto?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{p.metodo_pago}</td>
                      <td className="px-4 py-3 text-sm">{p.registrado_por_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{p.comentario || '-'}</td>
                    </tr>
                  ))}
                  {pagos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Presione "Buscar" para ver el historial
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRAR */
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Registrar Pago o Abono</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="PAGO">PAGO</option>
                <option value="ABONO">ABONO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select
                value={form.metodo_pago}
                onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código del Medidor</label>
            <input
              type="text"
              value={form.medidor_id}
              onChange={(e) => {
                setForm({ ...form, medidor_id: e.target.value });
                buscarFacturasPend(e.target.value);
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Ej: MED001"
              required
            />
          </div>

          {facturasPend.length > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-2">Facturas pendientes encontradas:</p>
              <select
                value={form.factura_id}
                onChange={(e) => setForm({ ...form, factura_id: e.target.value })}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white"
              >
                <option value="">— Seleccionar factura —</option>
                {facturasPend.map((f, i) => (
                  <option key={i} value={f.id}>
                    Factura #{f.id} — ${f.monto?.toLocaleString()} (Saldo: ${(f.monto - f.monto_pagado - f.abonos)?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="100"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
            <textarea
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Ej: Pago en efectivo en oficina"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrar}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all"
            >
              Registrar {form.tipo}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ VISTA: PERIODOS ============ */
function VistaPeriodos() {
  const [periodos, setPeriodos] = useState([]);

  useEffect(() => {
    (async () => setPeriodos(await obtenerPeriodos()))();
  }, []);

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periodos.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][p.mes - 1]}
                  </td>
                  <td className="px-4 py-3">{p.anio}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.estado === 'CERRADO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {p.fecha_cierre ? new Date(p.fecha_cierre).toLocaleDateString('es-CO') : '-'}
                  </td>
                </tr>
              ))}
              {periodos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No hay períodos creados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ COMPONENTE PRINCIPAL ============ */
export default function ModuloAdministrador() {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState('Inicio');
  const [suscriptores, setSuscriptores] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_suscriptores: 0, suscriptores_activos: 0, suscriptores_cortados: 0,
    facturas_pendientes: 0, facturas_pagadas: 0, total_deuda: 0,
    ultima_lectura: null, total_lecturas: 0, total_pagos: 0
  });
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [susc, dash] = await Promise.all([
        obtenerSuscriptores(),
        obtenerDashboard()
      ]);
      setSuscriptores(susc);
      setDashboard(dash);
    } catch (err) {
      if (err.message?.includes('token') || err.message?.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleCrearSuscriptor = async (data) => {
    await crearSuscriptor(data);
    cargarDatos();
  };

  const handleEditarSuscriptor = async (id, data) => {
    await actualizarSuscriptor(id, data);
    cargarDatos();
  };

  const handleGestionCorte = async (medidorId, cortar) => {
    try {
      if (cortar) {
        await cortarServicio(medidorId);
        alert('Servicio cortado correctamente');
      } else {
        await reconectarServicio(medidorId);
        alert('Servicio reconectado correctamente');
      }
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const IconoActual = menuIcons[paginaActual] || Home;

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Menú Lateral */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <IconoActual size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Sinai SGA</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Panel Administrador</p>
            </div>
          </div>
        </div>

        <nav className="p-3 flex-1 space-y-0.5">
          {Object.entries(menuIcons).map(([nombre, Icono]) => (
            <button
              key={nombre}
              onClick={() => setPaginaActual(nombre)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                paginaActual === nombre
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icono size={18} />
              {nombre}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-0.5">Módulo</p>
              <h2 className="text-2xl font-bold text-gray-900">{paginaActual}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                {new Date().toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </header>

          {/* Renderizar vista según página */}
          {paginaActual === 'Inicio' && <VistaInicio dashboard={dashboard} suscriptores={suscriptores} />}
          {paginaActual === 'Suscriptores' && (
            <VistaSuscriptores
              suscriptores={suscriptores}
              onCrear={handleCrearSuscriptor}
              onEditar={handleEditarSuscriptor}
              onGestionCorte={handleGestionCorte}
            />
          )}
          {paginaActual === 'Lecturas' && <VistaLecturas />}
          {paginaActual === 'Facturacion' && <VistaFacturacion suscriptores={suscriptores} />}
          {paginaActual === 'Pagos' && <VistaPagos suscriptores={suscriptores} />}
          {paginaActual === 'Dashboard' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(dashboard, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}