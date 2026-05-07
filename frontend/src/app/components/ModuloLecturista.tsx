import { useState, useEffect } from 'react';
import { Search, Check, X, ArrowLeft, LogOut } from 'lucide-react';
import { obtenerSuscriptores, enviarLecturaAutomatica } from '../../services/api';
import { logout } from '../../services/auth';
import { useNavigate } from 'react-router';

interface Suscriptor {
  id: number;
  representante: string;
  codigoVivienda: string;
  procesado: boolean;
  lecturaActual?: number;
  lecturaAnterior?: number;
}

export default function ModuloLecturista() {
  const [vista, setVista] = useState<'lista' | 'captura'>('lista');
  const [suscriptorSeleccionado, setSuscriptorSeleccionado] = useState<Suscriptor | null>(null);
  const [nuevaLectura, setNuevaLectura] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      const data = await obtenerSuscriptores();
      // Mapear los datos del backend al formato del frontend
      const formatData = data.map((item: any) => {
        // Obtenemos la última lectura si existe
        const ultimaLectura = item.lecturas && item.lecturas.length > 0 
          ? item.lecturas[item.lecturas.length - 1].valor 
          : 0;

        return {
          id: item.id,
          representante: item.nombre,
          codigoVivienda: item.medidor_id,
          procesado: false, // Por defecto, asumimos que no se ha procesado hoy
          lecturaAnterior: ultimaLectura
        };
      });
      setSuscriptores(formatData);
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const suscriptoresFiltrados = suscriptores.filter(s =>
    s.representante.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.codigoVivienda.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (suscriptor: Suscriptor) => {
    setSuscriptorSeleccionado(suscriptor);
    setVista('captura');
    setNuevaLectura('');
  };

  const handleGuardar = async () => {
    if (suscriptorSeleccionado && nuevaLectura) {
      const lecturaNum = parseInt(nuevaLectura);
      // Enviar la lectura al backend
      const res = await enviarLecturaAutomatica(suscriptorSeleccionado.codigoVivienda, lecturaNum);
      
      if (res && !res.error) {
        setSuscriptores(prev => prev.map(s =>
          s.id === suscriptorSeleccionado.id
            ? { ...s, procesado: true, lecturaActual: lecturaNum }
            : s
        ));
      } else {
        alert("Hubo un error al guardar la lectura en el servidor.");
      }
      
      setVista('lista');
      setSuscriptorSeleccionado(null);
      setNuevaLectura('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (vista === 'captura' && suscriptorSeleccionado) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-sinai-section overflow-hidden p-6 font-sans">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 mb-6">
          <button
            onClick={() => setVista('lista')}
            className="flex items-center gap-2 mb-4 text-gray-500 hover:text-sinai-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Volver a la lista</span>
          </button>
          <h2 className="text-xl text-sinai-text font-bold uppercase tracking-wide">CAPTURA DE LECTURA</h2>
          <p className="mt-2 text-lg text-sinai-text font-medium">{suscriptorSeleccionado.representante}</p>
          <p className="text-sm text-gray-500 font-mono">{suscriptorSeleccionado.codigoVivienda}</p>
        </div>

        {/* Datos Históricos */}
        <div className="bg-sinai-section rounded-lg p-5 mb-6 shadow-sm border border-blue-100">
          <h3 className="mb-4 text-sm font-semibold text-sinai-primary uppercase tracking-wider">Datos Históricos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Lectura Anterior:</span>
              <span className="bg-white px-3 py-1 rounded shadow-sm font-mono text-sinai-text font-semibold">{suscriptorSeleccionado.lecturaAnterior} m³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Consumo Promedio:</span>
              <span className="bg-white px-3 py-1 rounded shadow-sm font-mono text-gray-700">18 m³</span>
            </div>
          </div>
        </div>

        {/* Nueva Lectura */}
        <div className="mb-8">
          <label className="block mb-3 font-semibold text-gray-700 uppercase tracking-wide text-sm">NUEVA LECTURA</label>
          <div className="relative">
            <input
              type="number"
              value={nuevaLectura}
              onChange={(e) => setNuevaLectura(e.target.value)}
              placeholder="0"
              className="w-full bg-white border-2 border-gray-200 rounded-lg p-5 text-3xl text-center font-mono text-sinai-primary focus:outline-none focus:border-sinai-primary transition-all shadow-sm"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-medium">m³</span>
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleGuardar}
          disabled={!nuevaLectura}
          className="w-full bg-sinai-primary text-white rounded-lg p-4 text-lg font-semibold hover:bg-blue-600 transition-colors shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
        >
          GUARDAR Y VOLVER
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-sinai-section overflow-hidden min-h-[calc(100vh-100px)] font-sans">
      {/* Header */}
      <div className="bg-sinai-primary text-white p-6 rounded-b-xl shadow-sm mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">SINAI SGA</h1>
          <p className="text-blue-100 mt-1 font-medium">Módulo Lecturista</p>
        </div>
        <button onClick={handleLogout} className="text-white/80 hover:text-white p-2">
            <LogOut size={24} />
        </button>
      </div>

      <div className="px-6 pb-6">
        {/* Barra de búsqueda */}
        <div className="bg-sinai-bg rounded-lg p-3 mb-6 flex items-center gap-3 border border-gray-200 focus-within:border-sinai-primary transition-all shadow-sm">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sinai-text placeholder:text-gray-400"
          />
        </div>

        {/* Lista de Suscriptores */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 ml-1 uppercase tracking-wider">LISTA DE SUSCRIPTORES</h2>

          {cargando ? (
              <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-sinai-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
          ) : (
            suscriptoresFiltrados.map(suscriptor => (
              <div
                key={suscriptor.id}
                onClick={() => !suscriptor.procesado && handleSeleccionar(suscriptor)}
                className={`p-4 rounded-lg flex items-center justify-between transition-all border ${
                  suscriptor.procesado 
                    ? 'bg-sinai-success/30 border-green-100' 
                    : 'bg-white border-sinai-section shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-pointer hover:border-sinai-primary/50 hover:shadow-md'
                }`}
              >
                <div className="flex-1">
                  <p className={`font-semibold ${suscriptor.procesado ? 'text-gray-600' : 'text-sinai-text'}`}>
                    {suscriptor.representante}
                  </p>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{suscriptor.codigoVivienda}</p>
                </div>
                <div>
                  {suscriptor.procesado ? (
                    <div className="bg-sinai-success text-green-700 p-2 rounded-full shadow-sm">
                      <Check size={20} />
                    </div>
                  ) : (
                    <div className="text-gray-300">
                      <X size={20} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {!cargando && suscriptoresFiltrados.length === 0 && (
              <p className="text-center text-gray-500 mt-8 font-medium">No se encontraron suscriptores.</p>
          )}
        </div>

        {/* Contador */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-center text-gray-500 text-sm font-medium">
            Procesados: <span className="font-mono font-bold text-sinai-primary">{suscriptores.filter(s => s.procesado).length}</span> / {suscriptores.length}
          </p>
        </div>
      </div>
    </div>
  );
}
