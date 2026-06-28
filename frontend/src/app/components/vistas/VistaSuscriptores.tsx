import { useState } from 'react';
import { Search, Plus, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { ModalConfirmar } from '../shared/ModalConfirmar';

export default function VistaSuscriptores({ suscriptores, onCrear, onEditar, onGestionCorte }) {
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', medidor_id: '', direccion: '', telefono: '', email: '', documento: '', codigo_usuario: '', subsidio: '' });
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [paginaSuscriptores, setPaginaSuscriptores] = useState(1);
  const itemsPorPagina = 20;

  const filtrados = suscriptores.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.medidor_id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const suscriptoresPaginados = filtrados.slice(
    (paginaSuscriptores - 1) * itemsPorPagina,
    paginaSuscriptores * itemsPorPagina
  );
  const totalPaginasSuscriptores = Math.ceil(filtrados.length / itemsPorPagina);

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o medidor..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaSuscriptores(1); }}
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
              {suscriptoresPaginados.map((s) => (
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
      {totalPaginasSuscriptores > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Mostrando {(paginaSuscriptores - 1) * itemsPorPagina + 1}-{Math.min(paginaSuscriptores * itemsPorPagina, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaSuscriptores(p => Math.max(1, p - 1))}
              disabled={paginaSuscriptores === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPaginasSuscriptores, 5) }, (_, i) => {
              const inicio = Math.max(1, Math.min(paginaSuscriptores - 2, totalPaginasSuscriptores - 4));
              const numPagina = inicio + i;
              if (numPagina > totalPaginasSuscriptores) return null;
              return (
                <button
                  key={numPagina}
                  onClick={() => setPaginaSuscriptores(numPagina)}
                  className={`px-3 py-1.5 text-sm border rounded-lg ${
                    paginaSuscriptores === numPagina
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {numPagina}
                </button>
              );
            })}
            <button
              onClick={() => setPaginaSuscriptores(p => Math.min(totalPaginasSuscriptores, p + 1))}
              disabled={paginaSuscriptores === totalPaginasSuscriptores}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

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
