'use client'

import { useState, useEffect } from 'react'
import Spinner from './Spinner'

export default function MPINKeypad({ 
  mpin, 
  onNumberPress, 
  onBackspace, 
  errors = {},
  isLoading = false
}) {
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
    <div className="w-full">
      {/* MPIN Visual Dots - mobile optimized, desktop compact */}
      <div className="mb-6 sm:mb-4 lg:mb-6">
        <p className="text-center text-base sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-3 lg:mb-4">
          Enter your 6-digit PIN
        </p>
        
        <div className="flex justify-center space-x-3 sm:space-x-2 lg:space-x-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg sm:rounded-md lg:rounded-md border border-gray-200 bg-slate-100 flex items-center justify-center transition-all duration-150"
            >
              {mpin[index] && (
                <i className="bi bi-asterisk text-slate-800 text-sm sm:text-xs lg:text-xs"></i>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {errors.mpin && (
          <p className="mt-3 sm:mt-2 lg:mt-2 text-sm sm:text-xs lg:text-xs text-red-600 text-center">{errors.mpin}</p>
        )}
      </div>

      {/* Custom Number Keypad - mobile optimized, desktop compact */}
      <div className="p-2 sm:p-1 lg:p-1 w-full max-w-sm sm:max-w-xs lg:max-w-xs mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-2 lg:gap-3">
          {/* Row 1: 1, 2, 3 */}
          {[1, 2, 3].map(number => (
            <button
              key={number}
              type="button"
              disabled={isLoading}
              onClick={() => onNumberPress(number.toString())}
              className={`w-full h-14 sm:h-12 lg:h-12 rounded-xl sm:rounded-lg lg:rounded-lg bg-transparent border border-gray-100 hover:border-gray-200 hover:bg-gray-50
                       text-2xl sm:text-xl lg:text-xl font-semibold text-gray-800
                       transition-all duration-150 cursor-pointer
                       active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
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
              className={`w-full h-14 sm:h-12 lg:h-12 rounded-xl sm:rounded-lg lg:rounded-lg bg-transparent border border-gray-100 hover:border-gray-200 hover:bg-gray-50
                       text-2xl sm:text-xl lg:text-xl font-semibold text-gray-800
                       transition-all duration-150 cursor-pointer
                       active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
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
              className={`w-full h-14 sm:h-12 lg:h-12 rounded-xl sm:rounded-lg lg:rounded-lg bg-transparent border border-gray-100 hover:border-gray-200 hover:bg-gray-50
                       text-2xl sm:text-xl lg:text-xl font-semibold text-gray-800
                       transition-all duration-150 cursor-pointer
                       active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
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
            className={`w-full h-14 sm:h-12 lg:h-12 rounded-xl sm:rounded-lg lg:rounded-lg bg-transparent border border-gray-100 hover:border-gray-200 hover:bg-gray-50
                     text-2xl sm:text-xl lg:text-xl font-semibold text-gray-800
                     transition-all duration-150 cursor-pointer
                     active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
                     ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            0
          </button>
          
          {/* Backspace button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onBackspace}
            className={`w-full h-14 sm:h-12 lg:h-12 rounded-xl sm:rounded-lg lg:rounded-lg bg-transparent border-transparent 
                     text-red-600
                     transition-all duration-150 cursor-pointer hover:bg-red-50
                     active:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500
                     flex items-center justify-center
                     ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className="bi bi-backspace text-2xl sm:text-xl lg:text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
