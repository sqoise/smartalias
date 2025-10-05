'use client'

import { useState, useEffect, useRef } from 'react'
import PINKeypad from '../common/PINKeypad'
import Spinner from '../common/Spinner'
import Modal from '../common/Modal'
import ToastNotification from '../common/ToastNotification'

export default function LoginCard({
  username,
  setUsername,
  pin,
  errors,
  setErrors,
  isLoading,
  onLogin,
  onKeypadNumber,
  onKeypadBackspace,
  onUsernameSubmit, // Add this prop for username validation
  showLogo = false,
  className = '',
  showKeypad,
  setShowKeypad
}) {
  const [showForgotModal, setShowForgotModal] = useState(false)
  const toastRef = useRef()

  // Clear PIN when keypad is toggled off
  useEffect(() => {
    if (!showKeypad && pin.length > 0) {
      // Clear all PIN digits when keypad is closed
      const currentLength = pin.length
      for (let i = 0; i < currentLength; i++) {
        setTimeout(() => onKeypadBackspace(), i * 10) // Small staggered delay
      }
    }
  }, [showKeypad, pin.length, onKeypadBackspace]) // ✅ Fixed: Added missing dependencies

  const handlePINLogin = () => {
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }))
      return
    }
    if (pin.length !== 6) {
      setErrors(prev => ({ ...prev, pin: 'Please enter your 6-digit PIN' }))
      return
    }
    onLogin({ username, pin })
  }

  // Handle Enter and Escape key press
  useEffect(() => {
    const handleKeyPress = (event) => {
      // NEVER interfere with system shortcuts (Command, Ctrl, Alt key combinations)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return // Let system shortcuts pass through completely
      }
      
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
          // If keypad is not shown and username is entered, validate and show keypad
          event.preventDefault()
          
          // Use parent validation instead of local validation
          if (onUsernameSubmit) {
            onUsernameSubmit(username.trim())
          }
        }
        // Removed PIN Enter handling - login now happens automatically on 6th digit
      }
    }

    // Use capture phase to handle events before other components
    document.addEventListener('keydown', handleKeyPress, true)
    return () => document.removeEventListener('keydown', handleKeyPress, true)
  }, [showKeypad, username, pin, handlePINLogin])

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
      <div className={`relative w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-5xl bg-transparent mx-auto lg:mx-4 xl:mx-6 2xl:mx-8 ${className} h-[400px] lg:h-[600px] xl:h-[555px] 2xl:h-[555px]`}>
        
        {/* Main Content Area */}
        <div 
          className="h-full"
          onClick={(e) => {
            // Close keypad on desktop when clicking the main content area
            if (showKeypad && window.innerWidth >= 1024) {
              e.preventDefault()
              e.stopPropagation()
              setShowKeypad(false)
            }
          }}
        >
            
        {/* Header for when logo is not shown */}
        {!showLogo && (
          <div className="mb-6 sm:mb-4 lg:mb-6 text-center">
            <h2 className="font-bold text-black-700 text-3xl sm:text-2xl lg:text-3xl">
              Sign in to Smart LIAS
            </h2>
          </div>
        )}
        

        {/* Single Page Login Form */}
        <div className="h-full flex flex-col">
          {/* Quick Tips & Information Panel - Positioned above username */}
          {!showKeypad && (
            <div className="mb-4 max-w-md mx-auto w-full">
              <div className="p-2.5 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-sm">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-green-800 mb-1 leading-none">Quick Tips:</h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="flex items-start">
                        <span className="text-green-600 mr-1.5 font-bold text-xs leading-none">•</span>
                        <span className="leading-tight">Use your registered username and 6-digit PIN</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-600 mr-1.5 font-bold text-xs leading-none">•</span>
                        <span className="leading-tight">New resident? Register to access services</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-600 mr-1.5 font-bold text-xs leading-none">•</span>
                        <span className="leading-tight">Keep your PIN secure</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                  {/* Username icon with error state styling */}
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
                    errors.username 
                      ? 'bg-red-50' 
                      : 'bg-transparent'
                  }`}>
                    <i className={`bi bi-person text-lg sm:text-sm md:text-lg lg:text-lg transition-colors duration-300 ${
                      errors.username ? 'text-red-500' : 'text-gray-500'
                    }`}></i>
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
                    className={`w-full rounded-lg sm:rounded-md lg:rounded-md transition-all duration-300 ${
                      errors.username 
                        ? 'border-2 border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50' 
                        : 'border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } placeholder:text-gray-400 focus:scale-100 bg-white pl-10 pr-4 py-3 sm:pl-9 sm:pr-3 sm:py-2 lg:pl-10 lg:pr-3 lg:py-2 text-base sm:text-sm lg:text-sm`}
                    placeholder="Enter your username"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          )}


          
          {/* PIN Login Button */}
          {!showKeypad && (
            <div className="flex justify-center pt-6 pb-1">
              <button 
                type="button"
                onClick={() => {
                  // Use parent validation instead of local validation
                  if (onUsernameSubmit) {
                    onUsernameSubmit(username.trim())
                  }
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
                  <Spinner size="xl" color="white" />
                ) : (
                  <div className="text-center">
                    <i className="bi bi-grid-3x3-gap text-3xl sm:text-2xl lg:text-3xl block mb-1"></i>
                    <span className="text-xs sm:text-xs lg:text-xs font-medium">PIN Login</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* PIN Input - Show on both mobile and desktop when keypad is active */}
          {showKeypad && (
            <div>
              <div className="text-center pt-4">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Enter your 6-digit PIN
                </label>
                <div className="flex justify-center space-x-3 py-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full flex items-center justify-center shadow-inner ${
                        pin[index] 
                          ? 'bg-green-700' 
                          : 'bg-slate-200'
                      }`}
                    >
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Forgot Username/PIN Link - Mobile positioning */}
          <div className={`lg:hidden text-center ${
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
              Forgot Username or PIN?
            </a>
          </div>

          {/* Register Link - Mobile positioning */}
          <div className={`lg:hidden text-center mt-2 ${
            showKeypad ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <a 
                href="/register"
                className="text-green-600 hover:text-green-700 active:text-green-800 font-medium cursor-pointer transition-colors"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
        
        {/* Access Notice and Forgot Link - Desktop fixed footer */}
        <div className={`hidden lg:block absolute bottom-4 left-0 right-0 text-center transition-opacity duration-300 ${
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
            Forgot Username or PIN?
          </a>
          
          {/* Register Link - Desktop */}
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <a 
                href="/register"
                className="text-green-600 hover:text-green-700 active:text-green-800 font-medium cursor-pointer transition-colors"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
        </div>
        
        {/* Desktop Keypad Overlay - Slides up from bottom within card container */}
        <div 
          className={`hidden lg:block absolute inset-x-0 bottom-0 transition-all duration-300 ease-out overflow-hidden ${
            showKeypad ? 'h-1/2' : 'h-0'
          }`} 
          style={{ boxShadow: showKeypad ? '0 -4px 6px rgba(0, 0, 0, 0.07), 0 -1px 3px rgba(0, 0, 0, 0.06)' : 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full w-full bg-gray-200 backdrop-blur-sm rounded-b-lg flex flex-col">
            {/* Top handle indicator */}
            <div className="flex justify-center pt-2 cursor-pointer" onClick={() => setShowKeypad(false)}>
              <div className="w-10 h-1 bg-gray-400 rounded-full hover:bg-gray-400 active:bg-gray-400 transition-colors duration-200"></div>
            </div>
            {/* Keypad content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full p-2">
                  <PINKeypad 
                    pin={pin}
                    onNumberPress={onKeypadNumber}
                    onBackspace={onKeypadBackspace}
                    onBack={() => setShowKeypad(false)}
                    errors={errors}
                    isLoading={isLoading}
                    showKeypad={true}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keypad Overlay - Slides up from bottom of screen */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-out ${
          showKeypad ? 'pointer-events-auto' : 'pointer-events-none'
        } fixed inset-0 z-50`}
        onClick={(e) => {
          // Close keypad if clicking outside the keypad content
          if (e.target === e.currentTarget) {
            setShowKeypad(false)
          }
        }}
      >
        {/* Mobile keypad - slides up from bottom */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gray-200 border-t border-gray-300 shadow-2xl pt-6 p-2 transition-transform duration-300 ease-out ${
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

          {/* PIN Input Component */}
          <div className="mb-6">
            <PINKeypad 
              pin={pin}
              onNumberPress={onKeypadNumber}
              onBackspace={onKeypadBackspace}
              onBack={() => setShowKeypad(false)}
              errors={errors}
              isLoading={isLoading}
              showKeypad={true}
            />
          </div>
        </div>
      </div>

      {/* Forgot PIN Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Account Recovery"
        type="alert"
      >
        <p className="text-gray-600">
          Please visit Barangay LIAS office for assistance. Bring a valid ID for verification.
        </p>
      </Modal>

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </>
  )
}
