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
  username,
  onBack
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
        {/* Unified Keypad - Both Mobile and Desktop */}
        <div className={`px-2 py-2 w-full mx-auto transition-all duration-500 ease-out ${
          showKeypad ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="grid grid-cols-3 gap-1 sm:gap-1 lg:gap-1">
            {/* Row 1: 1, 2, 3 */}
            {[1, 2, 3].map(number => (
              <button
                key={number}
                type="button"
                disabled={isLoading}
                onClick={() => onNumberPress(number.toString())}
                className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100
                         text-3xl sm:text-2xl lg:text-3xl font-normal text-gray-800
                         transition-all duration-200 cursor-pointer
                         focus:outline-none shadow-sm
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
                className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100
                         text-3xl sm:text-2xl lg:text-3xl font-normal text-gray-800
                         transition-all duration-200 cursor-pointer
                         focus:outline-none shadow-sm
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
                className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100
                         text-3xl sm:text-2xl lg:text-3xl font-normal text-gray-800
                         transition-all duration-200 cursor-pointer
                         focus:outline-none shadow-sm
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {number}
              </button>
            ))}
            
            {/* Row 4: Back, 0, Backspace */}
            
            {/* Back button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={onBack}
              className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-transparent hover:bg-gray-300 active:bg-gray-300
                       text-gray-800 hover:text-gray-900 active:text-gray-900
                       transition-all duration-200 cursor-pointer
                       focus:outline-none
                       flex flex-col items-center justify-center
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="font-medium" style={{ fontSize: '13px' }}>ESC</span>
              <i className="bi bi-chevron-down text-sm sm:text-xs lg:text-sm"></i>
            </button>
            
            {/* Zero button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onNumberPress('0')}
              className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100
                       text-3xl sm:text-2xl lg:text-3xl font-normal text-gray-800
                       transition-all duration-200 cursor-pointer
                       focus:outline-none shadow-sm
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              0
            </button>
            
            {/* Backspace button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={onBackspace}
              className={`w-full h-14 sm:h-14 lg:h-14 rounded-lg bg-transparent hover:bg-red-100 active:bg-red-200
                       text-red-500 hover:text-red-600 transition-all duration-200 cursor-pointer focus:outline-none
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
