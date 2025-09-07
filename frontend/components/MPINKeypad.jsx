'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Spinner from './Spinner'

export default function MPINKeypad({ 
  mpin, 
  onNumberPress, 
  onBackspace, 
  errors = {},
  isLoading = false,
  showKeypad = false,
  onClose,
  onLogin,
  username
}) {
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Add keyboard event listener for standard screens - only when MPIN step is active
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle keyboard input if not loading
      if (isLoading) return
      
      // Only handle keyboard input if we're focused on the MPIN area or no input is focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )
      
      // If an input field is focused, don't intercept the keyboard events
      if (isInputFocused) return
      
      // Handle number keys (0-9)
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        onNumberPress(event.key)
      }
      // Handle backspace
      else if (event.key === 'Backspace') {
        event.preventDefault()
        onBackspace()
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mpin, onNumberPress, onBackspace, isLoading])

  return (
    <>
      {/* Main Container - Keypad only */}
      <div className="w-full relative">
        {/* Unified Keypad - Both Mobile and Desktop - Optimized */}
        <div className={`p-1 w-full max-w-full sm:max-w-md lg:max-w-lg mx-auto transition-all duration-150 ease-out ${
          showKeypad ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {/* Row 1: 1, 2, 3 */}
            {[1, 2, 3].map(number => (
              <button
                key={number}
                type="button"
                disabled={isLoading}
                onClick={() => onNumberPress(number.toString())}
                className={`w-full h-16 sm:h-14 lg:h-16 rounded-xl sm:rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300
                         text-2xl sm:text-xl lg:text-2xl font-bold text-gray-800 hover:text-blue-600
                         transition-all duration-150 cursor-pointer transform hover:scale-105 active:scale-95
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {number}
              </button>
            ))}
            
            {/* Row 2: 4, 5, 6 */}
            {[4, 5, 6].map(number => (
              <button
                key={number}
                type="button"
                disabled={isLoading}
                onClick={() => onNumberPress(number.toString())}
                className={`w-full h-16 sm:h-14 lg:h-16 rounded-xl sm:rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300
                         text-2xl sm:text-xl lg:text-2xl font-bold text-gray-800 hover:text-blue-600
                         transition-all duration-150 cursor-pointer transform hover:scale-105 active:scale-95
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {number}
              </button>
            ))}
            
            {/* Row 3: 7, 8, 9 */}
            {[7, 8, 9].map(number => (
              <button
                key={number}
                type="button"
                disabled={isLoading}
                onClick={() => onNumberPress(number.toString())}
                className={`w-full h-16 sm:h-14 lg:h-16 rounded-xl sm:rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300
                         text-2xl sm:text-xl lg:text-2xl font-bold text-gray-800 hover:text-blue-600
                         transition-all duration-150 cursor-pointer transform hover:scale-105 active:scale-95
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {number}
              </button>
            ))}
            
            {/* Row 4: Empty, 0, Backspace */}
            <div></div>
            
            {/* Zero button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onNumberPress('0')}
              className={`w-full h-16 sm:h-14 lg:h-16 rounded-xl sm:rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300
                       text-2xl sm:text-xl lg:text-2xl font-bold text-gray-800 hover:text-blue-600
                       transition-all duration-150 cursor-pointer transform hover:scale-105 active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              0
            </button>
            
            {/* Backspace button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={onBackspace}
              className={`w-full h-16 sm:h-14 lg:h-16 rounded-xl sm:rounded-lg lg:rounded-xl bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:border-red-300
                       text-red-600 hover:text-red-700
                       transition-all duration-150 cursor-pointer transform hover:scale-105 active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-red-500
                       flex items-center justify-center
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className="bi bi-backspace text-2xl sm:text-xl lg:text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
