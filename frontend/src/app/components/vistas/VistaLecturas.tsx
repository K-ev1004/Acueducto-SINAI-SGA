import { useState } from 'react';
import { Search, Filter, Plus, Calendar } from 'lucide-react';
import { obtenerHistorialLecturas, registrarLectura } from '../../../services/api';

export default function VistaLecturas() {
  const [busqueda, setBusqueda] = useState('');
  const [lecturas, setLecturas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ medidor_id: '', valor: '' });
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

  const buscarLecturas = async () => {
    setCargando(true);
    const params = { mes: mesFiltro, anio: anioFiltro };
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

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div>
      <div className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(parseInt(e.target.value))}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {meses.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(parseInt(e.target.value))}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
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
