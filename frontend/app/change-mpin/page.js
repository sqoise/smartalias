'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/ToastNotification'
import PublicLayout from '../../components/PublicLayout'
import ChangeMPINCard from '../../components/ChangeMPINCard'

export default function ChangeMPINPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('new-pin') // 'new-pin' or 'confirm-pin'
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false) // Track keypad state for PublicLayout
  const toastRef = useRef()

  const handleAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  // Demo: MPIN validation function for frontend
  const validateMPIN = (mpin) => {
    return {
      length: mpin?.length === 6,
      numeric: /^\d+$/.test(mpin),
      notSequential: !isSequential(mpin),
      notRepeating: !isRepeating(mpin)
    }
  }

  const isSequential = (mpin) => {
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

  const isRepeating = (mpin) => {
    if (mpin?.length !== 6) return false
    
    // Check if all digits are the same
    const firstDigit = mpin[0]
    return mpin.split('').every(digit => digit === firstDigit)
  }

  // Clear MPIN when keypad is toggled off
  useEffect(() => {
    if (!showKeypad) {
      if (currentStep === 'new-pin' && newPin.length > 0) {
        setNewPin('')
      } else if (currentStep === 'confirm-pin' && confirmPin.length > 0) {
        setConfirmPin('')
      }
    }
  }, [showKeypad, currentStep, newPin, confirmPin])

  // Handle Escape key press
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (showKeypad) {
          setShowKeypad(false)
        }
        return
      }
      
      // Handle Enter key for auto-submit
      if (event.key === 'Enter') {
        if (showKeypad && getCurrentPin().length === 6) {
          event.preventDefault()
          if (currentStep === 'new-pin') {
            handleNewPinSubmit()
          } else {
            handleConfirmPinSubmit()
          }
        }
      }
    }

    // Use capture phase to handle events before other components
    document.addEventListener('keydown', handleKeyPress, true)
    return () => document.removeEventListener('keydown', handleKeyPress, true)
  }, [showKeypad, currentStep, newPin, confirmPin])

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

  // Demo: Handle new PIN step
  const handleNewPinSubmit = () => {
    const validation = validateMPIN(newPin)
    
    if (!validation.length) {
      handleAlert('PIN must be exactly 6 digits', 'error')
      return
    } else if (!validation.numeric) {
      handleAlert('PIN must contain only numbers', 'error')
      return
    }

    setCurrentStep('confirm-pin')
    setErrors({})
  }

  // Demo: Handle confirm PIN step
  const handleConfirmPinSubmit = async () => {
    if (newPin !== confirmPin) {
      handleAlert('PINs do not match', 'error')
      return
    }

    setIsLoading(true)

    try {
      // Demo: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      handleAlert('PIN changed successfully! Redirecting to login...', 'success')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      handleAlert('Failed to change PIN. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToNewPin = () => {
    setCurrentStep('new-pin')
    setNewPin('') // Reset the new PIN
    setConfirmPin('') // Reset the confirm PIN
    setErrors({})
  }

  // Demo: MPIN keypad number handler
  const handleKeypadNumber = (number) => {
    if (currentStep === 'new-pin') {
      if (newPin.length < 6) {
        const newValue = newPin + number
        setNewPin(newValue)
        
        // Auto-advance when new PIN is complete (6 digits)
        if (newValue.length === 6) {
          const validation = validateMPIN(newValue)
          if (validation.length && validation.numeric) {
            // PIN has 6 digits and is numeric, auto-advance to confirm step
            setTimeout(() => {
              setCurrentStep('confirm-pin')
              setErrors({})
            }, 300)
          } else {
            // PIN is invalid, show error
            setTimeout(() => {
              if (!validation.length) {
                handleAlert('PIN must be exactly 6 digits', 'error')
              } else if (!validation.numeric) {
                handleAlert('PIN must contain only numbers', 'error')
              }
            }, 100)
          }
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newValue = confirmPin + number
        setConfirmPin(newValue)
        
        // Auto-submit when confirm PIN is complete
        if (newValue.length === 6) {
          setTimeout(() => {
            handleConfirmPinSubmit()
          }, 100)
        }
      }
    }
  }

  // Demo: MPIN backspace handler
  const handleKeypadBackspace = () => {
    if (currentStep === 'new-pin') {
      setNewPin(prev => prev.slice(0, -1))
    } else {
      setConfirmPin(prev => prev.slice(0, -1))
    }
  }

  const getCurrentPin = () => {
    return currentStep === 'new-pin' ? newPin : confirmPin
  }

  const getPinValidation = () => {
    return validateMPIN(newPin)
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
