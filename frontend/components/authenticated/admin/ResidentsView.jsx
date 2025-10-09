import React from 'react'
import Modal from '../../common/Modal'
import ToastNotification from '../../common/ToastNotification'
import ApiClient from '../../../lib/apiClient'
import { SUFFIX_OPTIONS, getSuffixLabel } from '../../../lib/constants'
import { mapGenderToFrontend } from '../../../lib/valueMappers'

export default function ResidentsView({ open, onClose, children, onStatusUpdate, onEditComplete }) {
  // Toast reference
  const toastRef = React.useRef()

  // Current user state for role checking
  const [currentUser, setCurrentUser] = React.useState(null)

  // Status management (existing)
  const [currentStatus, setCurrentStatus] = React.useState(children?.is_active || 0)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Edit state management (Task 2.1)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({})
  const [editErrors, setEditErrors] = React.useState({})
  const [isUpdatingResident, setIsUpdatingResident] = React.useState(false)

  // Submit confirmation state management
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false)

  // Delete confirmation state management
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Special categories state
  const [specialCategories, setSpecialCategories] = React.useState([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false)

  // Deactivate/Activate confirmation state management
  const [showActivationConfirm, setShowActivationConfirm] = React.useState(false)
  const [pendingActivationStatus, setPendingActivationStatus] = React.useState(null)

  // Reset PIN state management
  const [showResetPinConfirm, setShowResetPinConfirm] = React.useState(false)
  const [showNewCredentials, setShowNewCredentials] = React.useState(false)
  const [newCredentials, setNewCredentials] = React.useState(null)
  const [isResettingPin, setIsResettingPin] = React.useState(false)
  const [showCredentials, setShowCredentials] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Update local status when children changes
  React.useEffect(() => {
    if (children?.is_active !== undefined) {
      setCurrentStatus(children.is_active)
    }
  }, [children?.is_active])

  // Load special categories on component mount
  React.useEffect(() => {
    const loadSpecialCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await ApiClient.get('/residents/special-categories')
        
        if (response.success) {
          setSpecialCategories(response.data)
        } else {
          // Don't show toast for this as it's not critical for viewing
        }
      } catch (error) {
        // Don't show toast for this as it's not critical for viewing
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadSpecialCategories()
  }, [])

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (isUpdating || !children?.id) return
    
    setIsUpdating(true)
    try {
      // Update local state immediately for responsive UI
      setCurrentStatus(newStatus)
      
      // Call parent component's update function if provided
      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        const response = await onStatusUpdate(children.id, newStatus)
        
        // Show success toast
        if (response && response.success) {
          const statusLabel = newStatus === 1 ? 'activated' : 'deactivated'
          toastRef.current?.show(
            `Resident ${statusLabel} successfully`,
            'success'
          )
          
          // Close panel after short delay to allow user to see the success message
          setTimeout(() => {
            onClose?.()
          }, 1000)
        }
      }
    } catch (error) {
      // Revert on error
      setCurrentStatus(children.is_active || 0)
      
      // Show error toast
      toastRef.current?.show(
        error.message || 'Failed to update resident status',
        'error'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Get status info for display
  const getStatusInfo = (status) => {
    switch(status) {
      case 1: return { label: 'Active', color: 'bg-green-100 text-green-800', icon: 'bi-check-circle' }
      case 0: return { label: 'Inactive', color: 'bg-red-100 text-red-800', icon: 'bi-x-circle' }
      case 2: return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: 'bi-clock' }
      case 3: return { label: 'Archived', color: 'bg-gray-100 text-gray-600', icon: 'bi-archive' }
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-500', icon: 'bi-question-circle' }
    }
  }

  // Get special category info for display
  // Dynamic special category mapping based on fetched data
  const createCategoryMaps = () => {
    const codeToId = { '': null }
    const idToCode = {}
    
    if (specialCategories && specialCategories.length > 0) {
      specialCategories.forEach(category => {
        codeToId[category.category_code] = category.id
        idToCode[category.id] = category.category_code
      })
    }
    
    return { codeToId, idToCode }
  }

  const { codeToId: SPECIAL_CATEGORY_MAP, idToCode: SPECIAL_CATEGORY_REVERSE_MAP } = createCategoryMaps()

  const getSpecialCategoryInfo = (categoryName) => {
    if (!categoryName || categoryName === 'Regular') {
      return null
    }
    
    switch(categoryName.toUpperCase()) {
      case 'PWD':
        return { 
          label: 'PWD', 
          icon: 'bi-person-wheelchair'
        }
      case 'SOLO PARENT':
      case 'SOLO_PARENT':
        return { 
          label: 'Solo Parent', 
          icon: 'bi-person-heart'
        }
      case 'INDIGENT':
        return { 
          label: 'Indigent', 
          icon: 'bi-house'
        }
      default:
        return { 
          label: categoryName, 
          icon: 'bi-star'
        }
    }
  }

  const statusInfo = getStatusInfo(currentStatus)
  const specialCategoryInfo = getSpecialCategoryInfo(children?.special_category_name || children?.specialCategoryDisplay)

  // Initialize edit form data when entering edit mode
  React.useEffect(() => {
    if (isEditing && children) {
      
      // More robust gender handling
      let genderValue = ''
      if (children.gender !== undefined && children.gender !== null) {
        genderValue = String(children.gender)
      }
      
      setEditFormData({
        first_name: children.first_name || '',
        last_name: children.last_name || '',
        middle_name: children.middle_name || '',
        suffix: children.suffix ? String(children.suffix) : '',
        birth_date: children.birth_date || '',
        gender: genderValue,
        civil_status: children.civil_status || '',
        home_number: children.home_number || '',
        mobile_number: children.mobile_number || '',
        email: children.email || '',
        address: children.address || '',
        purok: children.purok !== undefined && children.purok !== null ? String(children.purok) : '',
        occupation: children.occupation || '',
        religion: children.religion || '',
        special_category_id: children.special_category_id ? String(children.special_category_id) : '',
        notes: children.notes || ''
      })
      
      setEditErrors({})
    }
  }, [isEditing, children])

  // Enter edit mode
  const handleEditStart = () => {
    setIsEditing(true)
  }

  // Cancel edit mode
  const handleEditCancel = () => {
    setIsEditing(false)
    setEditFormData({})
    setEditErrors({})
  }

  // Handle form field changes
  const handleFieldChange = (fieldName, value) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear field error when user starts typing
    if (editErrors[fieldName]) {
      setEditErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }))
    }
  }

  // Handle Reset PIN button click
  const handleResetPinClick = () => {
    setShowResetPinConfirm(true)
  }

  // Handle Reset PIN confirmation
  const handleResetPinConfirm = async () => {
    if (!children?.id) return
    
    // Check if resident has user account
    if (!children?.user_id) {
      alert('This resident does not have a user account. Cannot reset PIN.')
      setShowResetPinConfirm(false)
      return
    }
    
    setIsResettingPin(true)
    try {
      // Call backend API to reset PIN
      const response = await ApiClient.resetResidentPin(children.id)
      
      if (response.success && response.data) {
        // Store new credentials
        setNewCredentials({
          username: response.data.username,
          pin: response.data.pin
        })
        
        // Close confirmation modal and show credentials modal
        setShowResetPinConfirm(false)
        setShowNewCredentials(true)
      } else {
        alert('Failed to reset PIN: ' + (response.error || 'Unknown error'))
        setShowResetPinConfirm(false)
      }
    } catch (error) {
      alert('Failed to reset PIN. Please try again.')
      setShowResetPinConfirm(false)
    } finally {
      setIsResettingPin(false)
    }
  }

  // Handle copying credentials to clipboard
  const handleCopyCredentials = async () => {
    if (!newCredentials) return
    
    try {
      const credentialsText = `Username: ${newCredentials.username}\nPIN: ${newCredentials.pin}`
      await navigator.clipboard.writeText(credentialsText)
      
      // Show copied feedback
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      alert('Failed to copy credentials')
    }
  }

  // Handle submit button click (show confirmation)
  const handleSubmitClick = () => {
    // Check if there are any changes
    if (!hasFormChanges()) {
      toastRef.current?.show('No changes detected', 'info')
      return
    }

    // Validate form before submission
    if (!validateEditForm()) {
      toastRef.current?.show('Please fix the validation errors', 'error')
      return
    }

    // Show confirmation modal
    setShowSubmitConfirm(true)
  }

  // Validate edit form (matches AddResidentsView validation)
  const validateEditForm = () => {
    const newErrors = {}

    // First name validation
    if (!editFormData.first_name?.trim()) {
      newErrors.first_name = 'First name is required'
    } else if (editFormData.first_name.trim().length > 50) {
      newErrors.first_name = 'First name must be less than 50 characters'
    } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(editFormData.first_name.trim())) {
      newErrors.first_name = 'First name can only contain letters, spaces, apostrophes, hyphens, and periods'
    }
    
    // Last name validation
    if (!editFormData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required'
    } else if (editFormData.last_name.trim().length > 50) {
      newErrors.last_name = 'Last name must be less than 50 characters'
    } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(editFormData.last_name.trim())) {
      newErrors.last_name = 'Last name can only contain letters, spaces, apostrophes, hyphens, and periods'
    }
    
    // Middle name validation (optional but must be valid format if provided)
    if (editFormData.middle_name?.trim()) {
      if (editFormData.middle_name.trim().length > 50) {
        newErrors.middle_name = 'Middle name must be less than 50 characters'
      } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ'\-\s\.]+$/.test(editFormData.middle_name.trim())) {
        newErrors.middle_name = 'Middle name can only contain letters, spaces, apostrophes, hyphens, and periods'
      }
    }

    // Birth date validation
    if (!editFormData.birth_date) {
      newErrors.birth_date = 'Birth date is required'
    } else {
      const birthDate = new Date(editFormData.birth_date)
      const today = new Date()
      const minDate = new Date('1900-01-01')
      
      if (isNaN(birthDate.getTime())) {
        newErrors.birth_date = 'Invalid birth date format'
      } else if (birthDate > today) {
        newErrors.birth_date = 'Birth date cannot be in the future'
      } else if (birthDate < minDate) {
        newErrors.birth_date = 'Birth date cannot be before 1900'
      }
    }

    // Gender validation
    if (!editFormData.gender) {
      newErrors.gender = 'Gender is required'
    }

    // Civil status validation
    if (!editFormData.civil_status) {
      newErrors.civil_status = 'Civil status is required'
    }
    
    // Address validation (required with minimum 20 characters)
    if (!editFormData.address?.trim()) {
      newErrors.address = 'Address is required'
    } else {
      const addressLength = editFormData.address.trim().length
      if (addressLength < 20) {
        newErrors.address = 'Address must be at least 20 characters long'
      } else if (addressLength > 200) {
        newErrors.address = 'Address must be less than 200 characters'
      }
    }
    
    // Purok validation (required)
    if (!editFormData.purok) {
      newErrors.purok = 'Purok is required'
    }
    
    // Mobile number validation (optional, but validate format if provided)
    if (editFormData.mobile_number?.trim()) {
      const cleanMobileNumber = editFormData.mobile_number.replace(/\s+/g, '')
      if (!/^09\d{9}$/.test(cleanMobileNumber)) {
        newErrors.mobile_number = 'Enter valid 11-digit mobile (e.g., 09XX XXX XXXX)'
      }
    }
    
    // Home number validation (optional, but validate format if provided)
    if (editFormData.home_number?.trim()) {
      const cleanHomeNumber = editFormData.home_number.replace(/\s+/g, '')
      if (!/^\d{8}$/.test(cleanHomeNumber)) {
        newErrors.home_number = 'Enter valid 8-digit landline (e.g., 8000 0000)'
      }
    }

    // Email validation (optional, but validate format if provided)
    if (editFormData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editFormData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form has changes
  const hasFormChanges = () => {
    if (!children || !editFormData) return false
    
    const fieldsToCheck = [
      'first_name', 'middle_name', 'last_name', 'suffix', 'gender', 'birth_date',
      'civil_status', 'email', 'home_number', 'mobile_number', 'address', 'purok', 
      'occupation', 'religion', 'special_category_id', 'notes'
    ]
    
    return fieldsToCheck.some(field => {
      // Normalize values for comparison (convert to string and handle null/undefined)
      const originalValue = children[field] !== undefined && children[field] !== null ? String(children[field]) : ''
      const currentValue = editFormData[field] !== undefined && editFormData[field] !== null ? String(editFormData[field]) : ''
      return originalValue !== currentValue
    })
  }

  // Save edited resident information
  const handleEditSave = async () => {
    if (!children?.id || !editFormData) return
    
    setIsUpdatingResident(true)
    setEditErrors({})
    setShowSubmitConfirm(false)
    
    try {
      // Prepare update data - send ALL fields (backend validates all fields)
      const updateData = {
        first_name: editFormData.first_name || '',
        middle_name: editFormData.middle_name || '',
        last_name: editFormData.last_name || '',
        suffix: editFormData.suffix || '',
        gender: editFormData.gender !== undefined && editFormData.gender !== null && editFormData.gender !== '' ? editFormData.gender : '',
        birth_date: editFormData.birth_date || '',
        civil_status: editFormData.civil_status || '',
        home_number: editFormData.home_number || '',
        mobile_number: editFormData.mobile_number || '',
        email: editFormData.email || '',
        address: editFormData.address || '',
        purok: editFormData.purok !== undefined && editFormData.purok !== null && editFormData.purok !== '' ? editFormData.purok : '',
        occupation: editFormData.occupation || '',
        religion: editFormData.religion || '',
        special_category_id: editFormData.special_category_id ? parseInt(editFormData.special_category_id) : null,
        notes: editFormData.notes || ''
      }
      
      // Call API to update resident
      const response = await ApiClient.updateResident(children.id, updateData)
      
      if (response.success) {
        // Update was successful
        setIsEditing(false)
        toastRef.current?.show('Resident information updated successfully', 'success')
        
        // Trigger parent component data refresh if callback provided
        if (onEditComplete && typeof onEditComplete === 'function') {
          await onEditComplete(children.id)
        }
      } else {
        // Handle validation errors
        if (response.errors) {
          setEditErrors(response.errors)
          toastRef.current?.show('Please fix the validation errors', 'error')
        } else {
          toastRef.current?.show(response.error || 'Failed to update resident information', 'error')
        }
      }
    } catch (error) {
      toastRef.current?.show('Failed to update resident information', 'error')
    } finally {
      setIsUpdatingResident(false)
    }
  }

  // Handle delete resident
  const handleDeleteResident = async () => {
    if (!children?.id) return
    setShowDeleteConfirm(true)
  }

  // Confirm delete resident
  const handleConfirmDelete = async () => {
    if (!children?.id) return
    
    setIsDeleting(true)
    try {
      const response = await ApiClient.request(`/residents/${children.id}`, {
        method: 'DELETE'
      })
      
      if (response.success) {
        toastRef.current?.show('Resident deleted successfully', 'success')
        setShowDeleteConfirm(false)
        onClose && onClose()
        
        // Trigger parent component refresh
        if (onStatusUpdate && typeof onStatusUpdate === 'function') {
          await onStatusUpdate(children.id, 'deleted')
        }
      } else {
        toastRef.current?.show('Failed to delete resident', 'error')
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting resident:', error)
      toastRef.current?.show('Failed to delete resident', 'error')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle deactivate/activate resident
  const handleToggleActivation = async () => {
    if (!children?.id) return
    
    const newStatus = currentStatus === 1 ? 0 : 1
    setPendingActivationStatus(newStatus)
    setShowActivationConfirm(true)
  }

  // Confirm activation toggle
  const handleConfirmActivation = async () => {
    if (pendingActivationStatus === null) return
    
    await handleStatusChange(pendingActivationStatus)
    setShowActivationConfirm(false)
    setPendingActivationStatus(null)
  }

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Reset edit mode when panel is closed
  React.useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setEditFormData({})
      setEditErrors({})
      setShowSubmitConfirm(false)
    }
  }, [open])

  // Fetch current user for role checking
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await ApiClient.getCurrentUser()
        if (response.success) {
          setCurrentUser(response.data)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }

    if (open) {
      fetchCurrentUser()
    }
  }, [open])

  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      >
        {/* Floating Close Button next to Panel */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
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
        {/* Panel Header - No close button */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">
              Resident Details
              {isEditing && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 rounded-md">
                  <i className="bi bi-pencil mr-1" />
                  Editing
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Button - Only show when not in edit mode and user is active */}
            {!isEditing && currentStatus === 1 && (
              <button 
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9"
                onClick={handleEditStart}
                title="Edit resident information"
              >
                <i className="bi bi-pencil mr-1.5" />
                Edit
              </button>
            )}
            
            {/* Close button for mobile */}
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer sm:hidden"
              onClick={onClose}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            {/* Sectioned resident details layout */}
            {children && typeof children === 'object' && children.id ? (
              <div className="w-full space-y-2">
              
              {/* Resident Information Card - Combined */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative">
                {/* Header Section with Edit Button */}
                <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
                      <i className="bi bi-person-badge" />
                    </div>
                    <div>
                      <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                        {(() => {
                          const firstName = children.first_name || '';
                          const middleName = children.middle_name || '';
                          const lastName = children.last_name || '';
                          const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
                          return fullName || 'Unknown Resident';
                        })()}
                      </h1>
                      <p className="text-xs text-gray-500">ID: {String(children.id).padStart(5, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Special Category Badge - Show if resident has special category */}
                    {specialCategoryInfo && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Special Category</div>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium tracking-normal rounded-md bg-gray-100 text-gray-800">
                          <i className={`${specialCategoryInfo.icon} mr-1`} />
                          {specialCategoryInfo.label}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium tracking-normal rounded-md ${statusInfo.color}`}>
                        <i className={`${statusInfo.icon} mr-1`} />
                        {statusInfo.label}
                        {isUpdating && <i className="bi bi-arrow-clockwise animate-spin ml-1" />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal and Contact Information */}
                {!isEditing ? (
                  <div className="gap-4 mb-3 grid grid-cols-1 md:grid-cols-2">
                    {/* Personal Information */}
                    <div>
                      <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Personal Information</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">First Name</span>
                          <span className="text-xs text-gray-900">{children.first_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Middle Name</span>
                          <span className="text-xs text-gray-900">{children.middle_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Last Name</span>
                          <span className="text-xs text-gray-900">{children.last_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Gender</span>
                          <span className="text-xs text-gray-900">{mapGenderToFrontend(children.gender) || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Date of Birth</span>
                          <span className="text-xs text-gray-900">
                            {children.birth_date ? new Date(children.birth_date).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Age</span>
                          <span className="text-xs text-gray-900">
                            {children.age !== null && children.age !== undefined ? `${children.age} years old` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Civil Status</span>
                          <span className="text-xs text-gray-900">{children.civil_status || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Contact Information</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Email</span>
                          <span className="text-xs text-gray-900 font-mono">{children.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Home Phone</span>
                          <span className="text-xs text-gray-900">{children.home_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Mobile</span>
                          <span className="text-xs text-gray-900">{children.mobile_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Address</span>
                          <span className="text-xs text-gray-900">{children.address || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Occupation</span>
                          <span className="text-xs text-gray-900">{children.occupation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Religion</span>
                          <span className="text-xs text-gray-900">{children.religion || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode - Card-based Layout */
                  <div className="space-y-4 mb-3">
                    {/* Personal Information Card */}
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
                                value={editFormData.suffix || ''}
                                onChange={(e) => handleFieldChange('suffix', e.target.value)}
                                className="w-full rounded-md px-2 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-6"
                              >
                                {SUFFIX_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <i className="bi bi-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                            </div>
                          </div>

                          {/* First Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editFormData.first_name || ''}
                              onChange={(e) => handleFieldChange('first_name', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                                editErrors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                              placeholder="Enter first name"
                            />
                            {editErrors.first_name && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.first_name}</p>
                            )}
                          </div>

                          {/* Middle Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={editFormData.middle_name || ''}
                              onChange={(e) => handleFieldChange('middle_name', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                                editErrors.middle_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                              placeholder="Enter middle name"
                            />
                            {editErrors.middle_name && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.middle_name}</p>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Last Name (Full width) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editFormData.last_name || ''}
                            onChange={(e) => handleFieldChange('last_name', e.target.value)}
                            className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                              editErrors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            placeholder="Enter last name"
                          />
                          {editErrors.last_name && (
                            <p className="text-xs text-red-600 mt-1">{editErrors.last_name}</p>
                          )}
                        </div>

                        {/* Row 3: Gender, Birth Date, Civil Status */}
                        <div className="grid grid-cols-3 gap-3">
                          {/* Gender */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              {console.log('=== GENDER DROPDOWN RENDER ===', 'Current gender value:', editFormData.gender, 'Type:', typeof editFormData.gender, 'editFormData:', editFormData)}
                              <select
                                value={editFormData.gender || ''}
                                onChange={(e) => handleFieldChange('gender', e.target.value)}
                                className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8 ${
                                  editErrors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                              >
                                <option value="">Select gender</option>
                                <option value="1">Male</option>
                                <option value="2">Female</option>
                              </select>
                              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                            </div>
                            {editErrors.gender && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.gender}</p>
                            )}
                          </div>

                          {/* Date of Birth */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={editFormData.birth_date ? editFormData.birth_date.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                                editErrors.birth_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                            />
                            {editErrors.birth_date && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.birth_date}</p>
                            )}
                          </div>

                          {/* Civil Status */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Civil Status <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={editFormData.civil_status || ''}
                                onChange={(e) => handleFieldChange('civil_status', e.target.value)}
                                className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8 ${
                                  editErrors.civil_status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                              >
                                <option value="">Select civil status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Separated">Separated</option>
                                <option value="Divorced">Divorced</option>
                              </select>
                              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                            </div>
                            {editErrors.civil_status && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.civil_status}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <i className="bi bi-telephone mr-2 text-green-600"></i>
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        {/* Row 1: Home Number and Mobile Number */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Home Phone */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Home Number <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              value={editFormData.home_number || ''}
                              onChange={(e) => handleFieldChange('home_number', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                                editErrors.home_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                              placeholder="Enter home phone number"
                            />
                            {editErrors.home_number && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.home_number}</p>
                            )}
                          </div>

                          {/* Mobile */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              value={editFormData.mobile_number || ''}
                              onChange={(e) => handleFieldChange('mobile_number', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                                editErrors.mobile_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                              placeholder="Enter mobile number"
                            />
                            {editErrors.mobile_number && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.mobile_number}</p>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Email (Full width) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="email"
                            value={editFormData.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 transition-colors h-9 ${
                              editErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            placeholder="Enter email address"
                          />
                          {editErrors.email && (
                            <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>
                          )}
                        </div>

                        {/* Row 3: Address and Purok */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Address (input text) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editFormData.address || ''}
                              onChange={(e) => handleFieldChange('address', e.target.value)}
                              className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                                editErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              } focus:ring-1 transition-colors h-9`}
                              placeholder="House No., Street, Barangay, City"
                            />
                            {editErrors.address && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.address}</p>
                            )}
                          </div>

                          {/* Purok Dropdown */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Purok <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={editFormData.purok || ''}
                                onChange={(e) => handleFieldChange('purok', e.target.value)}
                                className={`w-full rounded-md px-3 py-1.5 text-sm border ${
                                  editErrors.purok ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                } focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8`}
                              >
                                <option value="">Select Purok</option>
                                <option value="1">Purok 1</option>
                                <option value="2">Purok 2</option>
                                <option value="3">Purok 3</option>
                                <option value="4">Purok 4</option>
                                <option value="5">Purok 5</option>
                                <option value="6">Purok 6</option>
                                <option value="7">Purok 7</option>
                              </select>
                              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                            </div>
                            {editErrors.purok && (
                              <p className="text-xs text-red-600 mt-1">{editErrors.purok}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <i className="bi bi-info-circle mr-2 text-indigo-600"></i>
                        Additional Information
                      </h3>
                      <div className="space-y-3">
                        {/* Single Row: 3 Columns - Occupation, Religion, Special Category */}
                        <div className="grid grid-cols-3 gap-3">
                          {/* Occupation */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Occupation <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                value={editFormData.occupation || ''}
                                onChange={(e) => handleFieldChange('occupation', e.target.value)}
                                className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
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
                              Religion <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                value={editFormData.religion || ''}
                                onChange={(e) => handleFieldChange('religion', e.target.value)}
                                className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
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
                              Special Category <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                value={SPECIAL_CATEGORY_REVERSE_MAP[editFormData.special_category_id] || ''}
                                onChange={(e) => {
                                  const selectedCode = e.target.value
                                  const categoryId = SPECIAL_CATEGORY_MAP[selectedCode]
                                  console.log('Special Category Selection:', {
                                    selectedCode,
                                    categoryId,
                                    currentValue: editFormData.special_category_id,
                                    mapping: SPECIAL_CATEGORY_MAP,
                                    reverseMapping: SPECIAL_CATEGORY_REVERSE_MAP,
                                    specialCategories: specialCategories
                                  })
                                  handleFieldChange('special_category_id', categoryId)
                                }}
                                className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
                                disabled={isLoadingCategories}
                              >
                                <option value="">None</option>
                                {specialCategories.map(category => (
                                  <option key={category.id} value={category.category_code}>
                                    {category.category_name}
                                  </option>
                                ))}
                              </select>
                              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Record Information - Only show in read mode */}
                {!isEditing && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Record Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Record ID</div>
                        <div className="text-xs font-mono text-blue-600">resident_id_{String(children.id).padStart(5, '0')}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Created</div>
                        <div className="text-xs text-gray-900">
                          {children.created_at ? new Date(children.created_at).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Administrative Notes */}
                {!isEditing ? (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mr-2">Administrative Notes</div>
                      <i className="bi bi-journal-text text-gray-500 text-xs" />
                    </div>
                    <div className="bg-gray-100 border border-gray-300 rounded-md p-2">
                      <div className="text-xs text-gray-700 tracking-normal antialiased">
                        {children.notes || 'No administrative notes available for this resident.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Administrative Notes Card - Edit Mode */
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="bi bi-journal-text mr-2 text-purple-600"></i>
                      Administrative Notes
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Internal Notes <span className="text-gray-400 font-normal">(Visible to administrators only)</span>
                      </label>
                      <textarea
                        value={editFormData.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        rows={4}
                        className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                        placeholder="Enter administrative notes, observations, or important information about this resident..."
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Use this space for internal documentation, special considerations, or administrative reminders.
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            children
          )}
          </div>
        </div>

        {/* Edit Controls - Sticky Footer */}
        {children && children.id && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            {!isEditing ? (
              // Normal Mode - Only administrative actions on right
              <>
                {/* Empty left side for balance */}
                <div></div>
                
                {/* Right side - Reset PIN, Deactivate, Delete */}
                <div className="flex items-center space-x-2">
                  {/* Reset PIN button - only show if resident has user account AND is active */}
                  {children.user_id && currentStatus === 1 && (
                    <button 
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9"
                      onClick={handleResetPinClick}
                      title="Reset user PIN and generate new temporary credentials"
                    >
                      <i className="bi bi-arrow-clockwise mr-1.5" />
                      Reset PIN
                    </button>
                  )}
                  
                  {/* Deactivate/Activate button */}
                  <button 
                    className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md focus:ring-1 transition-colors cursor-pointer h-9 ${
                      currentStatus === 1 
                        ? 'text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 focus:ring-orange-500' 
                        : 'text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 focus:ring-green-500'
                    }`}
                    onClick={handleToggleActivation}
                    disabled={isUpdating}
                    title={currentStatus === 1 ? 'Deactivate this resident' : 'Activate this resident'}
                  >
                    {isUpdating ? (
                      <i className="bi bi-arrow-clockwise animate-spin mr-1.5" />
                    ) : (
                      <i className={`${currentStatus === 1 ? 'bi bi-person-dash' : 'bi bi-person-check'} mr-1.5`} />
                    )}
                    {currentStatus === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  {/* Delete button - Admin only, Inactive residents only */}
                  {currentUser?.role === 1 && currentStatus === 0 && (
                    <button 
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer h-9"
                      onClick={handleDeleteResident}
                      title="Permanently delete this inactive resident (Admin only)"
                    >
                      <i className="bi bi-trash mr-1.5" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Edit Mode - Cancel and Submit buttons (right-aligned)
              <div className="flex items-center justify-end space-x-2 w-full">
                <button 
                  className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"
                  onClick={handleEditCancel}
                  disabled={isUpdatingResident}
                  title="Cancel editing"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitClick}
                  disabled={isUpdatingResident || !hasFormChanges()}
                  className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-9 disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasFormChanges() 
                      ? 'bg-green-600 text-white border border-green-600 hover:bg-green-700 hover:border-green-700 focus:ring-1 focus:ring-green-500 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 border border-gray-300'
                  }`}
                  title={hasFormChanges() ? "Submit changes" : "No changes to submit"}
                >
                  {isUpdatingResident ? (
                    <>
                      <i className="bi bi-arrow-clockwise animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : hasFormChanges() ? (
                    <>
                      <i className="bi bi-check-lg mr-1.5" />
                      Submit
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg mr-1.5" />
                      No Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
                <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center">
                  <i className="bi bi-check-lg text-green-600 text-xl"></i>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Changes</h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to update this resident's information?
              </p>
              
              {/* Buttons */}
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors"
                  disabled={isUpdatingResident}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isUpdatingResident}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingResident ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
                <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center">
                  <i className="bi bi-trash text-red-600 text-xl"></i>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Resident</h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete this resident? This action cannot be undone.
              </p>
              
              {/* Buttons */}
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Toggle Confirmation Modal */}
      {showActivationConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
                <div className={`${pendingActivationStatus === 1 ? 'bg-green-100' : 'bg-orange-100'} rounded-full h-12 w-12 flex items-center justify-center`}>
                  <i className={`${pendingActivationStatus === 1 ? 'bi bi-person-check text-green-600' : 'bi bi-person-dash text-orange-600'} text-xl`}></i>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {pendingActivationStatus === 1 ? 'Activate' : 'Deactivate'} Resident
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to {pendingActivationStatus === 1 ? 'activate' : 'deactivate'} this resident?
              </p>
              
              {/* Buttons */}
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowActivationConfirm(false)
                    setPendingActivationStatus(null)
                  }}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmActivation}
                  disabled={isUpdating}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium text-white rounded-md focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    pendingActivationStatus === 1
                      ? 'bg-green-600 border border-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-orange-600 border border-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  {isUpdating ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Confirmation Modal - Custom Design matching AddResidentsView */}
      {showResetPinConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 mx-4 max-w-xs w-full">
            <div className="text-center">
              {/* Icon - Question or Check */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 transition-colors duration-300">
                {isResettingPin ? (
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
                {isResettingPin ? (
                  <h3 className="text-lg font-medium text-gray-900">
                    Resetting PIN...
                  </h3>
                ) : (
                  <div>
                    <h4 className="text-base font-normal text-gray-700 mb-2">
                      Are you sure you want to Reset PIN?
                    </h4>
                    {children && (
                      <p className="text-xl font-semibold text-gray-900">
                        {children.first_name} {children.middle_name && `${children.middle_name.charAt(0)}.`} {children.last_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="text-sm text-gray-600 mb-6">
                {!isResettingPin && (
                  <p className="text-xs text-gray-500">
                    A new temporary PIN will be generated. User must change it on next login.
                  </p>
                )}
                {isResettingPin && (
                  <div className="flex items-center justify-center">
                    <i className="bi bi-arrow-clockwise animate-spin text-sm mr-2"></i>
                    <span className="text-sm text-gray-600">Please wait while we reset the PIN...</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {!isResettingPin && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowResetPinConfirm(false)}
                    className="w-26 h-10 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPinConfirm}
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

      {/* New Credentials Display Modal - Custom Design matching AddResidentsView */}
      {showNewCredentials && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 999999 }}
          onClick={(e) => {
            // Close modal if clicking outside
            if (e.target === e.currentTarget) {
              setShowNewCredentials(false)
              setShowCredentials(false)
              setCopied(false)
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
                onClick={() => {
                  setShowNewCredentials(false)
                  setShowCredentials(false)
                  setCopied(false)
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
                PIN Reset Successful!
              </h3>
              
              {/* Expandable Credentials Section */}
              {newCredentials && (
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
                            <div className="text-xs"><span className="font-medium">Username:</span> {newCredentials.username}</div>
                            <div className="text-xs"><span className="font-medium">PIN:</span> {newCredentials.pin}</div>
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

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
