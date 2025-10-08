'use client'

/**
 * SessionExpiredModal - Compact modal for session expiration notification
 * Shows when JWT token expires or authentication fails
 */
export default function SessionExpiredModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Darker blurred background */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-xs transform transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Session Expired
            </h3>
          </div>
          
          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700">
              Your session has expired. Please log in again to continue.
            </p>
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 rounded-b-lg flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
                       rounded-md bg-gray-600 text-white hover:bg-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                       transition-colors cursor-pointer h-9"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
