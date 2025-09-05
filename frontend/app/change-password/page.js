'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/ToastNotification'
import { auth } from '../../lib/frontend-auth'

// Password validation function
function validatePassword(password) {
  return {
    length: password?.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&().?]/.test(password)
  }
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toastRef = useRef()

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasValidationError, setHasValidationError] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Real-time password validation
  const passwordValidation = validatePassword(password)

  const handleAlert = (message, type = 'info') => {
    if (toastRef.current && toastRef.current.show) {
      toastRef.current.show(message, type)
    }
  }

  // Token validation with proper error throwing
  useEffect(() => {
    const validateToken = () => {
      const token = searchParams.get('token')

      // Missing token - throw error for 500 status
      if (!token) {
        throw new Error('Change password link is missing or invalid')
      }

      try {
        // Decode and validate token
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        // Check expiration - throw error for 500 status
        const currentTime = Math.floor(Date.now() / 1000)
        if (payload.exp && currentTime > payload.exp) {
          throw new Error('Change password link has expired')
        }

        // Token is valid - set user info
        setUserInfo({
          username: payload.username,
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: payload.role
        })
      } catch (error) {
        // Invalid token format - throw error for 500 status
        if (error.message.includes('expired') || error.message.includes('missing')) {
          throw error // Re-throw specific errors
        }
        throw new Error('Invalid change password link format')
      }
    }

    validateToken()
  }, [searchParams])

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

    // Update password using frontend auth
    handleAlert('Updating password…', 'info')
    try {
      const token = searchParams.get('token')
      const result = await auth.setPassword(token, newPassword)

      if (!result.success) {
        handleAlert(result.error || 'Failed to update password', 'error')
        setIsLoading(false)
        return
      }

      // Success - redirect to appropriate dashboard
      handleAlert('Password updated successfully! Redirecting…', 'success')
      setIsRedirecting(true)
      setTimeout(() => {
        router.push(result.redirectTo || '/')
      }, 15)
    } catch (err) {
      console.error(err)
      handleAlert('Error while updating password', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <ToastNotification ref={toastRef} />

      <main className="min-h-screen grid lg:grid-cols-[70%_30%] relative">
        <section className="relative hidden lg:block z-0">
          <img src="/images/bg.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    id="newPassword" 
                    name="newPassword" 
                    type={showNewPassword ? "text" : "password"} 
                    required 
                    maxLength="64" 
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
                    <span>At least 1 symbol (!@#$%^&().?)</span>
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
                ← Back to Homepage
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">You have 24 hours before this link expires. After setting your password, you'll be redirected to the login page.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
