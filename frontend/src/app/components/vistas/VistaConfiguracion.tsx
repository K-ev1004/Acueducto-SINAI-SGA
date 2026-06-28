import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { obtenerConfiguracion, actualizarConfiguracion } from '../../../services/api';

export default function VistaConfiguracion() {
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
