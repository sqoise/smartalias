'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ToastNotification from '../../components/ToastNotification'
import LoginLayout from '../../components/LoginLayout'
import LoginCard from '../../components/LoginCard'
import { auth } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('username') // 'username' or 'mpin'
  const [username, setUsername] = useState('')
  const [mpin, setMpin] = useState('') // Changed from password to mpin
  const [userInfo, setUserInfo] = useState(null) // Store user details after username validation
  const [errors, setErrors] = useState({})
  const toastRef = useRef()

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

  const validateUsername = () => {
    // Demo: Simplified validation for testing frontend design/UX
    const EASY_TESTING = true; // Set to false for real validation
    
    if (EASY_TESTING) {
      // Demo: Allow any non-empty username for testing
      const newErrors = {}
      const sanitizedUsername = sanitizeInput(username)
      
      if (!sanitizedUsername) {
        newErrors.username = 'Username is required'
      }
      
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const newErrors = {}
    const sanitizedUsername = sanitizeInput(username)

    if (!sanitizedUsername) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateMpin = () => {
    // Demo: Simplified validation for testing frontend design/UX
    const EASY_TESTING = true; // Set to false for real validation
    
    if (EASY_TESTING) {
      // Demo: Allow any 6-digit MPIN for testing
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

  const handleUsernameSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateUsername()) {
      return
    }

    setIsLoading(true)
    const sanitizedUsername = sanitizeInput(username)

    try {
      // Check if username exists in the system
      const userExists = await auth.checkUsername(sanitizedUsername)
      
      if (!userExists.success) {
        handleAlert(userExists.error || 'Username not found', 'error')
        setIsLoading(false)
        return
      }

      // Store user info and move to MPIN step
      setUserInfo(userExists.user)
      setCurrentStep('mpin')
      setErrors({}) // Clear any previous errors
      
    } catch (error) {
      handleAlert('Unable to verify username. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMpinSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateMpin()) {
      return
    }

    setIsLoading(true)
    
    const sanitizedData = {
      username: sanitizeInput(username),
      password: mpin // Use MPIN as password for backend compatibility
    }

    try {
      // Use frontend-only authentication
      const result = await auth.login(sanitizedData.username, sanitizedData.password)

      if (!result.success) {
        handleAlert(result.error, 'error')
        setIsLoading(false)
        return
      }

      // Handle successful login
      if (!result.user.passwordChanged) {
        handleAlert('Password change required. Redirecting…', 'info')
      } else {
        handleAlert(`Welcome ${result.user.firstName}! Redirecting…`, 'success')
      }

      setTimeout(() => {
        router.push(result.redirectTo)
      }, 10)

    } catch (error) {
      handleAlert('Login failed. Please try again.', 'error')
      setIsLoading(false)
    }
  }

  const handleBackToUsername = () => {
    // Demo: Add smooth transition back to username step
    setCurrentStep('username')
    setMpin('')
    setUserInfo(null)
    setErrors({})
  }

  // Demo: MPIN keypad number handler
  const handleKeypadNumber = (number) => {
    if (mpin.length < 6) {
      setMpin(prev => prev + number)
      if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
    }
  }

  // Demo: MPIN backspace handler
  const handleKeypadBackspace = () => {
    setMpin(prev => prev.slice(0, -1))
    if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
  }

  return (
    <>
      <ToastNotification ref={toastRef} />
      <LoginLayout>
        <LoginCard
          currentStep={currentStep}
          username={username}
          setUsername={setUsername}
          mpin={mpin}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          onUsernameSubmit={handleUsernameSubmit}
          onBackToUsername={handleBackToUsername}
          onKeypadNumber={handleKeypadNumber}
          onKeypadBackspace={handleKeypadBackspace}
        />
      </LoginLayout>
    </>
  )
}
