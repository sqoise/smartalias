import React from 'react'
import ToastNotification from '../../common/ToastNotification'
import { SUFFIX_OPTIONS, getSuffixLabel } from '../../../lib/constants'
import ApiClient from '../../../lib/apiClient'

/**
 * AddResidentsView - Admin-only resident creation form
 * This component is used by administrators to create resident accounts
 * It automatically generates temporary credentials (username.pin) that residents must change on first login
 * For resident self-registration, use the public registration form instead
 */
export default function AddResidentsView({ open, onClose, onSubmit, loading = false }) {
  const toastRef = React.useRef()
  const firstNameInputRef = React.useRef()
  const STORAGE_KEY = 'smartlias_add_resident_draft'
  
  const [formData, setFormData] = React.useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    homeNumber: '',
    mobileNumber: '',
    email: '',
    address: '',
    purok: '',
    religion: '',
    occupation: '',
    specialCategory: '',
    notes: ''
  })

  const [errors, setErrors] = React.useState({})
  const [isDraft, setIsDraft] = React.useState(false)
  const [showPreSubmitConfirm, setShowPreSubmitConfirm] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [addedResident, setAddedResident] = React.useState(null)
  const [showCredentials, setShowCredentials] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Special categories state
  const [specialCategories, setSpecialCategories] = React.useState([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false)



  // Copy credentials to clipboard with feedback
  const handleCopyCredentials = async () => {
    if (!addedResident) return
    
    try {
      const credentialsText = `Username: ${addedResident.username}\nPIN: ${addedResident.pin}`
      await navigator.clipboard.writeText(credentialsText)
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy credentials:', error)
      // Fallback toast notification
      toastRef.current?.show('Failed to copy credentials', 'error')
    }
  }

  // Load draft from localStorage when panel opens
  React.useEffect(() => {
    if (open) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY)
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft)
          setFormData(parsedDraft)
          setIsDraft(true)
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
      setErrors({})
      
      // Focus on first name input when panel opens
      setTimeout(() => {
        firstNameInputRef.current?.focus()
      }, 300) // Delay to allow panel animation to complete
    }
  }, [open])

  // Load special categories on component mount
  React.useEffect(() => {
    const loadSpecialCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await ApiClient.get('/residents/special-categories')
        
        if (response.success) {
          setSpecialCategories(response.data)
        } else {
          console.error('Failed to load special categories:', response.error)
        }
      } catch (error) {
        console.error('Error loading special categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadSpecialCategories()
  }, [])

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    if (open) {
      const hasData = Object.values(formData).some(value => value !== '' && value !== 'Regular')
      if (hasData) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        } catch (error) {
          console.error('Failed to save draft:', error)
        }
      }
    }
  }, [formData, open])

  // Create dynamic mapping from fetched categories
  const createCategoryMaps = () => {
    const codeToId = { '': null }
    const idToCode = {}
    
    specialCategories.forEach(category => {
      codeToId[category.category_code] = category.id
      idToCode[category.id] = category.category_code
    })
    
    return { codeToId, idToCode }
  }

  const { codeToId: SPECIAL_CATEGORY_MAP, idToCode: SPECIAL_CATEGORY_REVERSE_MAP } = createCategoryMaps()

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose && onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, loading])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters'
    } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, apostrophes, hyphens, and periods'
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters'
    } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, apostrophes, hyphens, and periods'
    }
    
    // Middle name validation (optional but must be valid format if provided)
    if (formData.middleName.trim()) {
      if (formData.middleName.trim().length > 50) {
        newErrors.middleName = 'Middle name must be less than 50 characters'
      } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(formData.middleName.trim())) {
        newErrors.middleName = 'Middle name can only contain letters, spaces, apostrophes, hyphens, and periods'
      }
    }

    // Birth date validation
    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required'
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const minDate = new Date('1900-01-01')
      
      if (isNaN(birthDate.getTime())) {
        newErrors.birthDate = 'Invalid birth date format'
      } else if (birthDate > today) {
        newErrors.birthDate = 'Birth date cannot be in the future'
      } else if (birthDate < minDate) {
        newErrors.birthDate = 'Birth date cannot be before 1900'
      }
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }

    // Civil status validation
    if (!formData.civilStatus) {
      newErrors.civilStatus = 'Civil status is required'
    }
    
    // Address validation (required with minimum 20 characters)
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else {
      const addressLength = formData.address.trim().length
      if (addressLength < 20) {
        newErrors.address = 'Address must be at least 20 characters long'
      } else if (addressLength > 200) {
        newErrors.address = 'Address must be less than 200 characters'
      }
    }
    
    // Purok validation (required)
    if (!formData.purok) {
      newErrors.purok = 'Purok is required'
    }
    
    // Additional Information fields are optional - no validation needed
    
    // Mobile number validation (optional, but validate format if provided)
    if (formData.mobileNumber.trim()) {
      const cleanMobileNumber = formData.mobileNumber.replace(/\s+/g, '')
      if (!/^09\d{9}$/.test(cleanMobileNumber)) {
        newErrors.mobileNumber = 'Enter valid 11-digit mobile (e.g., 09XX XXX XXXX)'
      }
    }
    
    // Home number validation (optional, but validate format if provided)
    if (formData.homeNumber.trim()) {
      const cleanHomeNumber = formData.homeNumber.replace(/\s+/g, '')
      if (!/^\d{8}$/.test(cleanHomeNumber)) {
        newErrors.homeNumber = 'Enter valid 8-digit landline (e.g., 8000 0000)'
      }
    }

    // Email validation (optional, but validate format if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Show pre-submission confirmation modal
    setShowPreSubmitConfirm(true)
  }

  const handleConfirmSubmit = async () => {
    setShowPreSubmitConfirm(false)
    
    try {
      // Transform formData before sending - convert specialCategory code to special_category_id
      const { CODE_TO_ID_MAP } = createCategoryMaps(specialCategories)
      const submitData = {
        ...formData,
        special_category_id: formData.specialCategory ? CODE_TO_ID_MAP[formData.specialCategory] : null
      }
      // Remove the old specialCategory field
      delete submitData.specialCategory
      
      // Call backend API to create resident and user
      const response = await ApiClient.createResident(submitData)
      
      if (response.success) {
        // Show success toast notification
        toastRef.current?.show('Resident added successfully!', 'success')
        
        // Clear draft from localStorage after successful submission
        try {
          localStorage.removeItem(STORAGE_KEY)
          setIsDraft(false)
        } catch (error) {
          console.error('Failed to clear draft:', error)
        }
        
        // Extract credentials from backend response
        const { resident, credentials } = response.data
        
        // Store added resident data and show success confirmation modal
        setAddedResident({
          name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}${formData.suffix ? ' ' + getSuffixLabel(parseInt(formData.suffix)) : ''}`,
          purok: formData.purok,
          username: credentials.username,
          pin: credentials.pin
        })
        setShowCredentials(false) // Don't auto-expand credentials - let user click to view
        setShowConfirmation(true)
        
        // Call onSubmit callback if provided (for parent component to refresh data)
        if (onSubmit) {
          onSubmit(resident)
        }
      } else {
        // Show error toast for validation or server errors
        const errorMessage = response.error || 'Failed to add resident. Please try again.'
        toastRef.current?.show(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error adding resident:', error)
      // Show error toast for network/unexpected errors
      toastRef.current?.show('Network error. Please check your connection and try again.', 'error')
    }
  }

  const handleCancelSubmit = () => {
    setShowPreSubmitConfirm(false)
  }

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        birthDate: '',
        gender: '',
        civilStatus: '',
        homeNumber: '',
        mobileNumber: '',
        email: '',
        address: '',
        purok: '',
        occupation: '',
        specialCategory: '',
        notes: ''
      })
      setErrors({})
      setIsDraft(false)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }

  const handleConfirmationClose = () => {
    console.log('Closing confirmation modal...') // Debug log
    setShowConfirmation(false)
    setAddedResident(null)
    setShowCredentials(false)
    setCopied(false) // Reset copy state
    // Reset form data
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      homeNumber: '',
      mobileNumber: '',
      email: '',
      address: '',
      purok: '',
      religion: '',
      occupation: '',
      specialCategory: '',
      notes: ''
    })
    setErrors({})
    // Close the main panel
    onClose()
  }

  const handleAddAnother = () => {
    setShowConfirmation(false)
    setAddedResident(null)
    setShowCredentials(false)
    setCopied(false) // Reset copy state
    // Reset form data but keep the panel open
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      homeNumber: '',
      mobileNumber: '',
      email: '',
      address: '',
      purok: '',
      religion: '',
      occupation: '',
      specialCategory: '',
      notes: ''
    })
    setErrors({})
    // Focus on first name input
    setTimeout(() => {
      firstNameInputRef.current?.focus()
    }, 100)
  }

  return (
    <>
    <div
      className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={loading ? undefined : onClose}
      >
        {/* Floating Close Button */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!loading) onClose()
          }}
          disabled={loading}
          title="Close"
        >
          <i className="bi bi-x text-3xl text-white/90" />
        </button>
      </div>
      
      {/* Slide Panel from Right */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[520px] lg:w-[650px] xl:w-[750px] bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col z-10`}
      >
        {/* Panel Header */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">Add New Resident</div>
            {isDraft && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-normal rounded-md bg-amber-100 text-amber-800">
                <i className="bi bi-pencil-square mr-1"></i>
                Draft Saved
              </span>
            )}
          </div>
          {isDraft && (
            <button
              onClick={handleClearDraft}
              disabled={loading}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Clear all form data"
            >
              <i className="bi bi-trash mr-1"></i>
              Clear Draft
            </button>
          )}
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" noValidate>
          <div className="p-4 space-y-6">
            
            {/* Personal Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <i className="bi bi-person mr-2 text-blue-600"></i>
                Personal Information
              </h3>
              <div className="space-y-3">
                {/* Row 1: Suffix, First Name, Middle Name */}
                <div className="grid grid-cols-[100px_2fr_2fr] gap-3">
                  {/* Suffix - Compact */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Suffix <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.suffix}
                        onChange={(e) => handleChange('suffix', e.target.value)}
                        className="w-full rounded-md px-2 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-6"
                        disabled={loading}
                      >
                        {SUFFIX_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <i className="bi bi-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={firstNameInputRef}
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                        errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                      placeholder="Enter first name"
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                      className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9"
                      placeholder="Enter middle name"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Row 2: Last Name - Full Width */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                      errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                  )}
                </div>

                {/* Birth Date, Gender, and Civil Status - 3 Columns */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Birth Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Birth Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleChange('birthDate', e.target.value)}
                      min="1900-01-01"
                      max={(() => {
                        const today = new Date()
                        const year = today.getFullYear()
                        const month = String(today.getMonth() + 1).padStart(2, '0')
                        const day = String(today.getDate()).padStart(2, '0')
                        return `${year}-${month}-${day}`
                      })()}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                        errors.birthDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                      disabled={loading}
                    />
                    {errors.birthDate && (
                      <p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                          errors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8`}
                        disabled={loading}
                      >
                      <option value="">Select</option>
                      <option value="1">Male</option>
                      <option value="2">Female</option>
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                    {errors.gender && (
                      <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
                    )}
                  </div>

                  {/* Civil Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Civil Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.civilStatus}
                        onChange={(e) => handleChange('civilStatus', e.target.value)}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                          errors.civilStatus ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8`}
                        disabled={loading}
                      >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                    {errors.civilStatus && (
                      <p className="text-xs text-red-600 mt-1">{errors.civilStatus}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <i className="bi bi-telephone mr-2 text-green-600"></i>
                Contact Information
              </h3>
              <div className="space-y-3">
                {/* Home Number and Mobile Number - 2 Columns */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Home Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Home Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.homeNumber}
                      onChange={(e) => handleChange('homeNumber', e.target.value)}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                        errors.homeNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                      placeholder="8000 0000"
                      disabled={loading}
                    />
                    {errors.homeNumber && (
                      <p className="text-xs text-red-600 mt-1">{errors.homeNumber}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => handleChange('mobileNumber', e.target.value)}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                        errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                      placeholder="09XX XXX XXXX"
                      disabled={loading}
                    />
                    {errors.mobileNumber && (
                      <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                    placeholder="name@example.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                      errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } focus:ring-1 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors h-9`}
                    placeholder="Enter full address"
                    disabled={loading}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Purok */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Purok <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.purok}
                      onChange={(e) => handleChange('purok', e.target.value)}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                        errors.purok ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8`}
                      disabled={loading}
                    >
                      <option value="">Select</option>
                      <option value="1">Purok 1</option>
                      <option value="2">Purok 2</option>
                      <option value="3">Purok 3</option>
                      <option value="4">Purok 4</option>
                      <option value="5">Purok 5</option>
                      <option value="6">Purok 6</option>
                      <option value="7">Purok 7</option>
                    </select>
                    <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                  </div>
                  {errors.purok && (
                    <p className="text-xs text-red-600 mt-1">{errors.purok}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <i className="bi bi-info-circle mr-2 text-purple-600"></i>
                Additional Information
              </h3>
              <div className="space-y-3">
                {/* Occupation, Religion, Special Category - 3 Columns */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Occupation */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Occupation <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        <option value="EMPLOYED">Employed</option>
                        <option value="SELF_EMPLOYED">Self Employed</option>
                        <option value="UNEMPLOYED">Unemployed</option>
                        <option value="RETIRED">Retired</option>
                        <option value="OTHERS">Others</option>
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                  </div>

                  {/* Religion */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Religion <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.religion}
                        onChange={(e) => handleChange('religion', e.target.value)}
                        className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        <option value="ROMAN_CATHOLIC">Roman Catholic</option>
                        <option value="PROTESTANT">Protestant</option>
                        <option value="IGLESIA_NI_CRISTO">Iglesia ni Cristo</option>
                        <option value="ISLAM">Islam</option>
                        <option value="OTHERS">Others</option>
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                  </div>

                  {/* Special Category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Special Category <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.specialCategory}
                        onChange={(e) => handleChange('specialCategory', e.target.value)}
                        className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
                        disabled={loading}
                      >
                        <option value="">Not Applicable</option>
                        {isLoadingCategories ? (
                          <option disabled>Loading categories...</option>
                        ) : (
                          specialCategories.map(category => (
                            <option key={category.id} value={category.category_code}>
                              {category.category_name}
                            </option>
                          ))
                        )}
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-sm placeholder:text-gray-400 bg-white transition-colors"
                    placeholder="Enter additional notes or comments"
                    rows="3"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions - Sticky Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">


            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer h-9"
            >
              {loading ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin mr-1.5"></i>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-lg mr-1.5"></i>
                  Add Resident
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pre-Submit Confirmation Modal */}
      {showPreSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full">
            <div className="text-center">
              {/* Icon - Question or Check */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 transition-colors duration-300">
                {loading ? (
                  <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center">
                    <i className="bi bi-check-lg text-green-600 text-xl"></i>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center">
                    <i className="bi bi-question-lg text-gray-600 text-xl"></i>
                  </div>
                )}
              </div>
              
              {/* Title */}
              <div className="mb-4">
                {loading ? (
                  <h3 className="text-lg font-medium text-gray-900">
                    Adding Resident...
                  </h3>
                ) : (
                  <div>
                    <h3 className="text-base font-normal text-gray-700 mb-2">
                      Are you sure you want to add
                    </h3>
                    <p className="text-xl font-semibold text-gray-900">
                      {formData.firstName} {formData.middleName && `${formData.middleName.charAt(0)}.`} {formData.lastName}{formData.suffix ? ` ${getSuffixLabel(parseInt(formData.suffix))}` : ''}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Resident Details */}
              <div className="text-sm text-gray-600 mb-6">
                {!loading && (
                  <p className="text-xs text-gray-500">
                    This will create a resident record and user account.
                  </p>
                )}
                {loading && (
                  <div className="flex items-center justify-center">
                    <i className="bi bi-arrow-clockwise animate-spin text-sm mr-2"></i>
                    <span className="text-sm text-gray-600">Please wait while we save the information...</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {!loading && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleCancelSubmit}
                    className="w-26 h-10 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    className="w-28 h-10 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>

    {/* Confirmation Modal - Outside main container to avoid z-index conflicts */}
    {showConfirmation && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center"
        style={{ zIndex: 999999 }}
        onClick={(e) => {
          console.log('Modal overlay clicked', e.target, e.currentTarget)
          // Close modal if clicking outside
          if (e.target === e.currentTarget) {
            console.log('Background clicked - closing modal')
            handleConfirmationClose()
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex justify-end mb-2">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                console.log('Header close button clicked')
                handleConfirmationClose()
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200"
            >
              <i className="bi bi-x text-2xl"></i>
            </button>
          </div>
          
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-11 w-11 rounded-full bg-green-100 mb-4">
              <i className="bi bi-check-lg text-green-600 text-2xl"></i>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resident has been added!
            </h3>
            
            {/* Expandable Credentials Section */}
            {addedResident && (
              <div className="mb-6 flex justify-center">
                <div className="w-[100%]">
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="w-full p-2 bg-gray-100 border-dashed border border-gray-300 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-800">Temporary Credentials</h4>
                      <i className={`bi bi-chevron-${showCredentials ? 'up' : 'down'} text-gray-600 transition-transform duration-200 text-sm`}></i>
                    </div>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showCredentials ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-2 py-1.5 bg-gray-100 border-l border-r border-b border-gray-300 border-dashed">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-700 space-y-1 text-left">
                          <div className="text-xs"><span className="font-medium">Username:</span> {addedResident.username}</div>
                          <div className="text-xs"><span className="font-medium">PIN:</span> {addedResident.pin}</div>
                        </div>
                        <button
                          onClick={handleCopyCredentials}
                          className={`ml-2 p-1 rounded-md transition-colors cursor-pointer ${
                            copied 
                              ? 'text-gray-600' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                          title={copied ? "Copied!" : "Copy credentials to clipboard"}
                        >
                          {copied ? (
                            <span className="text-xs font-medium">Copied!</span>
                          ) : (
                            <i className="bi bi-copy text-xs"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            

          </div>
        </div>
      </div>
    )}
    </>
  )
}
