'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')
  const [isLoading, setIsLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [isValidating, setIsValidating] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hasValidationError, setHasValidationError] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Password validation functions
  const validatePassword = (pwd) => {
    return {
      length: pwd.length >= 8,
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  }

  const passwordValidation = validatePassword(password)

  // Extract token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    
    if (!urlToken) {
      // Redirect to home page if no token provided
      router.push('/')
      return
    }
    
    setToken(urlToken)
    
    // Decode token to show user info
    try {
      const payload = JSON.parse(atob(urlToken.split('.')[1]))
      setUserInfo({
        username: payload.username,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role
      })
      setIsValidating(false) // Token is valid, show the form
    } catch (error) {
      console.error('Error decoding token:', error)
      // Redirect to home page for invalid tokens
      router.push('/')
      return
    }
  }, [router])

  const handleAlert = (message, type = 'info') => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const form = new FormData(e.target)
    const newPassword = form.get('newPassword')
    const confirmPassword = form.get('confirmPassword')

    // Validate password using our validation function
    const validation = validatePassword(newPassword)
    if (!validation.length || !validation.number || !validation.special) {
      setHasValidationError(true)
      handleAlert('Password must meet all requirements', 'error')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setHasValidationError(true)
      handleAlert('Passwords do not match', 'error')
      setIsLoading(false)
      return
    }

    // Clear validation error if we get here
    setHasValidationError(false)

    // Send password to server to be hashed and stored
    handleAlert('Updating password…', 'info')
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPassword: newPassword,
          token: token 
        })
      })

      const data = await res.json()
      if (!res.ok) {
        // For token-related errors or any error, redirect to home
        if (data?.redirectTo) {
          router.push(data.redirectTo)
          return
        }
        handleAlert(data?.error || 'Failed to update password', 'error')
        setIsLoading(false)
        return
      }

      // Success - redirect to appropriate dashboard
      handleAlert('Password updated successfully! Redirecting…', 'ok')
      setIsRedirecting(true)
      setTimeout(() => {
        router.push(data.redirectTo || '/')
      }, 15)
    } catch (err) {
      console.error(err)
      handleAlert('Network error while updating password', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const alertStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  // Show loading while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <main className="min-h-screen grid lg:grid-cols-[70%_30%] relative">
        <section className="relative hidden lg:block z-0">
          <img src="/images/admin_bg.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
          <div className="absolute inset-0 bg-green-900/40"></div>

          <div className="relative h-full flex flex-col justify-end p-10 text-white">
            <img src="/images/barangay_logo.jpg" alt="Barangay Logo" className="w-20 h-20 rounded-full mb-4" />
            <h1 className="text-4xl font-extrabold">Barangay LIAS</h1>
            <p className="mt-6 max-w-xl text-white/90">Set your account password to access the SMART LIAS Portal.</p>
            <p className="mt-10 text-sm text-white/70">&copy; {new Date().getFullYear()} Smart LIAS</p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-12 relative overflow-visible">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 relative z-10 lg:-ml-80">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2">
                <h2 className="text-2xl font-bold text-green-700">Create New Password</h2>
              </div>
              
            </div>

            {showAlert && (
              <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${alertStyles[alertType]}`}>
                {alertMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    id="newPassword" 
                    name="newPassword" 
                    type={showNewPassword ? "text" : "password"} 
                    required 
                    minLength="8" 
                    value={password}
                    disabled={isLoading || isRedirecting}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      // Clear validation error when user starts typing
                      if (hasValidationError) setHasValidationError(false)
                    }}
                    className={`w-full rounded-md border px-3 py-2 pr-10 transition-colors ${
                      isLoading || isRedirecting ? 'bg-gray-100 cursor-not-allowed border-gray-300' :
                      hasValidationError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                    }`}
                    placeholder="Enter new password" 
                  />
                  <button
                    type="button"
                    disabled={isLoading || isRedirecting}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isLoading || isRedirecting 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                    }`}
                  >
                    <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    minLength="8" 
                    value={confirmPassword}
                    disabled={isLoading || isRedirecting}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      // Clear validation error when user starts typing
                      if (hasValidationError) setHasValidationError(false)
                    }}
                    className={`w-full rounded-md border px-3 py-2 pr-10 transition-colors ${
                      isLoading || isRedirecting ? 'bg-gray-100 cursor-not-allowed border-gray-300' :
                      hasValidationError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                    }`}
                    placeholder="Confirm new password" 
                  />
                  <button
                    type="button"
                    disabled={isLoading || isRedirecting}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isLoading || isRedirecting 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                    }`}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-700 mb-3">Your password must contain:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${passwordValidation.length ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>At least 8 characters</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${passwordValidation.number ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>At least 1 number</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${passwordValidation.special ? 'text-green-600' : 'text-gray-400'}`}>
                    <i className={`bi transition-all duration-300 ease-in-out ${passwordValidation.special ? 'bi-check-circle-fill' : 'bi-x-circle'}`}></i>
                    <span>At least 1 symbol (!@#$%^&*)</span>
                  </li>
                </ul>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || isRedirecting} 
                className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${(isLoading || isRedirecting) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <i className="bi bi-check2"></i>
                <span>{isRedirecting ? 'Redirecting...' : 'Submit'}</span>
                {(isLoading || isRedirecting) && <div className="animate-spin border-2 border-white/60 border-t-transparent rounded-full w-4 h-4"></div>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
                ← Back to Login
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">You have 24 hours before this link expires. After setting your password, you'll be redirected to the login page.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
