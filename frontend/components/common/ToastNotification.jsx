"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'

const ToastNotification = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([])
  const [expandedToasts, setExpandedToasts] = useState(new Set())

  // Handle props-based usage
  useEffect(() => {
    if (props.show && props.message) {
      const newToast = {
        id: Date.now() + Math.random(),
        message: props.message,
        type: props.type || 'success',
        show: true
      }
      setToasts(prev => {
        const updatedToasts = [...prev, newToast]
        // Limit to maximum of 3 toasts - remove oldest if exceeding limit
        return updatedToasts.length > 3 ? updatedToasts.slice(-3) : updatedToasts
      })
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id))
        // Call onClose if provided
        props.onClose?.()
      }, 5000)
    }
  }, [props.show, props.message, props.type])

useImperativeHandle(ref, () => ({
  show: (message, type = 'success') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
      show: true
    }
    setToasts(prev => {
      const updatedToasts = [...prev, newToast]
      // Limit to maximum of 3 toasts - remove oldest if exceeding limit
      return updatedToasts.length > 3 ? updatedToasts.slice(-3) : updatedToasts
    })
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id))
    }, 5000)
  }
}))

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    setExpandedToasts(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    // Call onClose if provided (for props-based usage)
    props.onClose?.()
  }

  const toggleExpand = (id) => {
    setExpandedToasts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const truncateMessage = (message, maxLength = 80) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  const isMessageTruncated = (message, maxLength = 80) => {
    return message.length > maxLength
  }

  if (toasts.length === 0) return null

  const getIconClass = (type) => {
    switch (type) {
      case 'error':
        return 'bi-x-circle-fill text-red-600'
      case 'warning':
        return 'bi-exclamation-triangle-fill text-yellow-600'
      case 'info':
        return 'bi-info-circle-fill text-blue-600'
      default:
        return 'bi-check-circle-fill text-green-600'
    }
  }

  const getIconBorderClass = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  const getBorderClass = (type) => {
    // Gray-200 border with glass effect
    return 'border border-gray-200 shadow-lg shadow-stone-800/20'
  }

  const getBackgroundClass = (type) => {
    // Pure white background
    return 'bg-white'
  }

  const getTextClass = (type) => {
    // Enhanced text with better contrast and anti-aliasing
    return 'text-gray-900 font-medium antialiased subpixel-antialiased'
  }

  const getShadowClass = (type) => {
    // Enhanced shadow for glass effect depth
    return 'shadow-2xl'
  }

  return (
    <div className="fixed top-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-auto z-[9999] space-y-2">
      {toasts.map((toast, index) => {
        const isExpanded = expandedToasts.has(toast.id)
        const messageToShow = toast.message
        const isTruncatable = isMessageTruncated(messageToShow)
        
        return (
          <div 
            key={toast.id}
            className={`flex items-center w-full lg:w-90 p-3 px-2 rounded-xl ${getBackgroundClass(toast.type)} ${getBorderClass(toast.type)} ${getShadowClass(toast.type)} transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-2 fade-in relative overflow-hidden`} 
            role="alert"
            style={{ 
              animationDelay: `${index * 100}ms`,
              background: 'rgba(255, 249, 249, 0.83)',
              backdropFilter: 'blur(8px) saturate(150%)',
              WebkitBackdropFilter: 'blur(8px) saturate(150%)',
              border: '0.5px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className={`flex items-center justify-center flex-shrink-0 mx-2 w-8 h-8 rounded-lg ${getIconBorderClass(toast.type)} shadow-sm`}>
              <i className={`bi ${getIconClass(toast.type)} transition-all duration-300 ease-in-out text-lg leading-none`}></i>
            </div>
            <div 
              className={`ml-2 font-normal ${getTextClass(toast.type)} flex-1 py-1 ${isTruncatable ? 'cursor-pointer' : ''} transition-all duration-300 ease-out overflow-hidden`} 
              style={{
                fontSize: '13px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'max-height 0.3s ease-out'
              }}
              onClick={() => isTruncatable && toggleExpand(toast.id)}
            >
              {isExpanded ? messageToShow : truncateMessage(messageToShow)}
            </div>
            <button 
              type="button" 
              className="ml-auto text-gray-500 hover:text-gray-700 rounded-lg focus:ring-2 focus:ring-gray-300/50 p-1.5 inline-flex items-center justify-center h-8 w-8 flex-shrink-0 transition-colors duration-200 ease-in-out cursor-pointer"
              onClick={() => removeToast(toast.id)}
            >
              <i className="bi bi-x text-md"></i>
            </button>
          </div>
        )
      })}
    </div>
  )
})

ToastNotification.displayName = 'ToastNotification'

export default ToastNotification
