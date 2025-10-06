import React from 'react'

/**
 * Reusable slide-in panel component for viewing/editing items
 * 
 * @param {boolean} open - Controls panel visibility
 * @param {function} onClose - Callback when panel should close
 * @param {string} title - Panel header title
 * @param {ReactNode} children - Panel content
 * @param {ReactNode} footer - Optional sticky footer content
 * @param {string} size - Panel width: 'sm', 'md', 'lg', 'xl' (default: 'lg')
 * @param {boolean} closeOnOverlayClick - Close panel when clicking overlay (default: true)
 * @param {boolean} showCloseButton - Show floating close button (default: true)
 */
export default function SlidePanel({ 
  open, 
  onClose, 
  title, 
  children, 
  footer = null,
  size = 'lg',
  closeOnOverlayClick = true,
  showCloseButton = true
}) {
  // Handle escape key
  React.useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Panel width based on size
  const sizeClasses = {
    sm: 'w-full sm:w-[400px] lg:w-[450px] xl:w-[500px]',
    md: 'w-full sm:w-[520px] lg:w-[600px] xl:w-[650px]', 
    lg: 'w-full sm:w-[520px] lg:w-[650px] xl:w-[750px]',
    xl: 'w-full sm:w-[650px] lg:w-[750px] xl:w-[850px]'
  }

  // Close button position based on panel size
  const closeButtonPositions = {
    sm: 'right-[400px] sm:right-[400px] lg:right-[450px] xl:right-[500px]',
    md: 'right-[520px] sm:right-[520px] lg:right-[600px] xl:right-[650px]',
    lg: 'right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px]',
    xl: 'right-[650px] sm:right-[650px] lg:right-[750px] xl:right-[850px]'
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal={open ? "true" : "false"}
      aria-hidden={!open}
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeOnOverlayClick ? onClose : undefined}
      >
        {/* Floating Close Button */}
        {showCloseButton && (
          <button
            className={`absolute top-2 ${closeButtonPositions[size]} w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
              open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            title="Close"
          >
            <i className="bi bi-x text-3xl text-white/90" />
          </button>
        )}
      </div>
      
      {/* Slide Panel from Right */}
      <div
        className={`relative ml-auto h-full ${sizeClasses[size]} bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
      >
        {/* Panel Header */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">
              {title}
            </div>
          </div>
          
          {/* Mobile close button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {children}
          </div>
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <SlidePanel 
 *   open={open} 
 *   onClose={() => setOpen(false)} 
 *   title="Item Details"
 * >
 *   <div>Content goes here</div>
 * </SlidePanel>
 * 
 * // With footer buttons
 * <SlidePanel 
 *   open={open} 
 *   onClose={() => setOpen(false)} 
 *   title="Edit Item"
 *   size="md"
 *   footer={
 *     <>
 *       <button onClick={() => setOpen(false)}>Cancel</button>
 *       <button onClick={handleSave}>Save</button>
 *     </>
 *   }
 * >
 *   <form>Form content here</form>
 * </SlidePanel>
 * 
 * // Large panel without overlay close
 * <SlidePanel 
 *   open={open} 
 *   onClose={() => setOpen(false)} 
 *   title="Detailed View"
 *   size="xl"
 *   closeOnOverlayClick={false}
 * >
 *   <div>Large content here</div>
 * </SlidePanel>
 */
