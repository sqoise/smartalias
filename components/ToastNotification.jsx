"use client"

import { forwardRef, useImperativeHandle, useState } from 'react'

const ToastNotification = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([])

  useImperativeHandle(ref, () => ({
    show: (message, type = 'success') => {
      const newToast = {
        id: Date.now() + Math.random(),
        message,
        type,
        show: true
      }
      setToasts(prev => [...prev, newToast])
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id))
      }, 5000)
    }
  }))

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  if (toasts.length === 0) return null

  const getIconClass = (type) => {
    switch (type) {
      case 'error':
        return 'bi-x-circle text-red-500'
      case 'warning':
        return 'bi-exclamation-triangle text-yellow-500'
      case 'info':
        return 'bi-info-circle text-blue-500'
      default:
        return 'bi-check-circle-fill text-green-500'
    }
  }

  const getBorderClass = (type) => {
    switch (type) {
      case 'error':
        return 'border-t-4 border-red-500'
      case 'warning':
        return 'border-t-4 border-yellow-500'
      case 'info':
        return 'border-t-4 border-blue-500'
      default:
        return 'border-t-4 border-green-500'
    }
  }

  const getShadowClass = (type) => {
    switch (type) {
      case 'error':
        return 'shadow-red-200/50'
      case 'warning':
        return 'shadow-yellow-200/50'
      case 'info':
        return 'shadow-blue-200/50'
      default:
        return 'shadow-green-200/50'
    }
  }

  return (
    <div className="fixed top-6 right-6 z-50 space-y-2 max-w-[calc(100vw-3rem)]">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          className={`flex items-center w-80 sm:w-96 p-4 text-gray-500 bg-white rounded-lg shadow-md ${getShadowClass(toast.type)} transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-2 fade-in`} 
          role="alert"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
            <i className={`bi ${getIconClass(toast.type)} transition-all duration-300 ease-in-out text-lg`}></i>
          </div>
          <div className="ml-3 text-sm font-normal text-gray-800 flex-1">
            {toast.message}
          </div>
          <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 flex-shrink-0 transition-colors duration-200 ease-in-out cursor-pointer"
            onClick={() => removeToast(toast.id)}
          >
            <i className="bi bi-x text-sm"></i>
          </button>
        </div>
      ))}
    </div>
  )
})

ToastNotification.displayName = 'ToastNotification'

export default ToastNotification
