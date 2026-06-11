import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, CheckCircle, XCircle, ArrowLeft, LogOut,
  Plus, Filter, Users, Clock, AlertCircle, Calendar
} from 'lucide-react';
import {
  obtenerSuscriptores, registrarLectura, obtenerHistorialLecturas,
  obtenerDashboard, obtenerPeriodoActual
} from '../../services/api';
import { logout, isAuthenticated, getUserRole } from '../../services/auth';

export default function ModuloLecturista() {
  const navigate = useNavigate();
  const [vista, setVista] = useState<'lista' | 'captura'>('lista');
  const [suscriptorSeleccionado, setSuscriptorSeleccionado] = useState<any>(null);
  const [nuevaLectura, setNuevaLectura] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [suscriptores, setSuscriptores] = useState<any[]>([]);
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mesFiltro, setMesFiltro] = useState('');
  const [totalProcesados, setTotalProcesados] = useState(0);
  const [dashboard, setDashboard] = useState<any>(null);
  const [periodoActual, setPeriodoActual] = useState<any>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [data, dash, periodo] = await Promise.all([
        obtenerSuscriptores(),
        obtenerDashboard(),
        obtenerPeriodoActual()
      ]);

      const lecturasAll = await obtenerHistorialLecturas();

      const lecturasEnPeriodo = periodo?.id
        ? lecturasAll.filter((l: any) => l.periodo === periodo.id)
        : [];

      const medidoresProcesados = new Set(
        lecturasEnPeriodo.map((l: any) => l.suscriptor_medidor_id)
      );

      const formatData = data.map((item: any) => {
        const lecturasItem = lecturasAll.filter(
          (l: any) => l.suscriptor_medidor_id === item.medidor_id
        );
        const ultimaLectura = lecturasItem.length > 0
          ? lecturasItem[0].valor
          : 0;

        return {
          ...item,
          procesado: medidoresProcesados.has(item.medidor_id),
          lecturaAnterior: ultimaLectura,
          ultimaFecha: lecturasItem.length > 0
            ? lecturasItem[0].fecha_lectura
            : null
        };
      });

      setSuscriptores(formatData);
      setLecturas(lecturasAll);
      setDashboard(dash);
      setPeriodoActual(periodo);
      setTotalProcesados(medidoresProcesados.size);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('token')) {
        logout();
        navigate('/login');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Verificar rol
    const role = getUserRole();
    if (role !== 'Lecturista' && role !== 'Administrador' && role !== 'SuperAdmin') {
      navigate('/login');
      return;
    }

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suscriptoresFiltrados = suscriptores.filter(s =>
    s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.medidor_id?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.direccion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (suscriptor: any) => {
    setSuscriptorSeleccionado(suscriptor);
    setVista('captura');
    setNuevaLectura('');
  };

  const handleGuardar = async () => {
    if (!suscriptorSeleccionado || !nuevaLectura) return;

    const lecturaNum = parseFloat(nuevaLectura);

    if (isNaN(lecturaNum) || lecturaNum < 0) {
      alert('Ingrese un valor válido para la lectura');
      return;
    }

    // Validar que la nueva lectura sea mayor a la anterior
    if (suscriptorSeleccionado.lecturaAnterior && lecturaNum < suscriptorSeleccionado.lecturaAnterior) {
      alert(`La nueva lectura (${lecturaNum}) no puede ser menor que la anterior (${suscriptorSeleccionado.lecturaAnterior})`);
      return;
    }

    try {
      const res = await registrarLectura({
        medidor_id: suscriptorSeleccionado.medidor_id,
        valor: lecturaNum
      });

      console.log('Lectura registrada:', res);

      // Actualizar estado local
      setSuscriptores(prev => prev.map(s =>
        s.medidor_id === suscriptorSeleccionado.medidor_id
          ? { ...s, procesado: true, lecturaActual: lecturaNum }
          : s
      ));

      setTotalProcesados(prev => prev + 1);

      // Volver a la lista
      setVista('lista');
      setSuscriptorSeleccionado(null);
      setNuevaLectura('');
    } catch (err: any) {
      console.error('Error al guardar lectura:', err);
      alert('Error al guardar la lectura: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Vista de captura de lectura individual
  if (vista === 'captura' && suscriptorSeleccionado) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setVista('lista')} className="text-gray-500 hover:text-blue-600">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Captura de Lectura</h2>
              <p className="text-sm text-gray-500">{suscriptorSeleccionado.nombre}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1">
            <LogOut size={16} /> Salir
          </button>
        </div>

        <div className="max-w-lg mx-auto p-6">
          {/* Info del suscriptor */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Medidor</p>
                <p className="font-mono font-bold text-blue-900">{suscriptorSeleccionado.medidor_id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Dirección</p>
                <p className="text-blue-900">{suscriptorSeleccionado.direccion || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Lectura Anterior</p>
                <p className="font-mono font-bold text-blue-900">{suscriptorSeleccionado.lecturaAnterior || 0} m³</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Última Fecha</p>
                <p className="text-blue-900 text-xs">
                  {suscriptorSeleccionado.ultimaFecha
                    ? new Date(suscriptorSeleccionado.ultimaFecha).toLocaleDateString('es-CO')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Ingreso de lectura */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              NUEVA LECTURA (m³)
            </label>
            <div className="relative">
              <input
                type="number"
                value={nuevaLectura}
                onChange={(e) => setNuevaLectura(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-4xl text-center font-mono text-blue-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                min="0"
                step="any"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                m³
              </span>
            </div>

            {suscriptorSeleccionado.lecturaAnterior > 0 && nuevaLectura && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700">
                  Consumo estimado:{' '}
                  <span className="font-bold text-lg">
                    {(parseFloat(nuevaLectura) - suscriptorSeleccionado.lecturaAnterior).toFixed(2)} m³
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={!nuevaLectura || parseFloat(nuevaLectura) < 0}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed"
          >
            <CheckCircle size={24} className="inline mr-2" />
            GUARDAR LECTURA
          </button>
        </div>
      </div>
    );
  }

  // Vista principal de lista
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sinai SGA</h1>
          <p className="text-xs text-gray-500 font-medium">Módulo Lecturista</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-lg border">
            {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 flex items-center gap-1">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Banner del período actual */}
        {periodoActual && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-6 text-white shadow-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <p className="font-bold text-lg">{periodoActual.nombre_mes} {periodoActual.anio}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                periodoActual.estado === 'ABIERTO' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-100'
              }`}>
                {periodoActual.estado}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-blue-100">
                Lecturas: <span className="font-bold text-white">{periodoActual.lecturas_tomadas}</span> / {periodoActual.total_activos}
              </p>
              <p className="text-sm text-blue-100">
                <span className="font-bold text-white">{periodoActual.porcentaje_lecturas}%</span> completado
              </p>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-2 mt-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${periodoActual.porcentaje_lecturas}%` }}
              />
            </div>
          </div>
        )}

        {/* Progreso del día */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-700">
              Lecturas del día: {totalProcesados} / {suscriptores.length}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              totalProcesados === suscriptores.length
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {totalProcesados === suscriptores.length ? 'COMPLETADO' : 'EN PROGRESO'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalProcesados / Math.max(1, suscriptores.length)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, medidor o dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        {/* Botón ver historial */}
        <button
          onClick={async () => {
            const hist = await obtenerHistorialLecturas();
            setLecturas(hist);
            setVista('historial');
          }}
          className="w-full mb-4 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Clock size={16} />
          Ver historial de lecturas
        </button>

        {/* Lista de suscriptores */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {suscriptoresFiltrados.length} suscriptores
            </p>
            <p className="text-xs text-gray-400">
              Procesados hoy: <span className="font-bold text-blue-600">{totalProcesados}</span>
            </p>
          </div>

          {suscriptoresFiltrados.map((s) => (
            <div
              key={s.medidor_id}
              onClick={() => !s.procesado && handleSeleccionar(s)}
              className={`p-4 rounded-xl border transition-all ${
                s.procesado
                  ? 'bg-green-50 border-green-200 cursor-default opacity-70'
                  : 'bg-white border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${
                      s.procesado ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {s.nombre}
                    </p>
                    {s.procesado && (
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs font-mono text-gray-400">{s.medidor_id}</p>
                    <span className="text-xs text-gray-300">•</span>
                    <p className="text-xs text-gray-400 truncate">{s.direccion || 'Sin dirección'}</p>
                  </div>
                  {s.lecturaAnterior > 0 && (
                    <p className="text-xs text-blue-500 mt-1">
                      Última lectura: {s.lecturaAnterior} m³
                      {s.ultimaFecha && (
                        <span className="text-gray-400">
                          {' '}({new Date(s.ultimaFecha).toLocaleDateString('es-CO')})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 ml-3">
                  {s.procesado ? (
                    <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      OK
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                      PENDIENTE
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {suscriptoresFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">
                {busqueda ? 'No se encontraron resultados' : 'No hay suscriptores registrados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}