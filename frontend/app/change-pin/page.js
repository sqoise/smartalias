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
  const [isValidToken, setIsValidToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('new-pin') // 'new-pin' or 'confirm-pin'
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false)

  // ==================== TOKEN VALIDATION ====================
  useEffect(() => {
    try {
      const token = searchParams.get('token')
      
      // Demo: Only accept 'qwe123' - REPLACE WITH REAL TOKEN VALIDATION
      if (token !== 'qwe123') {
        router.push('/not-found')
        return
      }
      
      // Demo: Show loading spinner for UX - ADJUST TIMING AS NEEDED
      setTimeout(() => {
        setIsValidToken(true)
      }, 500)
    } catch (error) {
      console.error('Token validation error:', error)
      router.push('/not-found')
    }
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

  // ==================== UI HELPERS ====================
  const showAlert = (message, type = 'info') => {
    alertToast(toastRef, message, type)
  }

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
      
      // Call the API to change password
      const result = await ApiClient.changePin(token, pin)
      
      if (result.success) {
        return { success: true, message: result.message || 'Password changed successfully' }
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
        showAlert(AUTH_MESSAGES.PIN_CHANGE_SUCCESS, 'success')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        showAlert(AUTH_MESSAGES.PIN_CHANGE_FAILED, 'error')
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
  if (!isValidToken) {
    return <PageLoading />
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

  return (
    <>
      <ToastNotification ref={toastRef} />
      <NavigationHeader />
      <PublicLayout 
        variant="change-pin" 
        hideBackgroundImage={showKeypad}
      >
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
