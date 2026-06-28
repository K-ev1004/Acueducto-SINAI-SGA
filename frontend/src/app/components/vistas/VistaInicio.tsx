import { Users, DollarSign, CheckCircle, AlertCircle, FileText, Calendar, BarChart3, AlertTriangle, Shield } from 'lucide-react';

export default function VistaInicio({ dashboard, suscriptores }) {
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
