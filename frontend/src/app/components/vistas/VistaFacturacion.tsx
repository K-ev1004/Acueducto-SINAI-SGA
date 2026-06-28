import { useState, useEffect } from 'react';
import { Printer, Mail, Calendar } from 'lucide-react';
import { obtenerFacturas, obtenerPeriodoActual, generarFacturas, obtenerPeriodos, descargarLotePDF, descargarPDFFactura, enviarFacturaEmail } from '../../../services/api';
import { ModalCarga } from '../shared/ModalCarga';

export default function VistaFacturacion() {
  const [facturas, setFacturas] = useState([]);
  const [periodoActual, setPeriodoActual] = useState<any>(null);
  const [periodosDisponibles, setPeriodosDisponibles] = useState([]);
  const [filtroPeriodoId, setFiltroPeriodoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [cargandoPDF, setCargandoPDF] = useState(false);
  const [paginaFacturas, setPaginaFacturas] = useState(1);
  const itemsPorPagina = 20;

  const cargarDatos = async (periodoId?) => {
    setCargando(true);
    try {
      const params = periodoId ? { periodo_id: periodoId } : {};
      const [facts, periodo, periodos] = await Promise.all([
        obtenerFacturas(params),
        obtenerPeriodoActual(),
        obtenerPeriodos()
      ]);
      setFacturas(facts);
      setPeriodoActual(periodo);
      setPeriodosDisponibles(periodos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(filtroPeriodoId || undefined); }, [filtroPeriodoId]);

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
    setCargandoPDF(true);
    try {
      const periodos = await obtenerPeriodos();
      const ultimoCerrado = periodos.find(p => p.estado === 'CERRADO');
      if (!ultimoCerrado) {
        alert('No hay períodos cerrados con facturas');
        return;
      }
      await descargarLotePDF(ultimoCerrado.id);
    } catch (err) {
      alert('Error al descargar lote: ' + err.message);
    } finally {
      setCargandoPDF(false);
    }
  };

  const facturasPaginadas = facturas.slice(
    (paginaFacturas - 1) * itemsPorPagina,
    paginaFacturas * itemsPorPagina
  );
  const totalPaginasFacturas = Math.ceil(facturas.length / itemsPorPagina);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
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

      <div className="flex items-center gap-3 mb-4">
        <Calendar size={18} className="text-gray-400" />
        <select
          value={filtroPeriodoId}
          onChange={(e) => { setFiltroPeriodoId(e.target.value); setPaginaFacturas(1); }}
          className="w-64 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Todos los períodos</option>
          {periodosDisponibles.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre_mes} {p.anio} — {p.estado}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Facturas Generadas</h3>
        <button
          onClick={handleDescargarLote}
          disabled={cargandoPDF}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          {cargandoPDF ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Printer size={16} />
          )}
          {cargandoPDF ? 'Descargando...' : 'Descargar lote PDF'}
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
              {facturasPaginadas.map((f, i) => {
                const saldo = f.monto - f.monto_pagado - f.abonos;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.numero_factura || `#${f.id}`}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{f.periodo_info || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{f.suscriptor_medidor_id}</td>
                    <td className="px-4 py-3 text-sm">{f.suscriptor_nombre}</td>
                    <td className="px-4 py-3 font-mono text-sm text-right">${f.monto?.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-mono text-sm font-semibold text-right ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
      {totalPaginasFacturas > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Mostrando {(paginaFacturas - 1) * itemsPorPagina + 1}-{Math.min(paginaFacturas * itemsPorPagina, facturas.length)} de {facturas.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaFacturas(p => Math.max(1, p - 1))}
              disabled={paginaFacturas === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPaginasFacturas, 5) }, (_, i) => {
              const inicio = Math.max(1, Math.min(paginaFacturas - 2, totalPaginasFacturas - 4));
              const numPagina = inicio + i;
              if (numPagina > totalPaginasFacturas) return null;
              return (
                <button
                  key={numPagina}
                  onClick={() => setPaginaFacturas(numPagina)}
                  className={`px-3 py-1.5 text-sm border rounded-lg ${
                    paginaFacturas === numPagina
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {numPagina}
                </button>
              );
            })}
            <button
              onClick={() => setPaginaFacturas(p => Math.min(totalPaginasFacturas, p + 1))}
              disabled={paginaFacturas === totalPaginasFacturas}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      <ModalCarga isOpen={cargandoPDF} mensaje="Generando y descargando facturas..." />
    </div>
  );
}
