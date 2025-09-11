'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import LoginCard from '../../components/public/LoginCard'
import ApiClient from '../../lib/api'

export default function LoginPage() {

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const router = useRouter()
  const toastRef = useRef()
  
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [mpin, setMpin] = useState('')
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
  
  const validateMpin = () => {
    const newErrors = {}

    if (!mpin) {
      newErrors.mpin = 'MPIN is required'
    } else if (mpin.length !== 6) {
      newErrors.mpin = 'MPIN must be 6 digits'
    } else if (!/^\d{6}$/.test(mpin)) {
      newErrors.mpin = 'MPIN must contain only numbers'
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
      const userExists = await ApiClient.checkUsername(sanitizedUsername)

      console.log(userExists);
      
      if (!userExists.success) {
        handleAlert(userExists.error, 'error')
        setIsLoading(false)
        return
      }

      setUserInfo(userExists.user)
      setShowKeypad(true)
      
    } catch (error) {
      handleAlert('Unable to verify username. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async ({ username, mpin }) => {
    if (!validateMpin()) return

    setIsLoading(true)
    
    try {
      const result = await ApiClient.login(sanitizeInput(username), mpin)

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
  // MPIN KEYPAD HANDLERS
  // ============================================
  const handleKeypadNumber = (number) => {
    if (mpin.length < 6) {
      const newMpin = mpin + number
      setMpin(newMpin)
      if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
      
      // Auto-execute login when 6 digits are completed
      if (newMpin.length === 6) {
        setTimeout(() => {
          handleLogin({ username, mpin: newMpin })
        }, 100) // Small delay for better UX
      }
    }
  }

  const handleKeypadBackspace = () => {
    setMpin(prev => prev.slice(0, -1))
    if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
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
          mpin={mpin}
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
