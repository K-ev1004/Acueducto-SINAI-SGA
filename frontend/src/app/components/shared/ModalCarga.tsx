export function ModalCarga({ isOpen, mensaje }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 font-semibold text-lg">{mensaje}</p>
        <p className="text-gray-400 text-sm mt-1">Espere un momento por favor...</p>
        <div className="mt-5 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}
