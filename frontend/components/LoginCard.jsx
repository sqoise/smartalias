'use client'

import { useState, useEffect } from 'react'
import MPINKeypad from './MPINKeypad'
import Spinner from './Spinner'
import Modal from './Modal'

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
  const [showForgotModal, setShowForgotModal] = useState(false)

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

  // Handle Enter and Escape key press
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Handle Escape key first (highest priority)
      if (event.key === 'Escape') {
        if (showKeypad) {
          event.preventDefault()
          event.stopPropagation()
          setShowKeypad(false)
        }
        return
      }
      
      if (event.key === 'Enter') {
        if (!showKeypad && username.trim()) {
          // If keypad is not shown and username is entered, show keypad
          event.preventDefault()
          setShowKeypad(true)
        } else if (showKeypad && mpin.length === 6) {
          // If keypad is shown and MPIN is complete, trigger login
          event.preventDefault()
          handleMPINLogin()
        }
      }
    }

    // Use capture phase to handle events before other components
    document.addEventListener('keydown', handleKeyPress, true)
    return () => document.removeEventListener('keydown', handleKeyPress, true)
  }, [showKeypad, username, mpin, handleMPINLogin])

  // Handle focus behavior when keypad toggles
  useEffect(() => {
    if (!showKeypad) {
      // When keypad is closed, blur any active input and focus on body for mobile
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        // Blur any focused input
        document.activeElement?.blur()
        // Focus on body to prevent input field focus
        document.body.focus()
      }
    }
  }, [showKeypad])

  return (
    <>
      {/* Header Container - Outside main card */}
      {showLogo && !showKeypad && (
        <div className="text-center pb-4">
          <img 
            src="/images/barangay_logo.jpg" 
            alt="Barangay Logo" 
            className="w-20 h-20 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full mx-auto mb-1"
          />
          <h2 className="font-bold text-gray-800 text-4xl sm:text-3xl lg:text-4xl">Sign in to Smart LIAS</h2>
        </div>
      )}

      {/* Main Card Container */}
      <div className={`relative w-full lg:max-w-2xl xl:max-w-3xl bg-transparent transition-all duration-500 ease-out min-h-[400px] lg:min-h-[350px] xl:min-h-[380px] mx-auto lg:mx-8 xl:mx-12 ${className}`}>
        
        {/* Main Content Area */}
        <div className="h-full">
        {/* Header for when logo is not shown */}
        {!showLogo && !showKeypad && (
          <div className="mb-6 sm:mb-4 lg:mb-6 text-center">
            <h2 className="font-bold text-black-700 text-3xl sm:text-2xl lg:text-3xl">Sign in to Smart LIAS</h2>
          </div>
        )}

        {/* Single Page Login Form */}
        <div className="h-full flex flex-col">
          {/* DEMO: Demo Credentials - Show when keypad is not active */}
          {!showKeypad && (
            <div className="mb-4 p-3 bg-blue-50 border-dashed border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>User:</strong> juan.delacruz / 031590</div>
                <div><strong>User:</strong> maria.santos / 120885</div>
                <div><strong>Admin:</strong> admin.staff / 010180</div>
              </div>
            </div>
          )}
          
          {/* Username Input - Hide when keypad is active */}
          {!showKeypad && (
            <div className="space-y-4 sm:space-y-3 lg:space-y-3 flex-shrink-0">
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-base sm:text-sm lg:text-sm font-medium text-gray-700 mb-2 sm:mb-1 lg:mb-1"
                >
                  Username
                </label>
                <div className="relative">
                  {/* Username icon */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                    <i className="bi bi-person text-gray-500 text-lg sm:text-sm md:text-lg lg:text-lg"></i>
                  </div>
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
                    className={`w-full rounded-lg sm:rounded-md lg:rounded-md border transition-all duration-300 ${
                      errors.username 
                        ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } placeholder:text-gray-400 focus:scale-100 bg-white pl-10 pr-4 py-3 sm:pl-9 sm:pr-3 sm:py-2 lg:pl-10 lg:pr-3 lg:py-2 text-base sm:text-sm lg:text-sm`}
                    placeholder="Enter your username"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 sm:mt-1 lg:mt-1 text-sm sm:text-xs lg:text-xs text-red-600">{errors.username}</p>
                )}
              </div>
            </div>
          )}

          {/* MPIN Input Section - Show when keypad is active */}
          {showKeypad && (
            <div className="space-y-4 sm:space-y-3 lg:space-y-3 flex-shrink-0">
              <div>
                <label className="block text-base sm:text-sm lg:text-sm font-medium text-gray-700 mb-2 sm:mb-1 lg:mb-1">
                  Enter your 6-digit MPIN
                </label>
                <div className="flex justify-center space-x-5 sm:space-x-4 lg:space-x-5 py-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full flex items-center justify-center shadow-inner transition-all duration-200 ${
                        mpin[index] 
                          ? 'bg-green-700 scale-110' 
                          : 'bg-slate-200 scale-100'
                      }`}
                    >
                    </div>
                  ))}
                </div>
                {errors.mpin && (
                  <p className="mt-2 sm:mt-1 lg:mt-1 text-sm sm:text-xs lg:text-xs text-red-600 text-center">{errors.mpin}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Enter your 6-digit MPIN Text - Show when keypad is active */}
          <div className={`text-center transition-all duration-300 ease-out ${
            showKeypad 
              ? 'opacity-0 h-0 overflow-hidden' 
              : 'py-0 opacity-0 translate-y-4 h-0 overflow-hidden'
          }`}>
            <p className="text-xl text-gray-700 font-semibold">
              Enter your 6-digit MPIN
            </p>
          </div>

          {/* MPIN Input Display - Show when keypad is active */}
          <div className={`transition-all duration-300 ease-out ${
            showKeypad 
              ? 'opacity-0 h-0 overflow-hidden' 
              : 'mb-0 opacity-0 translate-y-4 h-0 overflow-hidden'
          }`}>
            <div className="flex justify-center space-x-5 sm:space-x-4 lg:space-x-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full flex items-center justify-center shadow-inner ${
                    mpin[index] 
                      ? 'bg-green-700' 
                      : 'bg-slate-200'
                  }`}
                >
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errors.mpin && (
              <p className="mt-3 sm:mt-2 lg:mt-2 text-sm sm:text-xs lg:text-xs text-red-600 text-center">{errors.mpin}</p>
            )}
          </div>

          {/* MPIN Login Button - Positioned above footer - Hide instantly when keypad is active */}
          <div className={`flex justify-center pt-6 pb-1 ${
            showKeypad ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <button 
              type="button"
              onClick={() => {
                if (!username.trim()) {
                  setErrors(prev => ({ ...prev, username: 'Username is required' }))
                  return
                }
                // Remove focus from username field
                document.getElementById('username')?.blur()
                setShowKeypad(true)
              }}
              disabled={isLoading || !username.trim()}
              className={`w-24 h-24 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-xl shadow-lg 
                         bg-green-600 hover:bg-green-700 active:bg-green-800
                         text-white font-semibold text-sm sm:text-xs lg:text-sm
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center
                         cursor-pointer
                         ${isLoading ? 'opacity-60' : 'hover:scale-105 active:scale-95'}`}
            >
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <div className="text-center">
                  <i className="bi bi-grid-3x3-gap text-3xl sm:text-2xl lg:text-3xl block mb-1"></i>
                  <span className="text-xs sm:text-xs lg:text-xs font-medium">MPIN Login</span>
                </div>
              )}
            </button>
          </div>

          {/* Forgot Username/MPIN Link */}
          <div className={`text-center pt-4 ${
            showKeypad ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowForgotModal(true)
              }}
              className="text-xs text-gray-500 hover:text-green-600 active:text-green-700 cursor-pointer transition-colors"
            >
              Forgot Username or MPIN?
            </a>
          </div>
        </div>
        </div>
      </div>

      {/* Keypad Overlay - Slides up from bottom of screen */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
          showKeypad ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onClick={(e) => {
          // Close keypad if clicking outside the keypad content
          if (e.target === e.currentTarget) {
            setShowKeypad(false)
          }
        }}
      >
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gray-100 border-t border-gray-300 shadow-2xl pt-6 p-2 transition-transform duration-300 ease-out ${
            showKeypad ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ boxShadow: '0 -10px 25px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)' }}
        >
          {/* iOS-style separator handle - clickable to close keypad */}
          <div 
            className="flex justify-center -mt-5 mb-1 cursor-pointer py-2"
            onClick={() => setShowKeypad(false)}
          >
            <div className="w-15 h-1 bg-gray-400 rounded-full hover:bg-gray-500 transition-colors duration-200"></div>
          </div>

          {/* MPIN Input Component */}
          <div className="mb-6">
            <MPINKeypad 
              mpin={mpin}
              onNumberPress={onKeypadNumber}
              onBackspace={onKeypadBackspace}
              errors={errors}
              isLoading={isLoading}
              showKeypad={true}
            />
          </div>
        </div>
      </div>

      {/* Forgot MPIN Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Account Recovery"
        type="alert"
      >
        <p className="text-gray-600">
          Please visit Barangay LIAS office directly for assistance with account recovery.
          Bring a valid ID for verification.
        </p>
      </Modal>
    </>
  )
}
