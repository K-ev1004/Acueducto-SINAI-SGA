import { AlertTriangle } from 'lucide-react';

export function ModalConfirmar({ isOpen, titulo, mensaje, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle size={28} />
          <h3 className="text-xl font-bold">{titulo}</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
