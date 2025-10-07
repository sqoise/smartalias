'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import ChangePINCard from '../../components/public/ChangePINCard'
import PageLoading from '../../components/common/PageLoading'
import ApiClient from '../../lib/apiClient'
import { alertToast } from '../../lib/utility'
import { AUTH_MESSAGES } from '../../lib/constants'

export default function ChangePINPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toastRef = useRef()

  // ==================== STATE MANAGEMENT ====================
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [tokenExpiry, setTokenExpiry] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('new-pin') // 'new-pin' or 'confirm-pin'
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // ==================== UI HELPERS ====================
  const showAlert = (message, type = 'info') => {
    alertToast(toastRef, message, type)
  }

  // ==================== TOKEN VALIDATION ====================
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Get token from URL query parameter
        const tokenFromUrl = searchParams.get('token')
        
        if (!tokenFromUrl) {
          // No token in URL - show error and redirect to login
          showAlert('No token provided', 'error')
          setTimeout(() => router.push('/login'), 2000)
          return
        }
        
        // Validate token with backend
        const result = await ApiClient.validateChangePasswordToken(tokenFromUrl)
        
        if (result.success && result.data) {
          setUserInfo(result.data.user)
          setTokenExpiry(result.data.expiresAt)
          setIsValidToken(true)
          setIsValidating(false)
        } else {
          // Invalid token
          showAlert(result.error || 'Invalid or expired token', 'error')
          setTimeout(() => router.push('/login'), 2000)
        }
      } catch (error) {
        console.error('Token validation error:', error)
        showAlert('Failed to validate token', 'error')
        setTimeout(() => router.push('/login'), 2000)
      }
    }
    
    validateToken()
  }, [searchParams, router])

  // ==================== KEYBOARD HANDLING ====================
  useEffect(() => {
    if (!isValidToken) return

    const handleKeyPress = (event) => {
      // Always allow ESC key to close keypad
      if (event.key === 'Escape') {
        if (showKeypad) {
          setShowKeypad(false)
        }
        return
      }
      
      // Block keyboard input when keypad is closed
      if (!showKeypad) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyPress, true)
    document.addEventListener('keypress', handleKeyPress, true)
    document.addEventListener('keyup', handleKeyPress, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress, true)
      document.removeEventListener('keypress', handleKeyPress, true)
      document.removeEventListener('keyup', handleKeyPress, true)
    }
  }, [isValidToken, showKeypad])

  // ==================== MOBILE FOCUS HANDLING ====================
  useEffect(() => {
    if (!isValidToken || showKeypad) return

    const isMobile = window.innerWidth < 768
    if (isMobile) {
      document.activeElement?.blur()
      document.body.focus()
    }
  }, [isValidToken, showKeypad])

  // ==================== VALIDATION LOGIC ====================
  const validatePIN = (pin) => {
    if (!pin) return { isValid: false, error: AUTH_MESSAGES.PIN_REQUIRED }
    if (pin.length !== 6) return { isValid: false, error: AUTH_MESSAGES.PIN_INVALID_LENGTH }
    if (!/^\d+$/.test(pin)) return { isValid: false, error: AUTH_MESSAGES.PIN_INVALID_FORMAT }
    return { isValid: true }
  }

  const isValidPIN = (pin) => {
    return validatePIN(pin).isValid
  }
  const submitNewPIN = async (pin) => {
    try {
      const token = searchParams.get('token')
      
      if (!token) {
        return { success: false, error: 'Token not found' }
      }

      const result = await ApiClient.changePasswordFirstTime(token, pin)
      
      if (result.success) {
        return { success: true, message: result.message || 'PIN changed successfully' }
      } else {
        return { success: false, error: result.error || AUTH_MESSAGES.PIN_CHANGE_FAILED }
      }
    } catch (error) {
      console.error('API Error:', error)
      return { success: false, error: AUTH_MESSAGES.NETWORK_ERROR }
    }
  }

  // ==================== API READY FUNCTIONS ====================
  // ==================== UI HELPERS ====================
  const getCurrentPin = () => {
    return currentStep === 'new-pin' ? newPin : confirmPin
  }

  const getPinValidation = () => {
    return validatePIN(newPin)
  }

  // ==================== STEP HANDLERS ====================
  const handleNewPinSubmit = () => {
    const validation = validatePIN(newPin)
    if (!validation.isValid) {
      setErrors({ newPin: true })
      showAlert(validation.error, 'error')
      return
    }

    setCurrentStep('confirm-pin')
    setErrors({})
  }

  const handleConfirmPinSubmit = async () => {
    if (newPin !== confirmPin) {
      setErrors({ confirmPin: true })
      showAlert(AUTH_MESSAGES.PIN_MISMATCH, 'error')
      return
    }

    setIsLoading(true)

    try {
      const result = await submitNewPIN(newPin)
      
      if (result.success) {
        showAlert('PIN changed successfully! Redirecting to login...', 'success')
        
        // Redirect to login page so user can login with new PIN
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        showAlert(result.error || AUTH_MESSAGES.PIN_CHANGE_FAILED, 'error')
      }
    } catch (error) {
      showAlert(AUTH_MESSAGES.PIN_CHANGE_FAILED, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToNewPin = () => {
    setCurrentStep('new-pin')
    setNewPin('')
    setConfirmPin('')
    setErrors({})
  }

  // ==================== KEYPAD HANDLERS ====================
  const handleKeypadNumber = (number) => {
    if (currentStep === 'new-pin') {
      if (newPin.length < 6) {
        const newValue = newPin + number
        setNewPin(newValue)
        
        // Demo: Auto-advance when PIN is complete - KEEP OR REMOVE AS NEEDED
        if (newValue.length === 6 && isValidPIN(newValue)) {
          setTimeout(() => {
            setCurrentStep('confirm-pin')
            setErrors({})
          }, 300)
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newValue = confirmPin + number
        setConfirmPin(newValue)
        
        // Demo: Auto-submit when confirm PIN is complete - KEEP OR REMOVE AS NEEDED
        if (newValue.length === 6) {
          setTimeout(() => handleConfirmPinSubmit(), 100)
        }
      }
    }
  }

  const handleKeypadBackspace = () => {
    if (currentStep === 'new-pin') {
      setNewPin(prev => prev.slice(0, -1))
    } else {
      setConfirmPin(prev => prev.slice(0, -1))
    }
  }

  // ==================== RENDER ====================
  if (isValidating || !isValidToken) {
    return <PageLoading />
  }

  // Calculate time remaining for token expiry
  const getTimeRemaining = () => {
    if (!tokenExpiry) return null
    const now = new Date()
    const expiry = new Date(tokenExpiry)
    const hoursRemaining = Math.floor((expiry - now) / (1000 * 60 * 60))
    return hoursRemaining
  }

  // Simple Navigation Header
  const NavigationHeader = () => (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        <Link 
          href="/home"
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200"
        >
          ← Home
        </Link>
      </nav>
    </header>
  )

  // Show loading while validating token
  if (isValidating) {
    return <PageLoading message="Validating token..." />
  }

  // Don't render if token is invalid
  if (!isValidToken) {
    return <PageLoading message="Redirecting to login..." />
  }

  return (
    <>
      <ToastNotification ref={toastRef} />
      <NavigationHeader />
      <PublicLayout 
        variant="change-pin" 
        hideBackgroundImage={showKeypad}
      >
        {/* Token Expiry Disclaimer */}
        {tokenExpiry && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Password Change Link Active</span>
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  You have <span className="font-semibold">{getTimeRemaining()} hours</span> before this link expires. 
                  After setting your PIN, you will be redirected to the login page.
                </p>
              </div>
            </div>
          </div>
        )}
        
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
  )
}
