import React from 'react'

/**
 * SlidePanel - A reusable slide-in panel component with backdrop and animations
 * 
 * Based on AnnouncementDetailView.jsx design pattern for consistent UI/UX
 * Supports multiple sizes and responsive behavior
 * 
 * @param {boolean} open - Controls panel visibility and animations
 * @param {function} onClose - Callback when panel should be closed
 * @param {string} title - Panel header title
 * @param {string} subtitle - Optional panel header subtitle  
 * @param {React.Node} children - Panel body content
 * @param {React.Node} footer - Optional custom footer content (buttons, actions)
 * @param {string} size - Panel width: 'sm' | 'md' | 'lg' | 'xl' (default: 'lg')
 * @param {string} headerIcon - Optional Bootstrap icon class for header
 * @param {boolean} showHeaderCloseButton - Show close button in header on mobile (default: true)
 * @param {boolean} loading - Show skeleton loading state (default: false)
 * @param {boolean} showFooter - Show built-in footer with cancel/confirm buttons (default: false)
 * @param {string} cancelText - Cancel button text (default: 'Cancel')
 * @param {string} confirmText - Confirm button text (default: 'Confirm')
 * @param {string} confirmIcon - Bootstrap icon class for confirm button
 * @param {function} onConfirm - Callback for confirm button click
 * @param {boolean} confirmDisabled - Disable confirm button (default: false)
 * @param {boolean} confirmLoading - Show loading state on confirm button (default: false)
 * @param {string} confirmLoadingText - Loading text for confirm button (default: 'Loading...')
 * @param {boolean} closeOnEscape - Close when pressing Escape (default: false)
 */
export default function SlidePanel({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  headerIcon,
  showHeaderCloseButton = true,
  loading = false,
  showFooter = false,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmIcon,
  onConfirm,
  confirmDisabled = false,
  confirmLoading = false,
  confirmLoadingText = 'Loading...',
  closeOnEscape = false
}) {
  // Size configurations based on AnnouncementDetailView pattern
  const sizeConfig = {
    sm: 'w-full sm:w-[400px] lg:w-[450px] xl:w-[500px]',
    md: 'w-full sm:w-[520px] lg:w-[580px] xl:w-[650px]', 
    lg: 'w-full sm:w-[520px] lg:w-[650px] xl:w-[750px]', // AnnouncementDetailView default
    xl: 'w-full sm:w-[720px] lg:w-[850px] xl:w-[950px]'
  }

  // Close button position based on panel size (matches AnnouncementDetailView pattern)
  const closeButtonPosition = {
    sm: 'right-[400px] sm:right-[400px] lg:right-[450px] xl:right-[500px]',
    md: 'right-[520px] sm:right-[520px] lg:right-[580px] xl:right-[650px]',
    lg: 'right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px]', // AnnouncementDetailView exact match
    xl: 'right-[720px] sm:right-[720px] lg:right-[850px] xl:right-[950px]'
  }

  // Handle Escape key to close panel (only if closeOnEscape is true)
  React.useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, closeOnEscape])

  // Skeleton Loading Components
  const SkeletonHeader = () => (
    <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200"></div>
        <div>
          <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
      {showHeaderCloseButton && (
        <div className="flex items-center gap-2 sm:hidden">
          <div className="w-7 h-7 bg-gray-200 rounded-md"></div>
        </div>
      )}
    </div>
  )

  const SkeletonContent = () => (
    <div className="p-2 animate-pulse space-y-4">
      {/* Card skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="w-40 h-5 bg-gray-200 rounded mb-2"></div>
              <div className="w-64 h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-full h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-full h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )

  const SkeletonFooter = () => (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 animate-pulse">
      <div className="flex items-center justify-end space-x-2">
        <div className="w-16 h-9 bg-gray-200 rounded-md"></div>
        <div className="w-24 h-9 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )

  return (
    <>
      {/* Overlay - Click to close */}
      {open && (
        <div
          className="fixed inset-0 w-full h-full bg-black/50 transition-opacity duration-300 z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={onClose}
        >
          {/* Floating Close Button next to Panel */}
          <button
            className={`absolute top-2 ${closeButtonPosition[size]} w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
              open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            <i className="bi bi-x text-3xl text-white/90" />
          </button>
        </div>
      )}
      
      {/* Slide Panel from Right */}
      <div
        className={`fixed right-0 top-0 h-full ${sizeConfig[size]} bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform z-50 ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
        aria-modal={open ? "true" : "false"}
        aria-hidden={!open}
        role="dialog"
      >
        {/* Panel Header */}
        {loading ? (
          <SkeletonHeader />
        ) : (
          <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {headerIcon && (
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">
                  <i className={headerIcon} />
                </div>
              )}
              <div>
                <div className="text-md font-medium tracking-normal antialiased text-gray-900">
                  {title}
                </div>
                {subtitle && (
                  <p className="text-xs text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            {showHeaderCloseButton && (
              <div className="flex items-center gap-2 sm:hidden">
                <button 
                  className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  onClick={onClose}
                >
                  <i className="bi bi-x text-xl" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <SkeletonContent />
          ) : (
            <div className="p-4">
              {children}
            </div>
          )}
        </div>

        {/* Panel Footer - Sticky */}
        {loading ? (
          <SkeletonFooter />
        ) : (
          (footer || showFooter) && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
              {footer || (
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer h-9"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirmLoading ? (
                      <>
                        <div className="w-3 h-3 mr-2">
                          <div className="w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        {confirmLoadingText}
                      </>
                    ) : (
                      <>
                        {confirmIcon && <i className={`${confirmIcon} text-md mr-1`} />}
                        {confirmText}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  )
}
