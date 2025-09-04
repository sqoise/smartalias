'use client'

import { useState, useRef } from 'react'
import ToastNotification from '../components/ToastNotification'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const toastRef = useRef(null)

  const handleAlert = (message, type = 'info') => {
    if (toastRef.current && toastRef.current.show) {
      toastRef.current.show(message, type)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.target)
    const username = formData.get('username')
    const password = formData.get('password')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        handleAlert(data.error || 'Login failed', 'error')
        setIsLoading(false)
        return
      }

      // Store token in localStorage for future requests
      localStorage.setItem('authToken', data.token)

      // Handle different response scenarios
      if (!data.user.passwordChanged) {
        handleAlert('Password change required. Redirecting…', 'info')
        setTimeout(() => {
          window.location.href = data.redirectTo
        }, 10)
      } else {
        handleAlert(`Welcome ${data.user.firstName}! Redirecting…`, 'success')
        setTimeout(() => {
          window.location.href = data.redirectTo
        }, 10)
      }

    } catch (error) {
      handleAlert('Network error. Please try again.', 'error')
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
              Login to SMART LIAS Portal.
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
              <div className="inline-flex items-center gap-2">
                <i className="bi bi-shield-lock text-green-600 text-2xl"></i>
                <h2 className="text-2xl font-bold text-green-700">Account Login</h2>
              </div>
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
                  required
                  className="w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600 px-3 py-2 border"
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  required 
                  minLength="4"
                  className="w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600 px-3 py-2 border"
                  placeholder="•••••"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 font-semibold flex items-center justify-center gap-2 cursor-pointer ${isLoading ? 'opacity-60' : ''}`}
              >
                <i className="bi bi-box-arrow-in-right"></i>
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
        </section>
      </main>
    </div>
  )
}
