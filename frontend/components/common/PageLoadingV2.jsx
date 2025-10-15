'use client'

import { useEffect, useState } from 'react'
import Spinner from './Spinner'

/**
 * PageLoadingV2 - Top progress bar with spinner
 * Shows a 2px dark green line at the top with a small loading spinner in top-right corner
 */
export default function PageLoadingV2({ isLoading = true }) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    
    if (isLoading) {
      // Show and start animating when loading begins
      setShouldRender(true)
      setIsVisible(true)
      setProgress(10)
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90
          return prev + Math.random() * 15
        })
      }, 300)

      return () => clearInterval(interval)
    } else {
      // Loading is done - smoothly complete to 100%
      const completeTimer = setTimeout(() => {
        setProgress(100)
      }, 200)
      
      // Start fade out after completion
      const fadeTimer = setTimeout(() => {
        setIsVisible(false)
      }, 500)
      
      // Remove from DOM after fade completes
      const removeTimer = setTimeout(() => {
        setShouldRender(false)
        setProgress(0)
      }, 800)
      
      return () => {
        clearTimeout(completeTimer)
        clearTimeout(fadeTimer)
        clearTimeout(removeTimer)
      }
    }
  }, [isLoading])

  // Don't render anything if not needed
  if (!shouldRender) {
    return null
  }

  return (
    <>
      {/* Progress bar - 3px dark green with shadow and smooth fade */}
      <div 
        className={`fixed top-0 left-0 right-0 h-[3px] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 9999 }}
      >
        <div
          className="h-full bg-green-900 shadow-sm transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Small spinner with smooth fade */}
      <div 
        className={`fixed top-1 right-1 drop-shadow-md transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 9999 }}
      >
        <Spinner size="sm" color="darkgreen" />
      </div>
    </>
  )
}
