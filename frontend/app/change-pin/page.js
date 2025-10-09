'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PublicLayout from '../../components/public/PublicLayout'
import ToastNotification from '../../components/common/ToastNotification'
import ChangePINCard from '../../components/public/ChangePINCard'
import PageLoadingV2 from '../../components/common/PageLoadingV2'
import ApiClient from '../../lib/apiClient'
import { alertToast } from '../../lib/utility'
import { AUTH_MESSAGES } from '../../lib/constants'

export default function ChangePinPage() {
  const router = useRouter()
  const toastRef = useRef()
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('new-pin')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false)
  const [token, setToken] = useState('')

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      setToken(urlToken)
      setIsValidatingToken(false)
    } else {
      showAlert('Invalid or missing token. Please try logging in again.', 'error')
      setTimeout(() => router.push('/login'), 2000)
    }
  }, [])

  const showAlert = (message, type) => alertToast(toastRef, message, type)
  
  const handleGoToLogin = () => {
    // Clear any existing authentication tokens
    localStorage.removeItem('token')
    router.push('/login')
  }
  
  const validatePIN = (pin) => {
    if (!pin) return { isValid: false, error: AUTH_MESSAGES.PIN_REQUIRED }
    if (pin.length !== 6) return { isValid: false, error: AUTH_MESSAGES.PIN_INVALID_LENGTH }
    if (!/^\d+$/.test(pin)) return { isValid: false, error: AUTH_MESSAGES.PIN_INVALID_FORMAT }
    return { isValid: true }
  }

  const getPinValidation = () => validatePIN(newPin)
  const getCurrentPin = () => currentStep === 'new-pin' ? newPin : confirmPin
  
  const handleBackToNewPin = () => {
    setCurrentStep('new-pin')
    setNewPin('')
    setConfirmPin('')
    setErrors({})
  }

  const handleKeypadNumber = (number) => {
    if (currentStep === 'new-pin' && newPin.length < 6) {
      const val = newPin + number
      setNewPin(val)
      if (val.length === 6 && validatePIN(val).isValid) {
        setTimeout(() => { setCurrentStep('confirm-pin'); setErrors({}) }, 300)
      }
    } else if (confirmPin.length < 6) {
      const val = confirmPin + number
      setConfirmPin(val)
      if (val.length === 6) setTimeout(() => handleSubmit(val), 100)
    }
  }

  const handleKeypadBackspace = () => {
    if (currentStep === 'new-pin') {
      setNewPin(p => p.slice(0, -1))
      setErrors({})
    } else {
      setConfirmPin(p => p.slice(0, -1))
      setErrors({})
    }
  }

  const handleSubmit = async (confirmValue = confirmPin) => {
    // Validate PIN match
    if (newPin !== confirmValue) {
      setErrors({ confirmPin: true })
      showAlert(AUTH_MESSAGES.PIN_MISMATCH, 'error')
      setConfirmPin('')
      return
    }

    // Validate token exists
    if (!token) {
      showAlert('Session expired. Please login again.', 'error')
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    setIsLoading(true)

    try {
      // Call backend API to change PIN
      const result = await ApiClient.changePasswordFirstTime(token, newPin)

      if (!result.success) {
        showAlert(result.error || 'Failed to change PIN. Please try again.', 'error')
        setIsLoading(false)
        setCurrentStep('new-pin')
        setNewPin('')
        setConfirmPin('')
        return
      }

      // Success!
      showAlert('PIN changed successfully!', 'success')
      setIsLoading(false)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('PIN change error:', error)
      showAlert('An error occurred. Please try again.', 'error')
      setIsLoading(false)
      setCurrentStep('new-pin')
      setNewPin('')
      setConfirmPin('')
    }
  }

  return (
    <>
      <ToastNotification ref={toastRef} />
      {isValidatingToken ? (
        <PageLoadingV2 isLoading={true} />
      ) : (
        <>
          <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
            <nav className="flex justify-end">
              <button
                onClick={handleGoToLogin}
                className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 focus:ring-2 focus:outline-none transition-all cursor-pointer"
              >
                Go to Login
              </button>
            </nav>
          </header>
          <PublicLayout hideBackgroundImage={showKeypad} allowAuthenticated={true}>
            <ChangePINCard
              currentStep={currentStep}
              newPin={newPin}
              confirmPin={confirmPin}
              getCurrentPin={getCurrentPin}
              getPinValidation={getPinValidation}
              errors={errors}
              setErrors={setErrors}
              isLoading={isLoading}
              onKeypadNumber={handleKeypadNumber}
              onKeypadBackspace={handleKeypadBackspace}
              onBackToNewPin={handleBackToNewPin}
              showKeypad={showKeypad}
              setShowKeypad={setShowKeypad}
            />
          </PublicLayout>
        </>
      )}
    </>
  )
}
