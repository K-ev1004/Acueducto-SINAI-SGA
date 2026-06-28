import { useState, useEffect } from 'react';
import { Search, Users, Printer, CheckCircle } from 'lucide-react';
import { obtenerPlanillaCobro, obtenerHistorialPagos, pagoRapido, descargarReciboPago } from '../../../services/api';

export default function VistaCobrosPagos() {
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
  const [busquedaPlanilla, setBusquedaPlanilla] = useState('');
  const [paginaCobros, setPaginaCobros] = useState(1);
  const itemsPorPagina = 20;

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

  const facturasFiltradas = busquedaPlanilla
    ? facturas.filter(f =>
        f.suscriptor.toLowerCase().includes(busquedaPlanilla.toLowerCase()) ||
        f.medidor_id.toLowerCase().includes(busquedaPlanilla.toLowerCase())
      )
    : facturas;

  const facturasPaginadas = facturasFiltradas.slice(
    (paginaCobros - 1) * itemsPorPagina,
    paginaCobros * itemsPorPagina
  );
  const totalPaginasCobros = Math.ceil(facturasFiltradas.length / itemsPorPagina);

  return (
    <div>
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
        <div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o medidor en planilla..."
                value={busquedaPlanilla}
                onChange={(e) => { setBusquedaPlanilla(e.target.value); setPaginaCobros(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase">Facturas Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{facturasFiltradas.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase">Saldo Total Pendiente</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ${facturasFiltradas.reduce((s, f) => s + f.saldo, 0).toLocaleString()}
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
                  {facturasPaginadas.map((f, i) => (
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
                  {facturasFiltradas.length === 0 && !cargando && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                        {busquedaPlanilla ? 'No se encontraron facturas con ese nombre o medidor' : 'No hay facturas pendientes de cobro'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalPaginasCobros > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">
                Mostrando {(paginaCobros - 1) * itemsPorPagina + 1}-{Math.min(paginaCobros * itemsPorPagina, facturasFiltradas.length)} de {facturasFiltradas.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaCobros(p => Math.max(1, p - 1))}
                  disabled={paginaCobros === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(totalPaginasCobros, 5) }, (_, i) => {
                  const inicio = Math.max(1, Math.min(paginaCobros - 2, totalPaginasCobros - 4));
                  const numPagina = inicio + i;
                  if (numPagina > totalPaginasCobros) return null;
                  return (
                    <button
                      key={numPagina}
                      onClick={() => setPaginaCobros(numPagina)}
                      className={`px-3 py-1.5 text-sm border rounded-lg ${
                        paginaCobros === numPagina
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {numPagina}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPaginaCobros(p => Math.min(totalPaginasCobros, p + 1))}
                  disabled={paginaCobros === totalPaginasCobros}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
