import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Home, Users, FileText, DollarSign, Settings, BarChart3,
  LogOut
} from 'lucide-react';
import {
  obtenerSuscriptores, crearSuscriptor, actualizarSuscriptor,
  cortarServicio, reconectarServicio, obtenerDashboard
} from '../../services/api';
import { logout } from '../../services/auth';
import VistaDashboard from './VistaDashboard';
import VistaInicio from './vistas/VistaInicio';
import VistaSuscriptores from './vistas/VistaSuscriptores';
import VistaLecturas from './vistas/VistaLecturas';
import VistaFacturacion from './vistas/VistaFacturacion';
import VistaCobrosPagos from './vistas/VistaCobrosPagos';
import VistaConfiguracion from './vistas/VistaConfiguracion';

const menuIcons = {
  Inicio: Home, Suscriptores: Users, Lecturas: FileText,
  Facturacion: DollarSign, Cobros: DollarSign,
  Configuracion: Settings, Dashboard: BarChart3,
};

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

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

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
          {paginaActual === 'Facturacion' && <VistaFacturacion />}
          {paginaActual === 'Cobros' && <VistaCobrosPagos />}
          {paginaActual === 'Configuracion' && <VistaConfiguracion />}
          {paginaActual === 'Dashboard' && <VistaDashboard dashboard={dashboard} />}
        </div>
      </main>
    </div>
  );
}
