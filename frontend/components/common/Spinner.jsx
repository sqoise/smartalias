'use client'

export default function Spinner({ 
  size = 'lg', 
  color = 'blue',
  className = '' 
}) {
  // Add fade-in keyframe animation
  const fadeInStyle = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `

  // Size configurations
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  const colorClasses = {
    gray: 'text-gray-400',
    white: 'text-white',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600'
  }

  return (
    <div role="status" className={`inline-block ${className}`}>
      <style>{fadeInStyle}</style>
      <svg 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} ${colorClasses[color]}`}
        style={{ 
          opacity: 0,
          animation: 'fadeIn 0.1s ease-in-out 0.2s forwards'
        }}
        aria-hidden="true"
      >
        <g>
          <circle 
            cx="12" 
            cy="12" 
            r="9.5" 
            fill="none" 
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate 
              attributeName="stroke-dasharray" 
              dur="1.4s" 
              calcMode="spline" 
              values="0 150;42 150;42 150;42 150" 
              keyTimes="0;0.475;0.95;1" 
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" 
              repeatCount="indefinite"
            />
            <animate 
              attributeName="stroke-dashoffset" 
              dur="1.4s" 
              calcMode="spline" 
              values="0;-16;-59;-59" 
              keyTimes="0;0.475;0.95;1" 
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" 
              repeatCount="indefinite"
            />
          </circle>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            dur="1.6s" 
            values="0 12 12;360 12 12" 
            repeatCount="indefinite"
          />
        </g>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
