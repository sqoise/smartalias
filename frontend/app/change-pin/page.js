'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/ToastNotification'
import PublicLayout from '../../components/PublicLayout'
import MPINKeypad from '../../components/MPINKeypad'
import Spinner from '../../components/Spinner'
// Demo: Using mock auth service
import { auth } from '../../lib/auth'

// Demo: MPIN validation function for frontend
function validateMPIN(mpin) {
  return {
    length: mpin?.length === 6,
    numeric: /^\d+$/.test(mpin),
    notSequential: !isSequential(mpin),
    notRepeating: !isRepeating(mpin)
  }
}

function isSequential(mpin) {
  if (mpin?.length !== 6) return false
  
  // Check for ascending sequence (123456, 234567, etc.)
  let ascending = true
  let descending = true
  
  for (let i = 1; i < mpin.length; i++) {
    if (parseInt(mpin[i]) !== parseInt(mpin[i-1]) + 1) {
      ascending = false
    }
    if (parseInt(mpin[i]) !== parseInt(mpin[i-1]) - 1) {
      descending = false
    }
  }
  
  return ascending || descending
}

function isRepeating(mpin) {
  if (mpin?.length !== 6) return false
  
  // Check if all digits are the same
  const firstDigit = mpin[0]
  return mpin.split('').every(digit => digit === firstDigit)
}

export default function ChangePinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toastRef = useRef()

  // Form state
  const [currentStep, setCurrentStep] = useState('new-pin') // 'new-pin' or 'confirm-pin'
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasValidationError, setHasValidationError] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [errors, setErrors] = useState({})

  // Real-time MPIN validation
  const pinValidation = validateMPIN(newPin)

  const handleAlert = (message, type = 'info') => {
    if (toastRef.current && toastRef.current.show) {
      toastRef.current.show(message, type)
    }
  }

  // Token validation with proper error throwing
  useEffect(() => {
    const validateToken = () => {
      const token = searchParams.get('token')

      // Missing token - throw error for 500 status
      if (!token) {
        throw new Error('Change PIN link is missing or invalid')
      }

      // Demo: Simulate token validation
      const EASY_TESTING = true
      
      if (EASY_TESTING) {
        // Demo: Any token works for testing
        setUserInfo({
          username: 'demo_user',
          role: 'resident',
          name: 'Demo User'
        })
        return
      }

      // Real token validation would happen here
      const result = auth.validatePasswordToken(token)
      
      if (!result.success) {
        throw new Error(result.error || 'Invalid or expired change PIN link')
      }

      setUserInfo(result.user)
    }

    try {
      validateToken()
    } catch (error) {
      console.error('Token validation failed:', error)
      handleAlert(error.message, 'error')
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }, [searchParams, router])

  const handleNewPinSubmit = (e) => {
    e.preventDefault()
    
    // Validate new PIN
    const validation = validateMPIN(newPin)
    const newErrors = {}

    if (!validation.length) {
      newErrors.mpin = 'PIN must be exactly 6 digits'
    } else if (!validation.numeric) {
      newErrors.mpin = 'PIN must contain only numbers'
    } else if (!validation.notSequential) {
      newErrors.mpin = 'PIN cannot be sequential (e.g., 123456)'
    } else if (!validation.notRepeating) {
      newErrors.mpin = 'PIN cannot have all same digits (e.g., 111111)'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep('confirm-pin')
      setErrors({})
    }
  }

  const handleConfirmPinSubmit = async (e) => {
    e.preventDefault()
    
    if (newPin !== confirmPin) {
      setErrors({ mpin: 'PINs do not match' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const token = searchParams.get('token')
      
      // Demo: Simulate API call
      const EASY_TESTING = true
      
      if (EASY_TESTING) {
        // Demo: Always succeed for testing
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        handleAlert('PIN changed successfully! Redirecting to login...', 'success')
        
        setIsRedirecting(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }

      // Real API call would happen here
      const result = await auth.changePassword(token, newPin)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to change PIN')
      }

      handleAlert('PIN changed successfully! Redirecting to login...', 'success')
      
      setIsRedirecting(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Change PIN failed:', error)
      handleAlert(error.message || 'Failed to change PIN. Please try again.', 'error')
      setHasValidationError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToNewPin = () => {
    setCurrentStep('new-pin')
    setConfirmPin('')
    setErrors({})
  }

  const handleKeypadNumber = (digit) => {
    if (currentStep === 'new-pin') {
      if (newPin.length < 6) {
        const newValue = newPin + digit
        setNewPin(newValue)
        
        // Clear errors when user starts typing
        if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
      }
    } else {
      if (confirmPin.length < 6) {
        const newValue = confirmPin + digit
        setConfirmPin(newValue)
        
        // Clear errors when user starts typing
        if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
        
        // Auto-submit when confirm PIN is complete
        if (newValue.length === 6) {
          setTimeout(() => {
            const form = document.querySelector('form')
            if (form) form.requestSubmit()
          }, 100)
        }
      }
    }
  }

  const handleKeypadBackspace = () => {
    if (currentStep === 'new-pin') {
      if (newPin.length > 0) {
        setNewPin(newPin.slice(0, -1))
      }
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1))
      }
    }
  }

  const getCurrentPin = () => {
    return currentStep === 'new-pin' ? newPin : confirmPin
  }

  const getCurrentSubmitHandler = () => {
    return currentStep === 'new-pin' ? handleNewPinSubmit : handleConfirmPinSubmit
  }

  if (!userInfo) {
    return (
      <PublicLayout>
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8 mx-auto">
          <div className="text-center">
            <Spinner size="lg" color="green" className="mx-auto mb-4" />
            <p className="text-gray-600">Validating your request...</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <>
      <ToastNotification ref={toastRef} />
      <PublicLayout
        variant="change-pin"
        title="Change Your PIN"
        subtitle="Update your secure 6-digit PIN for Smart LIAS Portal access."
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8 mx-auto">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-shield-lock text-green-600 text-xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentStep === 'new-pin' ? 'Set New PIN' : 'Confirm New PIN'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {currentStep === 'new-pin' 
                ? 'Create a secure 6-digit PIN for your account'
                : 'Re-enter your new PIN to confirm'
              }
            </p>
            
            {userInfo && (
              <div className="mt-4 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  Changing PIN for: <span className="font-medium">{userInfo.username}</span>
                </p>
              </div>
            )}
          </div>

          <form onSubmit={getCurrentSubmitHandler()}>
            {/* Step Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep === 'new-pin' ? 'text-blue-600' : 'text-green-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === 'new-pin' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {currentStep === 'new-pin' ? '1' : <i className="bi bi-check"></i>}
                  </div>
                  <span className="ml-2 text-sm font-medium">New PIN</span>
                </div>
                
                <div className={`w-8 h-0.5 ${currentStep === 'new-pin' ? 'bg-gray-200' : 'bg-green-200'}`}></div>
                
                <div className={`flex items-center ${currentStep === 'confirm-pin' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === 'confirm-pin' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Confirm</span>
                </div>
              </div>
            </div>

            {/* MPIN Keypad */}
            <MPINKeypad
              mpin={getCurrentPin()}
              onNumberPress={handleKeypadNumber}
              onBackspace={handleKeypadBackspace}
              errors={errors}
              isLoading={isLoading || isRedirecting}
            />

            {/* Validation Rules - Show only for new PIN step */}
            {currentStep === 'new-pin' && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-700 mb-3">Your PIN must be:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${pinValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${pinValidation.length ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>Exactly 6 digits</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${pinValidation.numeric ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${pinValidation.numeric ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>Numbers only</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${pinValidation.notSequential ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${pinValidation.notSequential ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>Not sequential (e.g., 123456)</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${pinValidation.notRepeating ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${pinValidation.notRepeating ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>Not all same digits (e.g., 111111)</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {currentStep === 'new-pin' ? (
                <button 
                  type="submit" 
                  disabled={isLoading || isRedirecting || newPin.length !== 6} 
                  className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 font-semibold flex items-center justify-center gap-2 transition-colors ${
                    (isLoading || isRedirecting || newPin.length !== 6) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <i className="bi bi-arrow-right"></i>
                  <span>Continue</span>
                </button>
              ) : (
                <>
                  <button 
                    type="submit" 
                    disabled={isLoading || isRedirecting || confirmPin.length !== 6} 
                    className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 font-semibold flex items-center justify-center gap-2 transition-colors ${
                      (isLoading || isRedirecting || confirmPin.length !== 6) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <i className="bi bi-check2"></i>
                    <span>{isRedirecting ? 'Redirecting...' : 'Change PIN'}</span>
                    {(isLoading || isRedirecting) && (
                      <div className="animate-spin border-2 border-white/60 border-t-transparent rounded-full w-4 h-4"></div>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleBackToNewPin}
                    disabled={isLoading || isRedirecting}
                    className={`w-full border border-gray-300 text-gray-700 rounded-md py-2.5 font-medium flex items-center justify-center gap-2 transition-colors hover:bg-gray-50 ${
                      (isLoading || isRedirecting) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <i className="bi bi-arrow-left"></i>
                    <span>Back to New PIN</span>
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
              ← Back to Login
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            You have 24 hours before this link expires. After setting your PIN, you'll be redirected to the login page.
          </p>
        </div>
      </PublicLayout>
    </>
  )
}
