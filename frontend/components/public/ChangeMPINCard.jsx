'use client'

import { useState, useEffect, useRef } from 'react'
import MPINKeypad from '../common/MPINKeypad'
import ToastNotification from '../common/ToastNotification'
import Link from 'next/link'

export default function ChangeMPINCard({
  currentStep,
  newPin,
  confirmPin,
  getCurrentPin,
  getPinValidation,
  errors,
  setErrors,
  isLoading,
  onKeypadNumber,
  onKeypadBackspace,
  onBackToNewPin,
  className = '', // Accept className prop from PublicLayout
  showKeypad,     // Accept showKeypad prop from parent
  setShowKeypad   // Accept setShowKeypad prop from parent
}) {
  const toastRef = useRef()
  // Remove local showKeypad state since it comes from parent now
  // const [showKeypad, setShowKeypad] = useState(false)

  const pinValidation = getPinValidation()

  // Toggle keypad visibility
  const toggleKeypad = () => {
    setShowKeypad(!showKeypad)
  }

  // Close keypad
  const closeKeypad = () => {
    setShowKeypad(false)
  }

  return (
    <>
      {/* Main Card Container */}
      <div 
        className={`relative w-full max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-[120rem] bg-transparent mx-auto lg:mx-4 xl:mx-6 2xl:mx-8 p-6 sm:p-4 lg:p-8 h-[400px] lg:h-[600px] xl:h-[555px] 2xl:h-[555px] ${className}`}
      >
        {/* Step Indicator - Full width with fixed positioning and swipe animation */}
        <div className="absolute -top-4 sm:-top-2 lg:-top-4 left-1/2 transform -translate-x-1/2 bg-gray-100 border-2 border-white rounded-full p-1 relative overflow-hidden w-80 z-50">
          {/* Animated background indicator that slides left to right */}
          <div 
            className={`absolute top-1 bottom-1 bg-white shadow-sm border border-gray-200 rounded-full transition-all duration-500 ease-in-out`}
            style={{ 
              width: 'calc(50% - 4px)', 
              left: currentStep === 'new-pin' ? '2px' : 'calc(50% + 2px)'
            }}
          ></div>
          
          {/* Step content container */}
          <div className="relative flex z-10">
            {/* Step 1: New MPIN */}
            <div 
              className={`w-1/2 px-2 py-2 sm:px-3 sm:py-2 rounded-md transition-all duration-500 flex-shrink-0 relative z-20 ${
                currentStep === 'confirm-pin' ? 'cursor-pointer hover:bg-green-200/50' : ''
              }`}
              onClick={() => {
                if (currentStep === 'confirm-pin') {
                  onBackToNewPin()
                }
              }}
            >
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === 'new-pin' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-green-600 text-white'
                }`}>
                  {currentStep === 'new-pin' ? '1' : '✓'}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  currentStep === 'new-pin' 
                    ? 'text-gray-900' 
                    : 'text-green-700'
                }`}>
                  Set PIN
                </span>
              </div>
            </div>

            {/* Step 2: Confirm MPIN */}
            <div className="w-1/2 px-2 py-2 sm:px-3 sm:py-2 rounded-md transition-all duration-500 flex-shrink-0 relative z-20">
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === 'confirm-pin' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  currentStep === 'confirm-pin' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Confirm
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step Indicator - Mobile header positioning */}
        <div className={`lg:mb-6 mb-4 flex-shrink-0 lg:relative absolute lg:top-0 -top-4 left-0 right-0 lg:px-0 px-2 transition-all duration-300 ease-out ${
          showKeypad ? 'lg:opacity-0 lg:-translate-y-2 lg:pointer-events-none opacity-100 translate-y-0' : 'opacity-100 translate-y-0'
        }`}>
        </div>

        {/* Main Content Area */}
        <div className="h-full lg:pt-8 pt-12">

          {/* MPIN Input - Fixed position container to prevent movement */}
          <div className="mb-6 lg:mt-4 text-center">
            <div className={showKeypad ? "pt-4" : "cursor-pointer"} onClick={!showKeypad ? toggleKeypad : undefined}>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                {currentStep === 'new-pin' 
                  ? 'Create your new 6-digit MPIN'
                  : 'Confirm your new MPIN'
                }
              </label>
              <div className="flex justify-center space-x-3 py-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full flex items-center justify-center shadow-inner ${
                      getCurrentPin()[index] 
                        ? 'bg-green-700' 
                        : 'bg-slate-200'
                    }`}
                  >
                  </div>
                ))}
              </div>
              <p className={`text-sm text-gray-500 mt-2 transition-all duration-500 ease-out ${
                showKeypad ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-pulse'
              }`}>
                Tap to enter PIN
              </p>
            </div>
          </div>

          {/* Back to New PIN Button - Show only in confirm step */}
          {/* Removed - Step indicator is now clickable instead */}
        </div>
        
        {/* Back to Login Link - Desktop fixed footer */}
        <div className={`hidden lg:block absolute bottom-4 left-0 right-0 text-center transition-opacity duration-300 ${
          showKeypad ? 'opacity-0' : 'opacity-100'
        }`}>
          <Link href="/login" className="text-sm text-green-600 hover:text-green-700 active:text-green-800 cursor-pointer">
            ← Back to Login
          </Link>
          <p className="mx-4 my-4 text-center text-xs text-gray-500">
              You have 24 hours before this link expires. After setting your PIN, you'll be redirected to the login page.
          </p>
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
            <div className="flex justify-center pt-2 cursor-pointer" onClick={closeKeypad}>
              <div className="w-10 h-1 bg-gray-400 rounded-full hover:bg-gray-500 active:bg-gray-600 transition-colors duration-200"></div>
            </div>
            {/* Keypad content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full p-2">
                <MPINKeypad 
                  mpin={getCurrentPin()}
                  onNumberPress={onKeypadNumber}
                  onBackspace={onKeypadBackspace}
                  onClose={closeKeypad}
                  onBack={closeKeypad}
                  errors={errors}
                  isLoading={isLoading}
                  showKeypad={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Keypad Overlay - Slides up from bottom of screen */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-out ${
          showKeypad ? 'pointer-events-auto' : 'pointer-events-none'
        } fixed inset-0 z-40`}
      >
        {/* Mobile keypad - slides up from bottom */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gray-200 border-t border-gray-300 shadow-2xl pt-4 p-2 transition-transform duration-300 ease-out ${
            showKeypad ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ boxShadow: '0 -10px 25px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)' }}
        >
          {/* iOS-style separator handle - clickable to close keypad */}
          <div className="flex justify-center cursor-pointer mb-4" onClick={closeKeypad}>
            <div className="w-10 h-1 bg-gray-400 rounded-full hover:bg-gray-500 active:bg-gray-600 transition-colors duration-200"></div>
          </div>
          
          <MPINKeypad 
            mpin={getCurrentPin()}
            onNumberPress={onKeypadNumber}
            onBackspace={onKeypadBackspace}
            onClose={closeKeypad}
            onBack={closeKeypad}
            errors={errors}
            isLoading={isLoading}
            showKeypad={true}
          />
        </div>
      </div>

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </>
  )
}
