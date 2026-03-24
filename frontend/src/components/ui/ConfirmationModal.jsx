export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-dark-200 rounded-xl p-6 max-w-md w-full mx-4 border border-dark-100">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-grayCustom-medium mt-2">{message}</p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-100 hover:bg-dark-300 text-grayCustom-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }