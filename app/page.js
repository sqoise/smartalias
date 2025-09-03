'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')
  const [isLoading, setIsLoading] = useState(false)

  const handleAlert = (message, type = 'info') => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    handleAlert("Checking credentials…", "info")
    
    const formData = new FormData(e.target)
    const username = formData.get('username')
    const password = formData.get('password')

    // Frontend-only logic for demo
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        handleAlert("Welcome Admin! Redirecting…", "ok")
        setTimeout(() => {
          window.location.href = '/admin'
        }, 600)
      } else if (username === 'user' && password === 'user') {
        handleAlert("Welcome User! Redirecting…", "ok")
        setTimeout(() => {
          window.location.href = '/user'
        }, 600)
      } else {
        handleAlert("Invalid username or password", "error")
      }
      setIsLoading(false)
    }, 1000)
  }

  const alertStyles = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    error: "border-red-200 bg-red-50 text-red-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Two-column layout matching login.html */}
      <main className="min-h-screen grid lg:grid-cols-[70%_30%] relative">
        {/* LEFT: Hero section with background image */}
        <section className="relative hidden lg:block z-0">
          <img 
            src="/images/admin_bg.jpg" 
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

            {/* Alert */}
            {showAlert && (
              <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${alertStyles[alertType]}`}>
                {alertMessage}
              </div>
            )}

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
              Access for registered users and administrators.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
