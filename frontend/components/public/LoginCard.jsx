'use client'

import { useState, useEffect, useRef } from 'react'
import MPINKeypad from '../common/MPINKeypad'
import Spinner from '../common/Spinner'
import Modal from '../common/Modal'
import ToastNotification from '../common/ToastNotification'

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
  onUsernameSubmit, // Add this prop for username validation
  showLogo = false,
  className = '',
  showKeypad,
  setShowKeypad
}) {
  const [showForgotModal, setShowForgotModal] = useState(false)
  const toastRef = useRef()

  // Clear MPIN when keypad is toggled off
  useEffect(() => {
    if (!showKeypad && mpin.length > 0) {
      // Clear all MPIN digits when keypad is closed
      const currentLength = mpin.length
      for (let i = 0; i < currentLength; i++) {
        setTimeout(() => onKeypadBackspace(), i * 10) // Small staggered delay
      }
    }
  }, [showKeypad])

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
          // If keypad is not shown and username is entered, validate and show keypad
          event.preventDefault()
          
          // Use parent validation instead of local validation
          if (onUsernameSubmit) {
            onUsernameSubmit(username.trim())
          }
        }
        // Removed MPIN Enter handling - login now happens automatically on 6th digit
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
          {/* DEMO: Demo Credentials - TODO: Remove this entire section for production release */}
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
          {/* DEMO: End of demo section */}
          
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


          
          {/* MPIN Login Button */}
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
                    <span className="text-xs sm:text-xs lg:text-xs font-medium">MPIN Login</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* MPIN Input - Show on both mobile and desktop when keypad is active */}
          {showKeypad && (
            <div>
              <div className="text-center pt-4">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Enter your 6-digit MPIN
                </label>
                <div className="flex justify-center space-x-3 py-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full flex items-center justify-center shadow-inner ${
                        mpin[index] 
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

          {/* Forgot Username/MPIN Link - Mobile positioning */}
          <div className={`lg:hidden text-center pt-4 ${
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
        
        {/* Forgot Username/MPIN Link - Desktop fixed footer */}
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
            Forgot Username or MPIN?
          </a>
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
                  <MPINKeypad 
                    mpin={mpin}
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

          {/* MPIN Input Component */}
          <div className="mb-6">
            <MPINKeypad 
              mpin={mpin}
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

      {/* Forgot MPIN Modal */}
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
