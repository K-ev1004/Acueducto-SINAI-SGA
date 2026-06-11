import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Home, Users, FileText, BarChart3, Plus, Edit, Trash2,
  LogOut, Search, Eye, DollarSign, CheckCircle, AlertCircle,
  Calendar, Filter, Printer, RefreshCw, AlertTriangle, Shield,
  Clock, Settings, Mail
} from 'lucide-react';
import {
  obtenerSuscriptores, crearSuscriptor, obtenerDetalleSuscriptor,
  actualizarSuscriptor, registrarLectura, obtenerHistorialLecturas,
  obtenerHistorialPagos, obtenerFacturas, generarFacturas,
  obtenerPeriodos, crearPeriodo, obtenerDashboard, cortarServicio,
  reconectarServicio, descargarPDFFactura, descargarLotePDF,
  obtenerConfiguracion, actualizarConfiguracion,
  enviarFacturaEmail, descargarReciboPago,
  obtenerPeriodoActual, obtenerPlanillaCobro, pagoRapido
} from '../../services/api';
import { logout } from '../../services/auth';
import VistaDashboard from './VistaDashboard';

/* ============ ICONOS PARA EL MENÚ ============ */
const menuIcons = {
  Inicio: Home,
  Suscriptores: Users,
  Lecturas: FileText,
  Facturacion: DollarSign,
  Cobros: DollarSign,
  Configuracion: Settings,
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
    { titulo: 'Suscriptores Activos', valor: dashboard.suscriptores_activos || suscriptores.filter(s => s.estado_servicio === 'ACTIVO').length, icono: Users, color: 'blue' },
    { titulo: 'Recaudo del Mes', valor: `$${(dashboard.recaudo_mes || 0).toLocaleString()}`, icono: DollarSign, color: 'green' },
    { titulo: 'Tasa de Cobro', valor: dashboard.tasa_cobro ? `${dashboard.tasa_cobro}%` : '0%', icono: CheckCircle, color: 'green' },
    { titulo: 'Deuda Pendiente', valor: `$${Number(dashboard.total_deuda || 0).toLocaleString()}`, icono: AlertCircle, color: 'red' },
    { titulo: 'Facturas Pendientes', valor: dashboard.facturas_pendientes || 0, icono: FileText, color: 'orange' },
    { titulo: 'Facturas Vencidas', valor: dashboard.facturas_vencidas || 0, icono: AlertCircle, color: 'red' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {dashboard.periodo_actual && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 shadow-sm text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar size={18} /> Período Actual
              </h3>
              <span className="text-xs px-2 py-1 bg-white/20 rounded-full font-semibold">
                {dashboard.periodo_actual.estado}
              </span>
            </div>
            <p className="text-lg font-bold">{dashboard.periodo_actual.nombre}</p>
            <div className="flex justify-between mt-3 text-sm text-blue-100">
              <span>Lecturas: {dashboard.periodo_actual.lecturas_tomadas}/{dashboard.periodo_actual.total_activos}</span>
              <span>{dashboard.periodo_actual.porcentaje}%</span>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-2 mt-1">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${dashboard.periodo_actual.porcentaje}%` }} />
            </div>
            {dashboard.periodo_actual.puede_cerrarse && (
              <p className="text-green-200 text-xs mt-2 flex items-center gap-1">
                <CheckCircle size={12} /> Todas las lecturas completas
              </p>
            )}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> Resumen
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Consumo Promedio</p>
              <p className="font-bold text-gray-800">{dashboard.consumo_promedio || 0} m³</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Total Suscriptores</p>
              <p className="font-bold text-gray-800">{dashboard.total_suscriptores}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Recaudo Mes Ant.</p>
              <p className="font-bold text-gray-800">${(dashboard.recaudo_mes_anterior || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Suscriptores Cortados</p>
              <p className="font-bold text-red-600">{dashboard.suscriptores_cortados || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {dashboard.top_deudores && dashboard.top_deudores.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Top 5 Deudores
          </h3>
          <div className="space-y-2">
            {dashboard.top_deudores.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.nombre}</p>
                  <p className="text-xs text-gray-400 font-mono">{d.medidor_id}</p>
                </div>
                <p className="font-bold text-red-600 font-mono">${d.deuda.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <Shield size={16} />
          <span>Sistema Seguro — Autenticación JWT, CORS restringido, rate limiting y auditoría activa.</span>
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
  const [form, setForm] = useState({ nombre: '', medidor_id: '', direccion: '', telefono: '', email: '', documento: '', codigo_usuario: '', subsidio: '' });
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
      setForm({ nombre: '', medidor_id: '', direccion: '', telefono: '', email: '', documento: '', codigo_usuario: '', subsidio: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirModal = (s = null) => {
    if (s) {
      setEditando(s);
      setForm({ nombre: s.nombre, medidor_id: s.medidor_id, direccion: s.direccion, telefono: s.telefono || '', email: s.email || '', documento: s.documento || '', codigo_usuario: s.codigo_usuario || '', subsidio: s.subsidio || '' });
    } else {
      setEditando(null);
      setForm({ nombre: '', medidor_id: '', direccion: '', telefono: '', email: '', documento: '', codigo_usuario: '', subsidio: '' });
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
                        <button onClick={() => onGestionCorte(s.id, true)} title="Cortar servicio" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <AlertTriangle size={15} />
                        </button>
                      ) : (
                        <button onClick={() => onGestionCorte(s.id, false)} title="Reconectar servicio" className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Ej: 3001234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                  <input
                    type="text"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Ej: 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Usuario</label>
                  <input
                    type="text"
                    value={form.codigo_usuario}
                    onChange={(e) => setForm({ ...form, codigo_usuario: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Ej: U001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subsidio ($)</label>
                <input
                  type="number"
                  min="0"
                  value={form.subsidio}
                  onChange={(e) => setForm({ ...form, subsidio: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="0"
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
  const [facturas, setFacturas] = useState([]);
  const [periodoActual, setPeriodoActual] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [cerrando, setCerrando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [facts, periodo] = await Promise.all([
        obtenerFacturas(),
        obtenerPeriodoActual()
      ]);
      setFacturas(facts);
      setPeriodoActual(periodo);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleCerrarYGenerar = async () => {
    if (!periodoActual || periodoActual.estado !== 'ABIERTO') return;
    if (!periodoActual.puede_cerrarse) {
      alert(periodoActual.mensaje_cierre || 'Aún faltan lecturas por tomar');
      return;
    }
    setCerrando(true);
    try {
      const r = await generarFacturas({ periodo_id: periodoActual.id });
      alert(r.mensaje);
      await cargarDatos();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCerrando(false);
    }
  };

  const handleDescargarLote = async () => {
    const periodos = await obtenerPeriodos();
    const ultimoCerrado = periodos.find(p => p.estado === 'CERRADO');
    if (!ultimoCerrado) {
      alert('No hay períodos cerrados con facturas');
      return;
    }
    try {
      await descargarLotePDF(ultimoCerrado.id);
    } catch (err) {
      alert('Error al descargar lote: ' + err.message);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Período Actual */}
      {periodoActual && (
        <div className={`rounded-xl p-5 mb-6 shadow-sm border ${
          periodoActual.estado === 'ABIERTO'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-transparent'
            : 'bg-white text-gray-900 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 mb-0.5">Período de Lectura</p>
              <h3 className="text-xl font-bold">{periodoActual.nombre_mes} {periodoActual.anio}</h3>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              periodoActual.estado === 'ABIERTO'
                ? 'bg-green-400/30 text-green-100'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {periodoActual.estado}
            </span>
          </div>

          {periodoActual.estado === 'ABIERTO' && (
            <>
              <div className="flex justify-between mt-4 text-sm">
                <span>Lecturas: {periodoActual.lecturas_tomadas}/{periodoActual.total_activos}</span>
                <span>{periodoActual.porcentaje_lecturas}%</span>
              </div>
              <div className="w-full bg-blue-400/30 rounded-full h-2.5 mt-1">
                <div className="bg-white h-2.5 rounded-full transition-all" style={{ width: `${periodoActual.porcentaje_lecturas}%` }} />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCerrarYGenerar}
                  disabled={!periodoActual.puede_cerrarse || cerrando}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
                    periodoActual.puede_cerrarse
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {cerrando ? 'Cerrando...' : periodoActual.puede_cerrarse
                    ? 'Cerrar período y generar facturas'
                    : 'Faltan lecturas'}
                </button>
              </div>
              {!periodoActual.puede_cerrarse && periodoActual.mensaje_cierre && (
                <p className="text-yellow-200 text-xs mt-2">{periodoActual.mensaje_cierre}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Listado de Facturas */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Facturas Generadas</h3>
        <button
          onClick={handleDescargarLote}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Printer size={16} />
          Descargar lote PDF
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">N° Factura</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Medidor</th>
                <th className="px-4 py-3">Suscriptor</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Vence</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturas.map((f, i) => {
                const saldo = f.monto - f.monto_pagado - f.abonos;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.numero_factura || `#${f.id}`}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{f.periodo_info || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{f.suscriptor_medidor_id}</td>
                    <td className="px-4 py-3 text-sm">{f.suscriptor_nombre}</td>
                    <td className="px-4 py-3 font-mono text-sm text-right">${f.monto?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-right" style={{ color: saldo > 0 ? '#dc2626' : '#16a34a' }}>
                      ${saldo?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        f.estado === 'PAGADA' ? 'bg-green-100 text-green-700'
                          : f.estado === 'VENCIDA' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 text-center">
                      {f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => descargarPDFFactura(f.id)}
                          title="Descargar PDF"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Printer size={15} />
                        </button>
                        {f.suscriptor_email && (
                          <button
                            onClick={async () => {
                              try {
                                await enviarFacturaEmail(f.id);
                                alert('Factura enviada por email');
                              } catch (err) {
                                alert('Error: ' + err.message);
                              }
                            }}
                            title="Enviar por email"
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Mail size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No hay facturas generadas aún. Complete las lecturas y cierre el período para generar facturas.
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

/* ============ VISTA: PAGOS ============ */


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

/* ============ VISTA: PLANILLA DE COBRO ============ */
function VistaCobrosPagos() {
  const [facturas, setFacturas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalPago, setModalPago] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [tipoPago, setTipoPago] = useState('PAGO');
  const [busqueda, setBusqueda] = useState('');
  const [pagos, setPagos] = useState([]);
  const [historialVisible, setHistorialVisible] = useState(false);

  const cargar = async (pid) => {
    setCargando(true);
    try {
      const data = await obtenerPlanillaCobro(pid ? { periodo_id: parseInt(pid) } : {});
      setFacturas(data.facturas || []);
      setPeriodos(data.periodos_disponibles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(periodoId); }, [periodoId]);

  const buscarPagos = async () => {
    if (!busqueda) return;
    try {
      const result = await obtenerHistorialPagos({ medidor_id: busqueda });
      setPagos(result);
      setHistorialVisible(true);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handlePagoRapido = async () => {
    if (!modalPago || !montoPago) return;
    try {
      await pagoRapido({
        factura_id: modalPago.factura_id,
        monto: parseFloat(montoPago),
        metodo_pago: 'EFECTIVO',
        tipo: tipoPago,
      });
      setModalPago(null);
      setMontoPago('');
      setTipoPago('PAGO');
      cargar(periodoId);
      if (historialVisible && busqueda) buscarPagos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirModal = (factura) => {
    setModalPago(factura);
    setMontoPago(String(factura.saldo));
    setTipoPago('PAGO');
  };

  return (
    <div>
      {/* Barra de búsqueda + filtro período */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por medidor para ver historial de pagos..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              if (!e.target.value) { setHistorialVisible(false); setPagos([]); }
            }}
            onKeyDown={(e) => e.key === 'Enter' && buscarPagos()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          className="w-48 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Todos los períodos</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {historialVisible && busqueda ? (
        /* Historial del suscriptor */
        <div>
          {pagos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{pagos[0].suscriptor_nombre}</p>
                <p className="text-xs text-gray-500 font-mono">{pagos[0].suscriptor_medidor_id}</p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3">Registró</th>
                    <th className="px-4 py-3">Comentario</th>
                    <th className="px-4 py-3 text-center">Recibo</th>
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
                      <td className="px-4 py-3 font-mono font-semibold text-right">${p.monto?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{p.metodo_pago}</td>
                      <td className="px-4 py-3 text-sm">{p.registrado_por_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{p.comentario || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => descargarReciboPago(p.id)}
                          title="Descargar recibo"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Printer size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pagos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                        No se encontraron pagos para este medidor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Planilla global */
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase">Facturas Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{facturas.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase">Saldo Total Pendiente</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ${facturas.reduce((s, f) => s + f.saldo, 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Suscriptor</th>
                    <th className="px-4 py-3">Medidor</th>
                    <th className="px-4 py-3">Factura</th>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-right">Abonos</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Vencida</th>
                    <th className="px-4 py-3 text-center">Cobrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {facturas.map((f, i) => (
                    <tr key={i} className={`hover:bg-gray-50 transition-colors ${f.dias_vencida > 0 ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.suscriptor}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{f.medidor_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.numero_factura}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{f.periodo}</td>
                      <td className="px-4 py-3 font-mono text-sm text-right">${f.monto.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm text-right text-blue-600">${f.abonos.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-right" style={{ color: f.saldo > 0 ? '#dc2626' : '#16a34a' }}>
                        ${f.saldo.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          f.estado === 'PAGADA' ? 'bg-green-100 text-green-700'
                            : f.estado === 'VENCIDA' ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.dias_vencida > 0 ? (
                          <span className="text-red-500 text-xs font-bold">{f.dias_vencida}d</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.saldo > 0 ? (
                          <button
                            onClick={() => abrirModal(f)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Cobrar
                          </button>
                        ) : (
                          <CheckCircle size={18} className="text-green-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {facturas.length === 0 && !cargando && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                        No hay facturas pendientes de cobro
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {modalPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p><span className="font-medium">Suscriptor:</span> {modalPago.suscriptor}</p>
              <p><span className="font-medium">Factura:</span> {modalPago.numero_factura}</p>
              <p><span className="font-medium">Período:</span> {modalPago.periodo}</p>
              <p><span className="font-medium">Saldo:</span> <span className="font-bold text-red-600">${modalPago.saldo.toLocaleString()}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTipoPago('PAGO'); setMontoPago(String(modalPago.saldo)); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tipoPago === 'PAGO' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  PAGO
                </button>
                <button
                  onClick={() => { setTipoPago('ABONO'); setMontoPago(''); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tipoPago === 'ABONO' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ABONO
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setModalPago(null); setTipoPago('PAGO'); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Cancelar
              </button>
              <button
                onClick={handlePagoRapido}
                disabled={!montoPago || parseFloat(montoPago) <= 0}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold text-sm shadow-sm transition-all"
              >
                Registrar {tipoPago}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ COMPONENTE PRINCIPAL ============ */
/* ============ VISTA: CONFIGURACIÓN ============ */
function VistaConfiguracion() {
  const [config, setConfig] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ tarifa_m3: 1500, cargo_aseo: 7000, cargo_reconexion: 50000, dias_plazo_pago: 15, nombre_empresa: '', nit_empresa: '', direccion_empresa: '', telefono_empresa: '', mensaje_pie: '' });

  useEffect(() => {
    (async () => {
      const c = await obtenerConfiguracion();
      setConfig(c);
      setForm({ tarifa_m3: c.tarifa_m3, cargo_aseo: c.cargo_aseo, cargo_reconexion: c.cargo_reconexion, dias_plazo_pago: c.dias_plazo_pago, nombre_empresa: c.nombre_empresa, nit_empresa: c.nit_empresa, direccion_empresa: c.direccion_empresa, telefono_empresa: c.telefono_empresa, mensaje_pie: c.mensaje_pie });
    })();
  }, []);

  const handleGuardar = async () => {
    try {
      const c = await actualizarConfiguracion(form);
      setConfig(c);
      setEditando(false);
      alert('Configuración guardada correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!editando) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Configuración General</h3>
          <button onClick={() => setEditando(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
            <Edit size={15} /> Editar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium text-gray-500">Empresa:</span> <span className="text-gray-900">{config.nombre_empresa}</span></div>
          <div><span className="font-medium text-gray-500">NIT:</span> <span className="text-gray-900">{config.nit_empresa || '-'}</span></div>
          <div><span className="font-medium text-gray-500">Dirección:</span> <span className="text-gray-900">{config.direccion_empresa || '-'}</span></div>
          <div><span className="font-medium text-gray-500">Teléfono:</span> <span className="text-gray-900">{config.telefono_empresa || '-'}</span></div>
          <div><span className="font-medium text-gray-500">Tarifa m³:</span> <span className="font-mono text-gray-900">${Number(config.tarifa_m3).toLocaleString()}</span></div>
          <div><span className="font-medium text-gray-500">Cargo Aseo:</span> <span className="font-mono text-gray-900">${Number(config.cargo_aseo).toLocaleString()}</span></div>
          <div><span className="font-medium text-gray-500">Cargo Reconexión:</span> <span className="font-mono text-gray-900">${Number(config.cargo_reconexion).toLocaleString()}</span></div>
          <div><span className="font-medium text-gray-500">Plazo pago:</span> <span className="text-gray-900">{config.dias_plazo_pago} días</span></div>
        </div>
        {config.mensaje_pie && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <span className="font-medium">Mensaje al pie:</span> {config.mensaje_pie}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Editar Configuración</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
            <input type="text" value={form.nombre_empresa} onChange={(e) => setForm({ ...form, nombre_empresa: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
            <input type="text" value={form.nit_empresa} onChange={(e) => setForm({ ...form, nit_empresa: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" value={form.direccion_empresa} onChange={(e) => setForm({ ...form, direccion_empresa: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="text" value={form.telefono_empresa} onChange={(e) => setForm({ ...form, telefono_empresa: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por m³ ($)</label>
            <input type="number" min="0" value={form.tarifa_m3} onChange={(e) => setForm({ ...form, tarifa_m3: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Aseo ($)</label>
            <input type="number" min="0" value={form.cargo_aseo} onChange={(e) => setForm({ ...form, cargo_aseo: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Reconexión ($)</label>
            <input type="number" min="0" value={form.cargo_reconexion} onChange={(e) => setForm({ ...form, cargo_reconexion: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Días de plazo para pago</label>
          <input type="number" min="1" max="60" value={form.dias_plazo_pago} onChange={(e) => setForm({ ...form, dias_plazo_pago: parseInt(e.target.value) || 15 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje al pie de la factura</label>
          <textarea rows={3} value={form.mensaje_pie} onChange={(e) => setForm({ ...form, mensaje_pie: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setEditando(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
          <button onClick={handleGuardar} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

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
          {paginaActual === 'Cobros' && <VistaCobrosPagos />}
          {paginaActual === 'Configuracion' && <VistaConfiguracion />}
          {paginaActual === 'Dashboard' && <VistaDashboard dashboard={dashboard} />}
        </div>
      </main>
    </div>
  );
}