import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Home, Users, BookOpen, FileText, BarChart3, Edit, LogOut, Plus, Check } from 'lucide-react';
import { obtenerSuscriptores, crearSuscriptor, obtenerLecturas, registrarPago } from '../../services/api';
import { logout } from '../../services/auth';

interface Usuario {
  id: string;
  nombre: string;
  estadoPago: 'Pagado' | 'Pendiente' | 'Vencido';
  lectura: number;
  consumo: number;
  monto: number;
}

export default function ModuloAdministrador() {
  const [menuSeleccionado, setMenuSeleccionado] = useState('Inicio');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const navigate = useNavigate();

  const cargarDatos = async () => {
    setCargando(true);
    const data = await obtenerSuscriptores();
    const formatData = data.map((item: any) => ({
      id: item.medidor_id,
      nombre: item.nombre,
      estadoPago: item.estadoPago,
      lectura: item.lectura_actual,
      consumo: item.consumo,
      monto: item.monto
    }));
    setUsuarios(formatData);
    
    if (menuSeleccionado === 'Lecturas') {
      const lecs = await obtenerLecturas();
      setLecturas(lecs);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [menuSeleccionado]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCrearSuscriptor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await crearSuscriptor(nuevoNombre, nuevoCodigo);
    if (res && !res.error) {
      setModalAbierto(false);
      setNuevoNombre('');
      setNuevoCodigo('');
      cargarDatos();
    } else {
      alert("Error al crear suscriptor");
    }
  };

  const handlePagar = async (medidor_id: string, monto: number) => {
    const res = await registrarPago(medidor_id, monto);
    if (res && !res.error) {
      alert("Pago registrado con éxito");
      cargarDatos();
    } else {
      alert("Error registrando pago");
    }
  };

  const menuItems = [
    { nombre: 'Inicio', icono: Home },
    { nombre: 'Suscriptores', icono: Users },
    { nombre: 'Lecturas', icono: BookOpen },
    { nombre: 'Facturación', icono: FileText },
    { nombre: 'Reportes', icono: BarChart3 },
  ];

  const totalUsuarios = usuarios.length;
  const montoRecaudado = usuarios
    .filter(u => u.estadoPago === 'Pagado')
    .reduce((sum, u) => sum + u.monto, 0);
  const deudaTotal = usuarios
    .filter(u => u.estadoPago !== 'Pagado')
    .reduce((sum, u) => sum + u.monto, 0);
  const lecturasPendientes = usuarios.filter(u => u.estadoPago !== 'Pagado').length;

  return (
    <div className="flex h-screen bg-sinai-bg overflow-hidden font-sans relative">
      
      {/* Modal Nuevo Suscriptor */}
      {modalAbierto && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-sinai-text mb-4">Registrar Nuevo Suscriptor</h2>
            <form onSubmit={handleCrearSuscriptor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" required
                  value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-sinai-primary outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código del Medidor</label>
                <input 
                  type="text" required
                  value={nuevoCodigo} onChange={(e) => setNuevoCodigo(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-sinai-primary outline-none uppercase font-mono"
                  placeholder="Ej: VIV-001"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 p-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-sinai-primary text-white rounded-lg hover:bg-blue-600 font-semibold shadow-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menú Lateral */}
      <aside className="w-72 bg-white shadow-sm flex flex-col z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-sinai-section p-2 rounded-lg text-sinai-primary">
            <Home size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sinai-text leading-tight">SINAI SGA</h1>
            <p className="text-sm text-gray-500 font-medium">Panel Administrador</p>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icono;
            return (
              <button
                key={item.nombre}
                onClick={() => setMenuSeleccionado(item.nombre)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${
                  menuSeleccionado === item.nombre 
                    ? 'bg-sinai-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-sinai-section hover:text-sinai-primary'
                }`}
              >
                <Icon size={20} />
                <span>{item.nombre}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-red-500 hover:bg-sinai-alert"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <p className="text-gray-500 font-medium mb-1 tracking-wide uppercase text-sm">Visión General</p>
              <h2 className="text-3xl font-bold text-sinai-text">{menuSeleccionado}</h2>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setModalAbierto(true)}
                className="px-5 py-2.5 rounded-lg bg-sinai-primary text-white shadow-sm hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
              >
                <Plus size={18} /> Nuevo Suscriptor
              </button>
            </div>
          </header>

          {cargando ? (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-sinai-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* VISTA: INICIO */}
              {menuSeleccionado === 'Inicio' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-sinai-section flex flex-col justify-between">
                      <div className="flex items-center gap-3 text-gray-500 mb-4">
                        <Users size={20} className="text-sinai-primary" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Total Usuarios</p>
                      </div>
                      <p className="text-4xl font-bold text-sinai-text font-mono">{totalUsuarios}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-sinai-section flex flex-col justify-between">
                      <div className="flex items-center gap-3 text-gray-500 mb-4">
                        <FileText size={20} className="text-sinai-success" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Monto Recaudado</p>
                      </div>
                      <p className="text-4xl font-bold text-green-600 font-mono">${montoRecaudado.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-sinai-section flex flex-col justify-between">
                      <div className="flex items-center gap-3 text-gray-500 mb-4">
                        <BookOpen size={20} className="text-sinai-alert" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Deuda Total</p>
                      </div>
                      <p className="text-4xl font-bold text-red-500 font-mono">${deudaTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-sinai-section p-8 text-center text-gray-500">
                    <p className="text-lg">Selecciona una opción del menú lateral para gestionar los datos.</p>
                  </div>
                </>
              )}

              {/* VISTA: SUSCRIPTORES */}
              {menuSeleccionado === 'Suscriptores' && (
                <div className="bg-white rounded-xl shadow-sm border border-sinai-section overflow-hidden mb-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-sinai-section/50 text-gray-600 text-sm tracking-wider uppercase">
                        <th className="p-4 font-semibold">ID Medidor</th>
                        <th className="p-4 font-semibold">Nombre</th>
                        <th className="p-4 font-semibold text-center">Estado</th>
                        <th className="p-4 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usuarios.map(u => (
                        <tr key={u.id} className="hover:bg-sinai-section/30 transition-colors">
                          <td className="p-4 font-mono text-gray-500">{u.id}</td>
                          <td className="p-4 font-medium text-sinai-text">{u.nombre}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide ${u.estadoPago === 'Pagado' ? 'bg-sinai-success text-green-700' : 'bg-sinai-alert text-red-700'}`}>{u.estadoPago}</span>
                          </td>
                          <td className="p-4 flex justify-center">
                            <button className="p-2 text-gray-400 hover:text-sinai-primary rounded-lg transition-colors"><Edit size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA: LECTURAS */}
              {menuSeleccionado === 'Lecturas' && (
                <div className="bg-white rounded-xl shadow-sm border border-sinai-section overflow-hidden mb-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-sinai-section/50 text-gray-600 text-sm tracking-wider uppercase">
                        <th className="p-4 font-semibold">Fecha</th>
                        <th className="p-4 font-semibold">Usuario</th>
                        <th className="p-4 font-semibold text-right">Lectura Tomada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lecturas.map((l: any, i) => (
                        <tr key={i} className="hover:bg-sinai-section/30 transition-colors">
                          <td className="p-4 text-gray-500">{new Date(l.fecha_lectura).toLocaleString()}</td>
                          <td className="p-4 font-medium text-sinai-text">{l.suscriptor_nombre}</td>
                          <td className="p-4 font-mono text-gray-600 text-right font-semibold">{l.valor} m³</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA: FACTURACION */}
              {menuSeleccionado === 'Facturación' && (
                <div className="bg-white rounded-xl shadow-sm border border-sinai-section overflow-hidden mb-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-sinai-section/50 text-gray-600 text-sm tracking-wider uppercase">
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Nombre</th>
                        <th className="p-4 font-semibold text-right">Consumo</th>
                        <th className="p-4 font-semibold text-right">Deuda</th>
                        <th className="p-4 font-semibold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usuarios.filter(u => u.monto > 0).map((u) => (
                        <tr key={u.id} className="hover:bg-sinai-section/30 transition-colors">
                          <td className="p-4 font-mono text-sm text-gray-500">{u.id}</td>
                          <td className="p-4 font-medium text-sinai-text">{u.nombre}</td>
                          <td className="p-4 font-mono text-gray-600 text-right">{u.consumo} m³</td>
                          <td className="p-4 font-mono font-medium text-sinai-text text-right">${u.monto.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handlePagar(u.id, u.monto)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mx-auto"
                            >
                              <Check size={16} /> Marcar Pagado
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA: REPORTES */}
              {menuSeleccionado === 'Reportes' && (
                <div className="bg-white rounded-xl shadow-sm border border-sinai-section p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
                    <BarChart3 size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg">El módulo de reportes gráficos y exportación a Excel/PDF estará disponible próximamente.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
