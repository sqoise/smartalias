'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import RegisterCard from '../../components/public/RegisterCard'
import ChatbotButton from '../../components/common/ChatbotButton'
import PageLoadingV2 from '../../components/common/PageLoadingV2'
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false)
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
    
    // Account credentials
    username: '',
    pin: '',
    confirmPin: ''
  })
  const [errors, setErrors] = useState({}) // Boolean flags for field error states
  
  // Special categories state
  const [specialCategories, setSpecialCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)

  // Unified toast helper
  const handleAlert = (message, type = 'info') => alertToast(toastRef, message, type)

  // Create mapping between category codes and IDs
  const createCategoryMaps = (categories) => {
    const CODE_TO_ID_MAP = {}
    const ID_TO_CODE_MAP = {}
    
    categories.forEach(category => {
      CODE_TO_ID_MAP[category.category_code] = category.id
      ID_TO_CODE_MAP[category.id] = category.category_code
    })
    
    return { CODE_TO_ID_MAP, ID_TO_CODE_MAP }
  }

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
      } finally {
        setIsCheckingAuth(false)
        // Always show privacy modal on every visit to /register
        setShowPrivacyModal(true)
      }
    }

    checkAuth()
  }, [router])

  // ============================================
  // LOAD SPECIAL CATEGORIES
  // ============================================
  useEffect(() => {
    const loadSpecialCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await ApiClient.getPublicSpecialCategories()
        if (response.success) {
          setSpecialCategories(response.data)
        } else {
          handleAlert('Failed to load special categories', 'error')
        }
      } catch (error) {
        handleAlert('Failed to load special categories', 'error')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadSpecialCategories()
  }, [])

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
      if (formData.specialCategory && specialCategories.length > 0) {
        const validCategoryCodes = specialCategories.map(cat => cat.category_code)
        if (!validCategoryCodes.includes(formData.specialCategory)) {
          newErrors.specialCategory = 'Invalid special category selection'
        }
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
      }
    } catch (error) {
      // Network or unexpected errors - don't show to user, just log
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
        specialCategory: formData.specialCategory ? 
          (() => {
            const { CODE_TO_ID_MAP } = createCategoryMaps(specialCategories)
            return CODE_TO_ID_MAP[formData.specialCategory] || null
          })() : null
        // Note: notes field is only for admin use, not public registration
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
      
      {/* Show loading overlay during auth check */}
      {isCheckingAuth && <PageLoadingV2 isLoading={true} />}
      
      {/* Registration page content (always render, but darken when modal is showing) */}
      <div className={showPrivacyModal ? 'brightness-[0.3]' : ''}>
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
            specialCategories={specialCategories}
            isLoadingCategories={isLoadingCategories}
          />
        </PublicLayout>
        <ChatbotButton />
      </div>

      {/* Data Privacy Acknowledgement Modal */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={(e) => {
            // Prevent closing modal by clicking outside
            e.stopPropagation()
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <i className="bi bi-shield-check text-lg text-gray-600"></i>
                <h2 className="text-lg font-semibold text-gray-900">Data Privacy Notice</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="text-sm text-gray-700 space-y-4">
                <p>
                  I understand and concur that by clicking the SUBMIT button below, I am agreeing to the Privacy Notice and give my full consent to Barangay Lias and its affiliates as well as its partners and service providers, if any, to collect, store, access and/or process any personal data I may provide herein, such as but not limited to my name, address, telephone number and e-mail address for the period allowed under the applicable law and regulations for the purpose of processing my online application or request.
                </p>
                
                <p>
                  I acknowledge that the collection and processing of my personal data is necessary for such purpose. I also express my consent for the verification and validation of the information I have submitted related to my online application or request. I am aware of my right to be informed, to access, to object, to erasure or blocking, to damages, to file a complaint, to rectify and to data portability, and I understand that there are procedures, conditions and exceptions to be complied with in order to exercise or invoke such rights.
                </p>

                <p>
                  I hereby agree that all Personal Data (as defined under the Data Privacy Law of 2012 and its implementing rules and regulations), customer data and account or transaction information or records (collectively, the "information") which may be with Barangay Lias from time to time relating to us may be processed, profiled or shared to requesting parties or for the purpose of any court, legal process, examination, inquiry, audit or investigation of any Authority. The aforesaid terms shall apply notwithstanding any applicable non-disclosure agreement. We acknowledge that such information may be processed or profiled by or shared with jurisdictions which do not have strict data protection or data privacy laws.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPrivacyModal(false)
                  router.push('/')
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                I Do Not Agree
              </button>
              <button
                onClick={() => {
                  setHasAcceptedPrivacy(true)
                  setShowPrivacyModal(false)
                  // Privacy acceptance required on every visit
                }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
