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
    <div className={`w-full max-w-xl lg:max-w-2xl bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mx-auto lg:m-10 relative z-10 ${className}`}>
      <div className="mb-6 text-center">
        {showLogo && (
          <img 
            src="/images/barangay_logo.jpg" 
            alt="Barangay Logo" 
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
        )}
        <div className="inline-flex items-center gap-2">
          <h2 className="text-2xl font-bold text-black-700">Sign in to Smart LIAS</h2>
        </div>
      </div>

      {/* Animated Step Container */}
      <div className={`relative overflow-hidden transition-all duration-300 ease-out ${
        currentStep === 'username' ? 'min-h-[120px]' : 'min-h-[400px]'
      }`}>
        {/* Step 1: Username */}
        <div className={`transition-all duration-300 ease-out transform ${
          currentStep === 'username' 
            ? 'translate-x-0 opacity-100 scale-100' 
            : '-translate-x-full opacity-0 scale-95 absolute top-0 left-0 w-full'
        }`}>
          <form onSubmit={onUsernameSubmit} className="space-y-3">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } placeholder:text-gray-400 bg-white`}
                placeholder="Enter your username"
                autoFocus
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="flex justify-between items-end">
              <button 
                type="button"
                onClick={() => {
                  // Show modal for forgot username
                  alert('Forgot Username Modal - This would show a modal dialog for username recovery')
                }}
                className="text-xs text-gray-600 hover:text-gray-800 underline cursor-pointer"
              >
                Forgot username?
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-[30%] inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
                           rounded-md border bg-green-600 border-green-600 text-white 
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
          <div className="space-y-4">
            {/* User Info Display - Compact */}
            <div 
              className="flex items-center space-x-2 p-1.5 px-3 border border-gray-200 rounded-3xl bg-white min-w-[50%] w-fit mx-auto cursor-pointer hover:bg-gray-50 transition-colors duration-200 group relative"
              onClick={onBackToUsername}
              title="Switch Account"
            >
              <div className="w-6 h-6 bg-green-50 hover:bg-gray-100 rounded-full flex items-center justify-center">
                <i className="bi bi-person-fill text-green-500 text-xs"></i>
              </div>
              <div className="flex-1 whitespace-nowrap">
                <p className="text-sm font-medium text-gray-900">
                  {username}
                </p>
              </div>
              <div className="text-green-600 hover:text-green-700 text-sm">
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

      <p className="mt-6 text-center text-xs text-gray-500">
        Access for registered residents and administrators.
      </p>
    </div>
  )
}
