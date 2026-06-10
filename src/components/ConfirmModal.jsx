// Custom confirm dialog (shared by the clicker reset/import actions).
export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center transform scale-95 animate-scale-in max-w-md w-full">
        <p className="text-xl text-gray-200 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-md transition-colors duration-200"
          >
            Confirmer
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-md transition-colors duration-200"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
