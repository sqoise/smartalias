'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import RegisterCard from '../../components/public/RegisterCard'
import ApiClient from '../../lib/apiClient'
import { alertToast, sanitizeInput } from '../../lib/utility'

export default function RegisterPage() {

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const router = useRouter()
  const toastRef = useRef()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Name fields
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    
    // Personal info
    birthDate: '',
    gender: '',
    civilStatus: '',
    
    // Contact info
    email: '',
    contactNumber: '',
    address: '',
    purok: '',
    
    // Additional info
    religion: '',
    occupation: '',
    specialCategory: '',
    
    // Account credentials
    username: '',
    pin: '',
    confirmPin: ''
  })
  const [errors, setErrors] = useState({}) // Boolean flags for field error states
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)

  // Unified toast helper
  const handleAlert = (message, type = 'info') => alertToast(toastRef, message, type)

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  
  // Step-based validation
  const validateCurrentStep = () => {
    const newErrors = {}
    
    if (currentStep === 1) {
      // Step 1: Name fields
      if (!sanitizeInput(formData.lastName)) newErrors.lastName = 'Last name is required'
      if (!sanitizeInput(formData.firstName)) newErrors.firstName = 'First name is required'
      if (!sanitizeInput(formData.middleName)) newErrors.middleName = 'Middle name is required'
    } else if (currentStep === 2) {
      // Step 2: Personal & Contact Info
      if (!formData.birthDate) newErrors.birthDate = 'Birth date is required'
      if (!formData.gender) newErrors.gender = 'Gender is required'
      if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required'
      if (!sanitizeInput(formData.address)) newErrors.address = 'Address is required'
      
      // Email validation (optional)
      const email = sanitizeInput(formData.email)
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address'
    } else if (currentStep === 3) {
      // Step 3: Additional Info
      if (!formData.purok) newErrors.purok = 'Purok is required'
      if (!sanitizeInput(formData.religion)) newErrors.religion = 'Religion is required'
      if (!formData.occupation) newErrors.occupation = 'Occupation is required'
      if (!formData.specialCategory) newErrors.specialCategory = 'Special category is required'
    } else if (currentStep === 4) {
      // Step 4: Account Setup
      const sanitizedUsername = sanitizeInput(formData.username)
      if (!sanitizedUsername) newErrors.username = 'Username is required'
      else if (sanitizedUsername.length < 6) newErrors.username = 'Username must be at least 6 characters'
      else if (sanitizedUsername.length > 32) newErrors.username = 'Username must be less than 32 characters'
      else if (!/^[a-z0-9_.]+$/.test(sanitizedUsername)) newErrors.username = 'Username can only contain lowercase letters, numbers, dots, and underscores'
      
      // PIN validation
      if (!formData.pin) newErrors.pin = 'PIN is required'
      else if (formData.pin.length !== 6) newErrors.pin = 'PIN must be exactly 6 digits'
      else if (!/^\d{6}$/.test(formData.pin)) newErrors.pin = 'PIN must contain only numbers'
      
      // Confirm PIN validation
      if (!formData.confirmPin) newErrors.confirmPin = 'Please confirm your PIN'
      else if (formData.pin !== formData.confirmPin) newErrors.confirmPin = 'PINs do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  // Generate step titles
  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Personal Information'
      case 2: return 'Contact & Details'
      case 3: return 'Additional Information'
      case 4: return 'Account Setup'
      default: return 'Registration'
    }
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // For PIN fields, only allow numbers and limit to 6 digits
    let processedValue = value
    if (name === 'pin' || name === 'confirmPin') {
      processedValue = value.replace(/\D/g, '').slice(0, 6)
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({}) // Clear errors when going back
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // For steps 1-3, go to next step
    if (currentStep < 4) {
      handleNext()
      return
    }
    
    // Step 4: Final validation and submission
    if (!validateCurrentStep()) {
      return // Don't show toast for validation errors, inline errors are shown
    }
    
    setIsLoading(true)
    
    try {
      // Prepare registration data
      const registrationData = {
        username: sanitizeInput(formData.username),
        firstName: sanitizeInput(formData.firstName),
        middleName: sanitizeInput(formData.middleName),
        lastName: sanitizeInput(formData.lastName),
        email: sanitizeInput(formData.email),
        contactNumber: sanitizeInput(formData.contactNumber),
        address: sanitizeInput(formData.address),
        pin: formData.pin
      }
      
      // Simulate API call for now (replace with actual API call later)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      handleAlert('Registration successful! Redirecting to login...', 'success')
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error) {
      console.error('Registration error:', error)
      handleAlert('Registration failed. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // COMPONENT RENDER
  // ============================================
  
  // Simple Navigation Header
  const NavigationHeader = () => (
    <header className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        <Link 
          href="/login"
          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200"
        >
          <span className="hidden sm:inline">← Login</span>
          <span className="sm:hidden">Login</span>
        </Link>
      </nav>
    </header>
  )

  return (
    <>
      <ToastNotification ref={toastRef} />
      <NavigationHeader />
      <PublicLayout>
        <RegisterCard
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onBack={handleBack}
          currentStep={currentStep}
          stepTitle={getStepTitle(currentStep)}
          isLoading={isLoading}
          errors={errors}
        />
      </PublicLayout>
    </>
  )
}