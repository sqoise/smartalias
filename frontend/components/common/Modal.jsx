'use client'

export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  type = 'alert', // 'alert', 'confirm', 'custom'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmButtonClass = 'text-white bg-green-600 hover:bg-green-700',
  cancelButtonClass = 'text-gray-700 bg-gray-200 hover:bg-gray-300'
}) {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const handleConfirm = () => {
    onConfirm?.()
    onClose?.()
  }

  const handleCancel = () => {
    onClose?.()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-96 mx-4 animate-in zoom-in-95 duration-300 ease-out">
        {title && (
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
        )}
        
        <div className="mb-6">
          {children}
        </div>
        
        <div className="flex gap-3">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={handleCancel}
                className={`flex-1 px-4 py-2 rounded cursor-pointer transition-colors duration-200 ${cancelButtonClass}`}
              >
                {cancelText}
              </button>
              <button 
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded cursor-pointer transition-colors duration-200 ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            </>
          ) : type === 'alert' ? (
            <button 
              onClick={handleCancel}
              className={`flex-1 px-4 py-2 rounded cursor-pointer transition-colors duration-200 ${cancelButtonClass}`}
            >
              Understood
            </button>
          ) : (
            // Custom type - render nothing, let parent handle buttons in children
            null
          )}
        </div>
      </div>
    </div>
  )
}
