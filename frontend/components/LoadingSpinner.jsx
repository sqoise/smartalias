'use client'

export default function LoadingSpinner({ 
  message = '', 
  size = 'medium', 
  color = 'green',
  fullScreen = true 
}) {
  // Size configurations
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  // Color configurations
  const colorClasses = {
    green: 'border-green-600',
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    red: 'border-red-600'
  }

  const spinnerContent = (
    <div className="text-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]} mx-auto`}></div>
      {message && (
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )

  // Full screen loading
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        {spinnerContent}
      </div>
    )
  }

  // Inline loading
  return (
    <div className="flex items-center justify-center py-8">
      {spinnerContent}
    </div>
  )
}
