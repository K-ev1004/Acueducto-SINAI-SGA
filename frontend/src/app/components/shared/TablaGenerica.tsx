export function TablaGenerica({ columnas, datos, acciones, filasVacias }) {
  if (datos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {filasVacias || "No se encontraron registros"}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {columnas.map((col, i) => (
              <th key={i} className="px-4 py-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {datos.map((fila, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columnas.map((col, j) => {
                const valor = col.accessor ? fila[col.accessor] : null;
                return (
                  <td key={j} className="px-4 py-3 text-sm">{valor ?? '-'}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
