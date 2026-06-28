import { CheckCircle } from 'lucide-react';

export function ModalExito({ isOpen, mensaje, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-green-600 mb-4">
          <CheckCircle size={28} />
          <h3 className="text-xl font-bold">Éxito</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <button onClick={onClose} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
          Entendido
        </button>
      </div>
    </div>
  );
}
