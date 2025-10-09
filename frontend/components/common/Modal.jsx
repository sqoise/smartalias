'use client'

import React, { useEffect } from 'react'

/**
 * Modal - A reusable modal component with consistent design and sizing
 * 
 * @param {boolean} isOpen - Controls modal visibility (legacy prop name)
 * @param {boolean} open - Controls modal visibility (new prop name)
 * @param {function} onClose - Callback when modal should be closed
 * @param {string} title - Modal title
 * @param {string} subtitle - Optional modal subtitle
 * @param {React.Node} children - Modal body content
 * @param {React.Node} footer - Optional footer content (for custom layouts)
 * @param {string} type - Modal type: 'alert' | 'confirm' | 'custom' (default: 'custom')
 * @param {string} confirmText - Text for confirm button (default: 'Yes, Confirm')
 * @param {string} cancelText - Text for cancel button (default: 'Back')
 * @param {function} onConfirm - Callback for confirm action
 * @param {boolean} confirmDisabled - Disable confirm button (default: false)
 * @param {boolean} confirmLoading - Show loading state on confirm button (default: false)
 * @param {string} confirmLoadingText - Text to show when loading (default: 'Please wait...')
 * @param {string} variant - Button color variant: 'safe' | 'danger' (default: 'safe')
 * @param {string} confirmButtonClass - Custom CSS classes for confirm button (overrides variant)
 * @param {string} cancelButtonClass - Custom CSS classes for cancel button
 * @param {string} size - Modal width: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {boolean} closeOnBackdrop - Close when clicking backdrop (default: true)
 * @param {boolean} closeOnEscape - Close when pressing Escape (default: true)
 */
export default function Modal({
  isOpen = false, // Legacy prop
  open, // New prop
  onClose,
  title,
  subtitle,
  children,
  footer,
  type = 'custom', // 'alert', 'confirm', 'custom'
  confirmText = 'Yes, Confirm',
  cancelText = 'Back',
  onConfirm,
  confirmDisabled = false,
  confirmLoading = false,
  confirmLoadingText = 'Please wait...',
  variant = 'safe', // 'safe' | 'danger'
  confirmButtonClass,
  cancelButtonClass,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true
}) {
  // Support both prop names for backward compatibility
  const modalOpen = open !== undefined ? open : isOpen

  // Size configurations matching design system
  const sizeConfig = {
    sm: 'w-full max-w-sm',      // 384px
    md: 'w-full max-w-md',      // 448px
    lg: 'w-full max-w-lg',      // 512px
    xl: 'w-full max-w-xl',      // 576px
    '2xl': 'w-full max-w-2xl'   // 672px
  }

  // Button style variants
  const buttonVariants = {
    safe: {
      confirm: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
      cancel: 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500'
    },
    danger: {
      confirm: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
      cancel: 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500'
    }
  }

  // Get button classes (allow custom override)
  const getConfirmButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass
    const baseClass = `flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2`
    const variantClass = buttonVariants[variant]?.confirm || buttonVariants.safe.confirm
    const disabledClass = (confirmDisabled || confirmLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    return `${baseClass} ${variantClass} ${disabledClass}`
  }

  const getCancelButtonClass = () => {
    if (cancelButtonClass) return cancelButtonClass
    return `flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2 cursor-pointer ${buttonVariants[variant]?.cancel || buttonVariants.safe.cancel}`
  }

  // Handle Escape key to close modal
  useEffect(() => {
    if (!modalOpen || !closeOnEscape) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100%'
      document.documentElement.style.height = '100%'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.height = 'unset'
      document.documentElement.style.height = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.height = 'unset'
      document.documentElement.style.height = 'unset'
    }
  }, [modalOpen])

  if (!modalOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]"
      onClick={handleOverlayClick}
      style={{ 
        borderStyle: 'none',
        height: '100vh',
        width: '100vw',
        top: 0,
        left: 0,
        position: 'fixed'
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl ${sizeConfig[size] || sizeConfig.md} mx-4`}
        style={{ borderStyle: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className={`px-6 ${title ? 'py-4' : 'pt-6 pb-4'}`}>
          {children}
        </div>
        
        {/* Footer */}
        {(footer || type !== 'custom') && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footer || (
              <div className="flex gap-3">
                {type === 'confirm' ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className={getCancelButtonClass()}
                    >
                      {cancelText}
                    </button>
                    <button 
                      onClick={handleConfirm}
                      disabled={confirmDisabled || confirmLoading}
                      className={getConfirmButtonClass()}
                    >
                      {confirmLoading ? confirmLoadingText : confirmText}
                    </button>
                  </>
                ) : type === 'alert' ? (
                  <button 
                    onClick={handleCancel}
                    className={getCancelButtonClass()}
                  >
                    Understood
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
