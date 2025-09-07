'use client'

import { useState, useEffect } from 'react'
import MPINKeypad from './MPINKeypad'
import Spinner from './Spinner'

export default function LoginCard({
  username,
  setUsername,
  mpin,
  errors,
  setErrors,
  isLoading,
  onLogin,
  onKeypadNumber,
  onKeypadBackspace,
  showLogo = false,
  className = '',
  showKeypad,
  setShowKeypad
}) {

  const handleMPINLogin = () => {
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }))
      return
    }
    if (mpin.length !== 6) {
      setErrors(prev => ({ ...prev, mpin: 'Please enter your 6-digit PIN' }))
      return
    }
    onLogin({ username, mpin })
  }

  // Handle Enter and Escape key press - Optimized
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && showKeypad) {
        event.preventDefault()
        setShowKeypad(false)
        return
      }
      
      if (event.key === 'Enter') {
        if (!showKeypad && username.trim()) {
          setShowKeypad(true)
        } else if (showKeypad && mpin.length === 6) {
          handleMPINLogin()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress, true)
    return () => document.removeEventListener('keydown', handleKeyPress, true)
  }, [showKeypad, username, mpin, handleMPINLogin])

  return (
    <>
      {/* Header Container - Outside main card */}
      {showLogo && (
        <div className="px-6 sm:px-4 lg:px-8 pt-6 sm:pt-4 lg:pt-8 pb-4 sm:pb-3 lg:pb-4 text-center">
          <img 
            src="/images/barangay_logo.jpg" 
            alt="Barangay Logo" 
            className="w-20 h-20 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full mx-auto mb-3 sm:mb-2 lg:mb-3"
          />
          <h2 className="text-2xl sm:text-lg lg:text-xl font-bold text-gray-800">Sign in to Smart LIAS</h2>
        </div>
      )}

      {/* Main Card Container - Optimized transitions */}
      <div className={`w-full max-w-sm sm:max-w-lg lg:max-w-lg xl:max-w-xl bg-white rounded-lg shadow-lg mx-auto mt-2 lg:mt-4 lg:mx-8 xl:mx-12 mb-10 relative z-10 transition-all duration-200 ease-out ${
        showKeypad ? 'min-h-[600px]' : 'min-h-[400px]'
      } ${className}`}>
        {/* Main Content Area */}
        <div className="p-6 sm:p-4 lg:p-8 h-full">
        {/* Header for when logo is not shown */}
        {!showLogo && (
          <div className="mb-6 sm:mb-4 lg:mb-6 text-center">
            <h2 className="text-xl sm:text-lg lg:text-xl font-bold text-black-700">Sign in to Smart LIAS</h2>
          </div>
        )}

        {/* Single Page Login Form */}
        <div className="h-full flex flex-col">
          {/* Username Input */}
          <div className="space-y-4 sm:space-y-3 lg:space-y-3 flex-shrink-0">
            <div>
              <label htmlFor="username" className="block text-base sm:text-sm lg:text-sm font-medium text-gray-700 mb-2 sm:mb-1 lg:mb-1">
                Username
              </label>
              <input 
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }))
                }}
                onFocus={(e) => {
                  // Prevent zoom on mobile while allowing keyboard to overlay
                  e.target.style.fontSize = '16px'
                  // Scroll to ensure input is visible above keyboard
                  setTimeout(() => {
                    e.target.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    })
                  }, 300)
                }}
                onBlur={(e) => {
                  // Reset font size after blur
                  e.target.style.fontSize = ''
                }}
                className={`w-full rounded-lg sm:rounded-md lg:rounded-md px-4 py-3 sm:px-3 sm:py-2 lg:px-3 lg:py-2 text-base sm:text-sm lg:text-sm border ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } placeholder:text-gray-400 bg-white focus:scale-100`}
                placeholder="Enter your username"
                autoFocus
                style={{ fontSize: '16px' }}
                disabled={showKeypad}
              />
              {errors.username && (
                <p className="mt-2 sm:mt-1 lg:mt-1 text-sm sm:text-xs lg:text-xs text-red-600">{errors.username}</p>
              )}
            </div>
          </div>

          {/* Enter your 6-digit MPIN Text - Optimized */}
          <div className={`text-center transition-all duration-150 ease-out ${
            showKeypad 
              ? 'py-4 opacity-100' 
              : 'py-0 opacity-0 h-0 overflow-hidden'
          }`}>
            <p className="text-lg text-gray-700 font-medium">
              Enter your 6-digit MPIN
            </p>
          </div>

          {/* MPIN Input Display - Optimized */}
          <div className={`transition-all duration-150 ease-out ${
            showKeypad 
              ? 'mb-6 opacity-100' 
              : 'mb-0 opacity-0 h-0 overflow-hidden'
          }`}>
            <div className="flex justify-center space-x-3 sm:space-x-2 lg:space-x-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-8 h-8 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg sm:rounded-md lg:rounded-md border border-gray-200 bg-slate-100 flex items-center justify-center transition-all duration-150"
                >
                  {mpin[index] && (
                    <i className="bi bi-asterisk text-slate-800 text-xs sm:text-xs lg:text-xs"></i>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errors.mpin && (
              <p className="mt-3 sm:mt-2 lg:mt-2 text-sm sm:text-xs lg:text-xs text-red-600 text-center">{errors.mpin}</p>
            )}
          </div>

          {/* MPIN Login Button - Optimized instant hide */}
          <div className={`flex justify-center pt-6 pb-4 transition-opacity duration-100 ease-out ${
            showKeypad ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <button 
              type="button"
              onClick={() => {
                if (!username.trim()) {
                  setErrors(prev => ({ ...prev, username: 'Username is required' }))
                  return
                }
                setShowKeypad(true)
              }}
              disabled={isLoading || !username.trim()}
              className={`w-24 h-24 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-xl shadow-lg 
                         bg-green-600 hover:bg-green-700 active:bg-green-800
                         text-white font-semibold text-sm sm:text-xs lg:text-sm
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center
                         ${isLoading ? 'opacity-60' : 'hover:scale-105 active:scale-95'}`}
            >
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <div className="text-center">
                  <i className="bi bi-shield-lock text-xl sm:text-lg lg:text-xl block mb-1"></i>
                  <span className="text-xs font-medium">MPIN Login</span>
                </div>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Keypad Overlay - Optimized slide-up */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-150 ease-out ${
        showKeypad ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 p-6">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowKeypad(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>

          {/* MPIN Input Component */}
          <div className="max-w-xs mx-auto mb-6">
            <MPINKeypad 
              mpin={mpin}
              onNumberPress={onKeypadNumber}
              onBackspace={onKeypadBackspace}
              errors={errors}
              isLoading={isLoading}
              showKeypad={true}
            />
          </div>

          {/* Login Button */}
          <div className="pt-4">
            <button 
              type="button"
              onClick={handleMPINLogin}
              disabled={isLoading || mpin.length !== 6}
              className={`w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium 
                         rounded-lg border bg-blue-600 border-blue-600 text-white 
                         hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:outline-none
                         disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed
                         transition-colors duration-200 gap-2 cursor-pointer
                         ${isLoading ? 'opacity-60' : ''}`}
            >
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <i className="bi bi-shield-lock"></i>
              )}
              <span>MPIN Login</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
