'use client'

import { useState } from 'react'
import MPINKeypad from './MPINKeypad'
import Spinner from './Spinner'

export default function LoginCard({
  currentStep,
  username,
  setUsername,
  mpin,
  errors,
  setErrors,
  isLoading,
  onUsernameSubmit,
  onBackToUsername,
  onKeypadNumber,
  onKeypadBackspace,
  showLogo = false,
  className = ''
}) {
  return (
    <div className={`w-full max-w-md lg:max-w-xl bg-white rounded-lg shadow-lg p-6 sm:p-4 lg:p-8 mx-auto lg:m-10 relative z-10 ${className}`}>
      <div className="mb-6 sm:mb-4 lg:mb-6 text-center">
        {showLogo && (
          <img 
            src="/images/barangay_logo.jpg" 
            alt="Barangay Logo" 
            className="w-16 h-16 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full mx-auto mb-4 sm:mb-3 lg:mb-4"
          />
        )}
        <div className="inline-flex items-center gap-2">
          <h2 className="text-xl sm:text-lg lg:text-xl font-bold text-black-700">Sign in to Smart LIAS</h2>
        </div>
      </div>

      {/* Animated Step Container - mobile optimized, desktop compact */}
      <div className={`relative overflow-hidden transition-all duration-300 ease-out ${
        currentStep === 'username' ? 'min-h-[120px] sm:min-h-[100px] lg:min-h-[120px]' : 'min-h-[320px] sm:min-h-[280px] lg:min-h-[320px]'
      }`}>
        {/* Step 1: Username */}
        <div className={`transition-all duration-300 ease-out transform ${
          currentStep === 'username' 
            ? 'translate-x-0 opacity-100 scale-100' 
            : '-translate-x-full opacity-0 scale-95 absolute top-0 left-0 w-full'
        }`}>
          <form onSubmit={onUsernameSubmit} className="space-y-4 sm:space-y-3 lg:space-y-3">
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
                className={`w-full rounded-lg sm:rounded-md lg:rounded-md px-4 py-3 sm:px-3 sm:py-2 lg:px-3 lg:py-2 text-base sm:text-sm lg:text-sm border ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } placeholder:text-gray-400 bg-white`}
                placeholder="Enter your username"
                autoFocus
              />
              {errors.username && (
                <p className="mt-2 sm:mt-1 lg:mt-1 text-sm sm:text-xs lg:text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="flex justify-between items-end pt-3 sm:pt-2 lg:pt-2">
              <button 
                type="button"
                onClick={() => {
                  // Show modal for forgot username
                  alert('Forgot Username Modal - This would show a modal dialog for username recovery')
                }}
                className="text-sm sm:text-xs lg:text-xs text-gray-600 hover:text-gray-800 underline cursor-pointer"
              >
                Forgot username?
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-[45%] min-w-[120px] inline-flex items-center justify-center px-6 py-3 sm:px-4 sm:py-2.5 lg:px-4 lg:py-2.5 text-base sm:text-sm lg:text-sm font-medium 
                           rounded-lg sm:rounded-md lg:rounded-md border bg-green-600 border-green-600 text-white 
                           hover:bg-green-700 focus:ring-1 focus:ring-green-500 focus:outline-none
                           disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed
                           transition-colors duration-200 gap-2 cursor-pointer
                           ${isLoading ? 'opacity-60' : ''}`}
              >
                {isLoading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <i className="bi bi-arrow-right"></i>
                )}
                <span>Continue</span>
              </button>
            </div>
          </form>
        </div>

        {/* Step 2: MPIN */}
        <div className={`transition-all duration-300 ease-out transform ${
          currentStep === 'mpin' 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95 absolute top-0 left-0 w-full'
        }`}>
          <div className="space-y-6 sm:space-y-4 lg:space-y-4">
            {/* User Info Display - Mobile optimized, desktop compact */}
            <div className="flex items-center space-x-3 sm:space-x-2 lg:space-x-2 p-2.5 px-4 sm:p-1.5 sm:px-3 lg:p-1.5 lg:px-3 border border-gray-200 rounded-full bg-white min-w-[50%] w-fit mx-auto cursor-pointer hover:bg-gray-50 transition-colors duration-200 group relative"
              onClick={onBackToUsername}
              title="Switch Account"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 lg:w-6 lg:h-6 bg-green-50 hover:bg-gray-100 rounded-full flex items-center justify-center">
                <i className="bi bi-person-fill text-green-500 text-sm sm:text-xs lg:text-xs"></i>
              </div>
              <div className="flex-1 whitespace-nowrap">
                <p className="text-base sm:text-sm lg:text-sm text-gray-900">
                  {username}
                </p>
              </div>
              <div className="text-green-600 hover:text-green-700 text-base sm:text-sm lg:text-sm">
                <i className="bi bi-arrow-left-right"></i>
              </div>
              
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                Switch Account
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* MPIN Container with Shadow Only */}
            <MPINKeypad 
              mpin={mpin}
              onNumberPress={onKeypadNumber}
              onBackspace={onKeypadBackspace}
              errors={errors}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
