'use client'

import { useState } from 'react'
import Spinner from './Spinner'

export default function MPINKeypad({ 
  mpin, 
  onNumberPress, 
  onBackspace, 
  errors = {},
  isLoading = false
}) {
  return (
    <div className="rounded-md p-3 mt-4 bg-white">
      {/* MPIN Label */}
      <div className="text-center">
        <label className="block text-sm text-gray-700 mb-3">
          Enter your 6-digit MPIN
        </label>
        
        {/* MPIN Input Fields - Static styling, no color changes */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[0, 1, 2, 3, 4, 5].map(index => (
            <div
              key={index}
              className="w-9 h-9 rounded-md border border-gray-200 bg-slate-100 flex items-center justify-center transition-all duration-150"
            >
              {mpin[index] && (
                <i className="bi bi-asterisk text-slate-800 text-xs"></i>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {errors.mpin && (
          <p className="mb-2 text-xs text-red-600">{errors.mpin}</p>
        )}
      </div>

      {/* Custom Number Keypad - Wider and Bigger */}
      <div className="p-1 w-full max-w-sm mx-auto mt-8">
        <div className="grid grid-cols-3 gap-4">
          {/* Row 1: 1, 2, 3 */}
          {[1, 2, 3].map(number => (
            <button
              key={number}
              type="button"
              disabled={isLoading}
              onClick={() => onNumberPress(number.toString())}
              className={`w-full h-14 mt-1 rounded bg-transparent border border-gray-100 hover:border-gray-100 hover:bg-gray-100
                       text-2xl font-semibold text-gray-800
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
              className={`w-full h-14 mt-1 rounded-lg bg-transparent border border-gray-100 hover:border-gray-100 hover:bg-gray-100 
                       text-2xl font-semibold text-gray-800
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
              className={`w-full h-14 mt-1 rounded-lg bg-transparent border border-gray-100 hover:border-gray-100 hover:bg-gray-100 
                       text-2xl font-semibold text-gray-800
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
            className={`w-full h-14 mt-1 rounded-lg bg-transparent border border-gray-100 hover:border-gray-100 hover:bg-gray-100 
                     text-2xl font-semibold text-gray-800
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
            className={`w-full h-14 mt-1 rounded-lg bg-transparent border-transparent 
                     text-red-600
                     transition-all duration-150 cursor-pointer hover:bg-red-50
                     active:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500
                     flex items-center justify-center
                     ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className="bi bi-backspace text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
