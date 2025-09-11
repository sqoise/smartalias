'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import ChangeMPINCard from '../../components/public/ChangeMPINCard'
import PageLoading from '../../components/common/PageLoading'
import ApiClient from '../../lib/api'

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

  // ==================== VALIDATION LOGIC ====================
  const validateMPIN = (mpin) => {
    return {
      length: mpin?.length === 6,
      numeric: /^\d+$/.test(mpin)
    }
  }

  const isValidMPIN = (mpin) => {
    const validation = validateMPIN(mpin)
    return validation.length && validation.numeric
  }

  // ==================== API READY FUNCTIONS ====================
  const submitNewMPIN = async (pin) => {
    try {
      const token = searchParams.get('token')
      
      // Call the API to change password
      const result = await ApiClient.changePassword(token, pin)
      
      if (result.success) {
        return { success: true, message: result.message || 'Password changed successfully' }
      } else {
        return { success: false, error: result.error || 'Failed to change password' }
      }
    } catch (error) {
      console.error('API Error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // ==================== UI HELPERS ====================
  const showAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  const getCurrentPin = () => {
    return currentStep === 'new-pin' ? newPin : confirmPin
  }

  const getPinValidation = () => {
    return validateMPIN(newPin)
  }

  // ==================== STEP HANDLERS ====================
  const handleNewPinSubmit = () => {
    if (!isValidMPIN(newPin)) {
      showAlert('PIN must be exactly 6 digits', 'error')
      return
    }

    setCurrentStep('confirm-pin')
    setErrors({})
  }

  const handleConfirmPinSubmit = async () => {
    if (newPin !== confirmPin) {
      showAlert('PINs do not match', 'error')
      return
    }

    setIsLoading(true)

    try {
      const result = await submitNewMPIN(newPin)
      
      if (result.success) {
        showAlert('PIN changed successfully! Redirecting to login...', 'success')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        showAlert('Failed to change PIN. Please try again.', 'error')
      }
    } catch (error) {
      showAlert('Failed to change PIN. Please try again.', 'error')
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
        if (newValue.length === 6 && isValidMPIN(newValue)) {
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

  return (
    <>
      <ToastNotification ref={toastRef} />
      <PublicLayout 
        variant="change-pin" 
        hideBackgroundImage={showKeypad}
      >
        <ChangeMPINCard
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
