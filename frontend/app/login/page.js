'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import LoginCard from '../../components/public/LoginCard'
import ApiClient from '../../lib/apiClient'
import { alertToast, sanitizeInput } from '../../lib/utility'
import { AUTH_MESSAGES } from '@shared/constants'
import { USER_ROLES } from '../../lib/constants'

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
  const [errors, setErrors] = useState({}) // Boolean flags for field error states
  const [showKeypad, setShowKeypad] = useState(false) // Track keypad state for PublicLayout

  // Unified toast helper
  const handleAlert = (message, type = 'info') => alertToast(toastRef, message, type)

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  
  // Frontend-only validation (basic format checks)
  const validateUsername = (value) => {
    const sanitizedUsername = sanitizeInput(value)
    
    // Check each validation rule and return error message if fails
    if (!sanitizedUsername) return AUTH_MESSAGES.USERNAME_REQUIRED
    if (sanitizedUsername.length < 6) return AUTH_MESSAGES.USERNAME_TOO_SHORT
    if (sanitizedUsername.length > 32) return AUTH_MESSAGES.USERNAME_TOO_LONG
    if (!/^[a-z0-9_.]+$/.test(sanitizedUsername)) return AUTH_MESSAGES.USERNAME_INVALID_FORMAT
    
    // All validations passed
    return null
  }
  
  const validatePin = (pinToValidate = pin) => {
    if (!pinToValidate) {
      setErrors({ pin: true })
      handleAlert(AUTH_MESSAGES.PIN_REQUIRED, 'error')
      return false
    } 
    if (pinToValidate.length !== 6) {
      setErrors({ pin: true })
      handleAlert(AUTH_MESSAGES.PIN_INVALID_LENGTH, 'error')
      return false
    } 
    if (!/^\d{6}$/.test(pinToValidate)) {
      setErrors({ pin: true })
      handleAlert(AUTH_MESSAGES.PIN_INVALID_FORMAT, 'error')
      return false
    }
    return true
  }

  // ============================================
  // AUTHENTICATION HANDLERS
  // ============================================
  const handleUsernameSubmit = async (submittedUsername) => {
    setUsername(submittedUsername)
    
    // Frontend validation first (immediate feedback)
    const validationError = validateUsername(submittedUsername)
    if (validationError !== null) {
      setErrors({ username: true })
      handleAlert(validationError, 'error')
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const userExists = await ApiClient.checkUser(sanitizeInput(submittedUsername))
      
      if (!userExists.success) {
        if (userExists.status === 404) {
          setErrors({ username: true })
          handleAlert(AUTH_MESSAGES.USERNAME_NOT_FOUND, 'error')
        } else if (userExists.status === 422) {
          setErrors({ username: true })
          handleAlert(AUTH_MESSAGES.USERNAME_VALIDATION_FAILED, 'error')
        } else if ((userExists.error || '').includes('fetch')) {
          setErrors({ username: true })
          handleAlert(AUTH_MESSAGES.USERNAME_CONNECTION_ERROR, 'error')
        } else {
          setErrors({ username: true })
          handleAlert(AUTH_MESSAGES.USERNAME_VALIDATION_FAILED, 'error')
        }
        setIsLoading(false)
        return
      }

      // Clear any previous errors on successful validation
      setErrors({})
      setUserInfo(userExists.data?.user || userExists.user)
      setShowKeypad(true)
      
    } catch (error) {
      setErrors({ username: true })
      handleAlert(AUTH_MESSAGES.VALIDATION_RETRY, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async ({ username, pin }) => {
    if (!validatePin(pin)) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await ApiClient.login(sanitizeInput(username), pin)

      if (!result.success) {
        handleAlert(result.error || AUTH_MESSAGES.LOGIN_FAILED, 'error')
        setIsLoading(false)
        return
      }

      // Handle successful login
      const user = result.data?.user || result.user
      const redirectTo = result.data?.redirectTo || result.redirectTo
      
      const message = !user.passwordChanged 
        ? AUTH_MESSAGES.PIN_CHANGE_REQUIRED
        : `Welcome ${user.firstName}! Redirecting…`
      
      handleAlert(message, !user.passwordChanged ? 'info' : 'success')

      setTimeout(() => {
        router.push(redirectTo)
      }, 1500) // Increased delay to see the toast message

    } catch (error) {
      handleAlert(AUTH_MESSAGES.LOGIN_FAILED, 'error')
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
      if (errors.pin) setErrors(prev => ({ ...prev, pin: false }))
      
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
    if (errors.pin) setErrors(prev => ({ ...prev, pin: false }))
  }

  // ============================================
  // RENDER
  // ============================================
  
  // Simple Navigation Header
  const NavigationHeader = () => (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        <Link 
          href="/home"
          className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200"
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
