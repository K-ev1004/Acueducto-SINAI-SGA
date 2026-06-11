import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, DollarSign, FileText, AlertCircle, TrendingUp, Zap } from 'lucide-react';

const COLORS = { verde: '#16a34a', naranja: '#ea580c', rojo: '#dc2626', azul: '#2563eb' };

function KpiCard({ titulo, valor, icono: Icono, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icono size={22} style={{ color }} />
        </div>
        <span className="text-2xl font-bold font-mono" style={{ color }}>
          {typeof valor === 'number' ? valor.toLocaleString() : valor}
        </span>
      </div>
      <p className="text-sm text-gray-500 font-medium">{titulo}</p>
    </div>
  );
}

export default function VistaDashboard({ dashboard }) {
  if (!dashboard) return null;

  const estadosFactura = [
    { name: 'Pagadas', value: dashboard.facturas_pagadas || 0, color: COLORS.verde },
    { name: 'Pendientes', value: dashboard.facturas_pendientes || 0, color: COLORS.naranja },
    { name: 'Vencidas', value: dashboard.facturas_vencidas || 0, color: COLORS.rojo },
  ];

  const historial = dashboard.historial_mensual || [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Recaudo del Mes" valor={`$${(dashboard.recaudo_mes || 0).toLocaleString()}`} icono={DollarSign} color={COLORS.verde} />
        <KpiCard titulo="Deuda Total" valor={`$${(dashboard.total_deuda || 0).toLocaleString()}`} icono={AlertCircle} color={COLORS.rojo} />
        <KpiCard titulo="Tasa de Cobro" valor={`${dashboard.tasa_cobro || 0}%`} icono={TrendingUp} color={COLORS.azul} />
        <KpiCard titulo="Consumo Promedio" valor={`${dashboard.consumo_promedio || 0} m³`} icono={Zap} color={COLORS.naranja} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Recaudo últimos 6 meses */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Recaudo Mensual
          </h3>
          {historial.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historial}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Bar dataKey="recaudo" fill={COLORS.azul} radius={[4, 4, 0, 0]} name="Recaudo" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin datos históricos</p>
          )}
        </div>

        {/* Gráfico: Consumo últimos 6 meses */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-orange-500" /> Consumo Mensual (m³)
          </h3>
          {historial.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historial}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
                <Bar dataKey="consumo_total" fill={COLORS.naranja} radius={[4, 4, 0, 0]} name="Consumo" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin datos históricos</p>
          )}
        </div>

        {/* Gráfico: Estado de facturas (pastel) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" /> Estado de Facturas
          </h3>
          {dashboard.facturas_pagadas + dashboard.facturas_pendientes + dashboard.facturas_vencidas > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={estadosFactura}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {estadosFactura.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend verticalAlign="bottom" height={30} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin facturas generadas</p>
          )}
        </div>

        {/* Top 5 deudores */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> Top 5 Deudores
          </h3>
          {dashboard.top_deudores && dashboard.top_deudores.length > 0 ? (
            <div className="space-y-2">
              {dashboard.top_deudores.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-400 w-5">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">{d.medidor_id}</p>
                    </div>
                  </div>
                  <p className="font-bold text-red-600 font-mono text-sm">${d.deuda.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No hay deudores</p>
          )}
        </div>

        {/* Facturas generadas vs pagadas */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" /> Facturas: Generadas vs Pagadas
          </h3>
          {historial.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historial}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="facturas_generadas" fill={COLORS.azul} radius={[4, 4, 0, 0]} name="Generadas" />
                <Bar dataKey="facturas_pagadas" fill={COLORS.verde} radius={[4, 4, 0, 0]} name="Pagadas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin datos históricos</p>
          )}
        </div>
      </div>
    </div>
  );
}
