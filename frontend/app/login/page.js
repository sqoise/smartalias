'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import LoginCard from '../../components/public/LoginCard'
import ApiClient from '../../lib/apiClient'

export default function LoginPage() {

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const router = useRouter()
  const toastRef = useRef()
  
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [userInfo, setUserInfo] = useState(null) // Store user details after username validation
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false) // Track keypad state for PublicLayout

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const handleAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  const sanitizeInput = (input) => {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .slice(0, 100) // Limit length
  }

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  
  const validatePin = () => {
    const newErrors = {}

    if (!pin) {
      newErrors.pin = 'PIN is required'
    } else if (pin.length !== 6) {
      newErrors.pin = 'PIN must be 6 digits'
    } else if (!/^\d{6}$/.test(pin)) {
      newErrors.pin = 'PIN must contain only numbers'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // AUTHENTICATION HANDLERS
  // ============================================
  const handleUsernameSubmit = async (submittedUsername) => {
    setUsername(submittedUsername)
    
    const sanitizedUsername = sanitizeInput(submittedUsername)
    
    if (!sanitizedUsername) {
      setErrors({ username: 'Username is required' })
      handleAlert('Username is required', 'error')
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const userExists = await ApiClient.checkUser(sanitizedUsername)

      console.log(userExists);
      
      if (!userExists.success) {
        handleAlert(userExists.error, 'error')
        setIsLoading(false)
        return
      }

      setUserInfo(userExists.user)
      setShowKeypad(true)
      
    } catch (error) {
      handleAlert(error, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async ({ username, pin }) => {
    if (!validatePin()) return

    setIsLoading(true)
    
    try {
      const result = await ApiClient.login(sanitizeInput(username), pin)

      if (!result.success) {
        handleAlert(result.error, 'error')
        setIsLoading(false)
        return
      }

      // Handle successful login
      const message = !result.user.passwordChanged 
        ? 'Password change required. Redirecting…'
        : `Welcome ${result.user.firstName}! Redirecting…`
      
      handleAlert(message, !result.user.passwordChanged ? 'info' : 'success')

      setTimeout(() => {
        router.push(result.redirectTo)
      }, 10)

    } catch (error) {
      handleAlert('Login failed. Please try again.', 'error')
      setIsLoading(false)
    }
  }

  // ============================================
  // PIN KEYPAD HANDLERS
  // ============================================
  const handleKeypadNumber = (number) => {
    if (pin.length < 6) {
      const newPin = pin + number
      setPin(newPin)
      if (errors.pin) setErrors(prev => ({ ...prev, pin: '' }))
      
      // Auto-execute login when 6 digits are completed
      if (newPin.length === 6) {
        setTimeout(() => {
          handleLogin({ username, pin: newPin })
        }, 100) // Small delay for better UX
      }
    }
  }

  const handleKeypadBackspace = () => {
    setPin(prev => prev.slice(0, -1))
    if (errors.pin) setErrors(prev => ({ ...prev, pin: '' }))
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <ToastNotification ref={toastRef} />
      <PublicLayout hideBackgroundImage={showKeypad}>
        <LoginCard
          username={username}
          setUsername={setUsername}
          onUsernameSubmit={handleUsernameSubmit}
          pin={pin}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          onLogin={handleLogin}
          onKeypadNumber={handleKeypadNumber}
          onKeypadBackspace={handleKeypadBackspace}
          showKeypad={showKeypad}
          setShowKeypad={setShowKeypad}
        />
      </PublicLayout>
    </>
  )
}
