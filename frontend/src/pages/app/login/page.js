'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ToastNotification from '../../components/ToastNotification'
import { auth } from '../../lib/frontend-auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const toastRef = useRef()

  const handleAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const sanitizeInput = (input) => {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .slice(0, 100) // Limit length
  }

  const validateForm = () => {
    const newErrors = {}

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(formData.username)
    const sanitizedPassword = sanitizeInput(formData.password)

    // Username validation
    if (!sanitizedUsername) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores'
    }

    // Password validation
    if (!sanitizedPassword) {
      newErrors.password = 'Password is required'
    } else if (sanitizedPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    // Sanitize data
    const sanitizedData = {
      username: sanitizeInput(formData.username),
      password: sanitizeInput(formData.password)
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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <ToastNotification ref={toastRef} />
      
      {/* Two-column layout matching login.html */}
      <main className="min-h-screen grid lg:grid-cols-[70%_30%] relative">
        {/* LEFT: Hero section with background image */}
        <section className="relative hidden lg:block z-0">
          <img 
            src="/images/bg.jpg" 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Background"
          />
          <div className="absolute inset-0 bg-green-900/40"></div>

          <div className="relative h-full flex flex-col justify-end p-10 text-white">
            <img 
              src="/images/barangay_logo.jpg" 
              alt="Barangay Logo" 
              className="w-20 h-20 rounded-full mb-4"
            />
            <h1 className="text-4xl font-extrabold">Barangay LIAS</h1>
            <p className="mt-6 max-w-xl text-white/90">
              Access your account to our Barangay SMART LIAS Portal.
            </p>
            <p className="mt-10 text-sm text-white/70">
              &copy; {new Date().getFullYear()} Smart LIAS
            </p>
          </div>
        </section>

        {/* RIGHT: Login card (overlaps the image) */}
        <section className="flex items-center justify-center p-6 lg:p-12 relative overflow-visible">
          {/* Overlapping card - pull left on large screens */}
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 relative z-10 lg:-ml-80" style={{boxShadow: '0 16px 40px rgba(0,0,0,.12)'}}>
            <div className="mb-6 text-center">
              <img 
                src="/images/barangay_logo.jpg" 
                alt="Barangay Logo" 
                className="w-16 h-16 rounded-full mx-auto mb-4 lg:hidden"
              />
              <div className="inline-flex items-center gap-2">
                <h2 className="text-2xl font-bold text-green-700">Sign in to Smart LIAS</h2>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="mb-6 text-center lg:hidden">
              <p className="text-gray-600 text-sm">Welcome to Barangay LIAS Portal</p>
            </div>

            {/* Demo Credentials */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>User:</strong> juan.delacruz / 031590 (needs password change)</div>
                <div><strong>User:</strong> maria.santos / 120885 (needs password change)</div>
                <div><strong>Admin:</strong> admin.staff / 010180 (password already changed)</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input 
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full rounded-md px-3 py-2 border ${
                    errors.username 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-green-600 focus:ring-green-600'
                  }`}
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input 
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full rounded-md px-3 py-2 border ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-green-600 focus:ring-green-600'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 font-semibold flex items-center justify-center gap-2 cursor-pointer ${isLoading ? 'opacity-60' : ''}`}
              >
                <i className="bi bi-fingerprint"></i>
                <span>Sign In</span>
                {isLoading && (
                  <div className="animate-spin border-2 border-white/60 border-t-transparent rounded-full w-4 h-4"></div>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              Access for registered residents and administrators.
            </p>
          </div>
          
          {/* Copyright for mobile/tablet */}
          <div className="absolute bottom-6 left-0 right-0 text-center lg:hidden">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Smart LIAS
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
