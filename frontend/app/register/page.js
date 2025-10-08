'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import RegisterCard from '../../components/public/RegisterCard'
import ChatbotButton from '../../components/common/ChatbotButton'
import PageLoading from '../../components/common/PageLoading'
import ApiClient from '../../lib/apiClient'
import { alertToast, sanitizeInput } from '../../lib/utility'
import { USER_ROLES } from '../../lib/constants'

export default function RegisterPage() {

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const router = useRouter()
  const toastRef = useRef()
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
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
    homeNumber: '',
    mobileNumber: '',
    address: '',
    purok: '',
    
    // Additional info
    religion: '',
    occupation: '',
    specialCategory: '',
    notes: '',
    
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
  // CHECK IF ALREADY AUTHENTICATED
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await ApiClient.getSession()
        
        if (session.success && session.data) {
          const user = session.data
          // User is already authenticated, redirect to their dashboard
          if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF) {
            router.push('/admin')
          } else if (user.role === USER_ROLES.RESIDENT) {
            router.push('/resident')
          }
          return
        }
      } catch (error) {
        // Not authenticated, stay on register page
        console.log('Not authenticated, showing register page')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  
  // Step-based validation
  const validateCurrentStep = () => {
    const newErrors = {}
    
    if (currentStep === 1) {
      // Step 1: Name fields
      const lastName = sanitizeInput(formData.lastName)
      const firstName = sanitizeInput(formData.firstName) 
      const middleName = sanitizeInput(formData.middleName)
      
      // Last Name validation
      if (!lastName) {
        newErrors.lastName = 'Last name is required'
      } else if (lastName.length > 32) {
        newErrors.lastName = 'Last name must be 32 characters or less'
      } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        newErrors.lastName = 'Last name can only contain letters and spaces'
      }
      
      // First Name validation
      if (!firstName) {
        newErrors.firstName = 'First name is required'
      } else if (firstName.length > 32) {
        newErrors.firstName = 'First name must be 32 characters or less'
      } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        newErrors.firstName = 'First name can only contain letters and spaces'
      }
      
      // Middle Name validation (optional but must be valid format if provided)
      if (middleName && !/^[a-zA-Z\s]+$/.test(middleName)) {
        newErrors.middleName = 'Middle name can only contain letters and spaces'
      }
      
      // Suffix validation (optional but must be valid if provided)
      const validSuffixes = ['', '1', '2', '3', '4', '5', '6']
      if (formData.suffix && !validSuffixes.includes(formData.suffix)) {
        newErrors.suffix = 'Invalid suffix selection'
      }
    } else if (currentStep === 2) {
      // Step 2: Personal & Contact Info
      if (!formData.birthDate) newErrors.birthDate = 'Birth date is required'
      
      // Gender validation - must be one of the allowed values
      const validGenders = ['1', '2']
      if (!formData.gender) {
        newErrors.gender = 'Gender is required'
      } else if (!validGenders.includes(formData.gender)) {
        newErrors.gender = 'Invalid gender selection'
      }
      
      // Civil Status validation - must be one of the allowed values
      const validCivilStatuses = ['Single', 'Married', 'Widowed', 'Separated']
      if (!formData.civilStatus) {
        newErrors.civilStatus = 'Civil status is required'
      } else if (!validCivilStatuses.includes(formData.civilStatus)) {
        newErrors.civilStatus = 'Invalid civil status selection'
      }
      
      // Address validation - required with minimum 20 characters
      const address = sanitizeInput(formData.address)
      if (!address) {
        newErrors.address = 'Address is required'
      } else if (address.length < 20) {
        newErrors.address = 'Address must be at least 20 characters long'
      }
      
      // Mobile number validation (optional but must be valid if provided)
      const mobileNumber = sanitizeInput(formData.mobileNumber)
      if (mobileNumber) {
        const cleanMobile = mobileNumber.replace(/\s+/g, '')
        if (!/^09\d{9}$/.test(cleanMobile)) {
          newErrors.mobileNumber = 'Enter valid 11-digit mobile (e.g., 09XX XXX XXXX)'
        }
      }
      
      // Home number validation (optional but must be valid if provided)
      const homeNumber = sanitizeInput(formData.homeNumber)
      if (homeNumber) {
        const cleanHome = homeNumber.replace(/\s+/g, '')
        if (!/^\d{8}$/.test(cleanHome)) {
          newErrors.homeNumber = 'Enter valid 8-digit landline (e.g., 8000 0000)'
        }
      }
      
      // Email validation (optional but must be valid if provided)
      const email = sanitizeInput(formData.email)
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    } else if (currentStep === 3) {
      // Step 3: Additional Info
      
      // Purok validation - must be one of the allowed values
      const validPuroks = ['1', '2', '3', '4', '5', '6', '7']
      if (!formData.purok) {
        newErrors.purok = 'Purok is required'
      } else if (!validPuroks.includes(formData.purok)) {
        newErrors.purok = 'Invalid purok selection'
      }
      
      // Religion validation - must be one of the allowed values
      const validReligions = ['ROMAN_CATHOLIC', 'PROTESTANT', 'IGLESIA_NI_CRISTO', 'ISLAM', 'BUDDHIST', 'OTHERS']
      if (!formData.religion) {
        newErrors.religion = 'Religion is required'
      } else if (!validReligions.includes(formData.religion)) {
        newErrors.religion = 'Invalid religion selection'
      }
      
      // Occupation validation - must be one of the allowed values
      const validOccupations = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHERS']
      if (!formData.occupation) {
        newErrors.occupation = 'Occupation is required'
      } else if (!validOccupations.includes(formData.occupation)) {
        newErrors.occupation = 'Invalid occupation selection'
      }
      
      // Special Category validation (optional but must be valid if provided)
      const validSpecialCategories = ['', 'PWD', 'SOLO_PARENT', 'INDIGENT', 'STUDENT']
      if (formData.specialCategory && !validSpecialCategories.includes(formData.specialCategory)) {
        newErrors.specialCategory = 'Invalid special category selection'
      }
    } else if (currentStep === 4) {
      // Step 4: Account Setup
      const sanitizedUsername = sanitizeInput(formData.username)
      if (!sanitizedUsername) {
        newErrors.username = 'Username is required'
      } else if (sanitizedUsername.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      } else if (sanitizedUsername.length > 32) {
        newErrors.username = 'Username must be 32 characters or less'
      } else if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(sanitizedUsername)) {
        newErrors.username = 'Username must be in format: name.name (e.g., firstname.lastname, word123.word)'
      }
      
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
  
  // Check username availability
  const checkUsernameAvailability = async (username) => {
    // Clear previous username error
    setErrors(prev => ({ ...prev, username: '' }))
    
    // Skip check if username is empty or invalid format
    const sanitizedUsername = sanitizeInput(username)
    if (!sanitizedUsername || sanitizedUsername.length < 3 || !/^[a-z0-9]+\.[a-z0-9]+$/.test(sanitizedUsername)) {
      return
    }
    
    setIsCheckingUsername(true)
    
    try {
      // Check if username exists
      const response = await ApiClient.checkUser(sanitizedUsername)
      
      // If success is true, username exists (user found)
      if (response.success) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken' }))
      } else if (response.status === 404) {
        // 404 means username not found (available) - this is good!
        setErrors(prev => ({ ...prev, username: '' }))
      } else {
        // Other errors - don't show to user, just log
        console.error('Username check error:', response.error)
      }
    } catch (error) {
      // Network or unexpected errors - don't show to user, just log
      console.error('Username check error:', error)
    } finally {
      setIsCheckingUsername(false)
    }
  }
  
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
      // Double-check username availability before submitting
      const sanitizedUsername = sanitizeInput(formData.username)
      const checkResponse = await ApiClient.checkUser(sanitizedUsername)
      
      // If checkUser returns success: true, username exists
      if (checkResponse.success) {
        setErrors({ username: 'This username is already taken' })
        setIsLoading(false)
        handleAlert('Username is already taken. Please choose a different username.', 'error')
        return
      }
      // If status is not 404, some other error occurred
      if (checkResponse.status && checkResponse.status !== 404) {
        console.error('Username check error during submission:', checkResponse.error)
        // Continue anyway, let the backend handle it
      }
      
      // Prepare registration data with all required fields
      const registrationData = {
        // Credentials
        username: sanitizedUsername,
        pin: formData.pin,
        
        // Personal Information (Step 1)
        firstName: sanitizeInput(formData.firstName),
        middleName: sanitizeInput(formData.middleName),
        lastName: sanitizeInput(formData.lastName),
        suffix: formData.suffix ? parseInt(formData.suffix, 10) : null,
        
        // Personal Details (Step 2)
        birthDate: formData.birthDate,
        gender: formData.gender ? parseInt(formData.gender, 10) : null,
        civilStatus: formData.civilStatus,
        
        // Contact Information (Step 2)
        homeNumber: sanitizeInput(formData.homeNumber),
        mobileNumber: sanitizeInput(formData.mobileNumber),
        email: sanitizeInput(formData.email),
        address: sanitizeInput(formData.address),
        purok: formData.purok ? parseInt(formData.purok, 10) : null,
        
        // Additional Information (Step 3)
        religion: formData.religion,
        occupation: formData.occupation,
        specialCategory: formData.specialCategory || null,
        notes: sanitizeInput(formData.notes)
      }
      
      // Call backend API
      const response = await ApiClient.register(registrationData)
      
      // Success - show message and redirect to login
      handleAlert(response.message || 'Registration successful! Redirecting to login...', 'success')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle specific error messages from backend
      const errorMessage = error.message || 'Registration failed. Please try again.'
      handleAlert(errorMessage, 'error')
      
      // If username already exists, scroll back to credentials step
      if (errorMessage.includes('Username already exists')) {
        setCurrentStep(4)
        setErrors({ username: 'This username is already taken' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // COMPONENT RENDER
  // ============================================
  
  // Simple Navigation Header
  const NavigationHeader = () => (
    <header className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 lg:p-6">
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
      {isCheckingAuth ? (
        <PageLoading />
      ) : (
        <>
          <NavigationHeader />
          <PublicLayout showChatbot={false}>
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
              onUsernameBlur={checkUsernameAvailability}
              isCheckingUsername={isCheckingUsername}
            />
          </PublicLayout>
          <ChatbotButton />
        </>
      )}
    </>
  )
}
