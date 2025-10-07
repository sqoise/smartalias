import React from 'react'
import Modal from '../../common/Modal'
import ApiClient from '../../../lib/apiClient'

export default function ResidentsView({ open, onClose, children, onStatusUpdate }) {
  // Status management (existing)
  const [currentStatus, setCurrentStatus] = React.useState(children?.is_active || 0)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Edit state management (Task 2.1)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({})
  const [editErrors, setEditErrors] = React.useState({})
  const [isUpdatingResident, setIsUpdatingResident] = React.useState(false)

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

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (isUpdating || !children?.id) return
    
    setIsUpdating(true)
    try {
      // Update local state immediately for responsive UI
      setCurrentStatus(newStatus)
      
      // Call parent component's update function if provided
      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        await onStatusUpdate(children.id, newStatus)
      }
    } catch (error) {
      // Revert on error
      setCurrentStatus(children.is_active || 0)
      console.error('Failed to update status:', error)
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

  const statusInfo = getStatusInfo(currentStatus)

  // Initialize edit form data when entering edit mode
  React.useEffect(() => {
    if (isEditing && children) {
      setEditFormData({
        firstName: children.first_name || '',
        lastName: children.last_name || '',
        middleName: children.middle_name || '',
        suffix: children.suffix || '',
        birthDate: children.birth_date || '',
        gender: children.gender || '',
        civilStatus: children.civil_status || '',
        homeNumber: children.home_number || '',
        mobileNumber: children.mobile_number || '',
        email: children.email || '',
        address: children.address || '',
        purok: children.purok || '',
        religion: children.religion || '',
        occupation: children.occupation || '',
        specialCategory: children.special_category || '',
        notes: children.notes || '',
        isActive: children.is_active || 1
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
      console.error('Error resetting PIN:', error)
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
      console.error('Failed to copy credentials:', error)
      alert('Failed to copy credentials')
    }
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
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">Resident Details</div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
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
                      <p className="text-xs text-gray-500">ID: {children.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Personal Information */}
                  <div>
                    <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Personal Information</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Gender</span>
                        <span className="text-xs text-gray-900">{children.gender || '-'}</span>
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
                    </div>
                  </div>
                </div>

                {/* Record Information */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Record Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Record ID</div>
                      <div className="text-xs font-mono text-blue-600">resident_id_{children.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Created</div>
                      <div className="text-xs text-gray-900">
                        {children.created_at ? new Date(children.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Notes */}
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
              </div>

              {/* Family Tree Section */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium tracking-normal antialiased text-gray-900">Family Tree</h3>
                  </div>
                  <button className="inline-flex items-center justify-center w-6 h-6 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer">
                    <i className="bi bi-pencil text-xs" />
                  </button>
                </div>

                {/* Simple Family Tree Container */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="relative flex flex-col items-center">
                    
                    {/* Parent Card */}
                    <div className="flex flex-col items-center mb-3">
                      <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 shadow-md min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <i className="bi bi-person text-sm text-gray-600" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-700">
                              {(() => {
                                const firstName = children.first_name || '';
                                const lastName = children.last_name || '';
                                return `${firstName} ${lastName}`.trim() || 'Parent Name';
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const gender = children && children.gender ? String(children.gender).toLowerCase() : '';
                                if (gender === 'male') return 'Father';
                                if (gender === 'female') return 'Mother';
                                return 'Parent';
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Connection Line - Single vertical line */}
                    <div className="relative w-full flex justify-center mb-3">
                      {/* Vertical line down from parent */}
                      <div className="absolute top-0 w-0.5 h-12 bg-gray-300"></div>
                    </div>

                    {/* Children Section */}
                    <div className="flex flex-col items-center mt-12">
                      {/* Children Cards - Grid Layout with max 3 per row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
                        {/* Demo children data with gender-based labels */}
                        {(() => {
                          // Demo children data - replace with actual family data
                          const demoChildren = [
                            { name: 'Maria Santos', gender: 'Female' },
                            { name: 'Juan Santos', gender: 'Male' },
                            { name: 'Ana Santos', gender: 'Female' },
                            { name: 'Carlos Santos', gender: 'Male' },
                            { name: 'Sofia Santos', gender: 'Female' }
                          ];
                          
                          return demoChildren.map((child, index) => (
                            <div key={index} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 shadow-md min-w-[180px]">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <i className="bi bi-person text-xs text-gray-600" />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <div className="text-xs font-medium text-gray-700 truncate">{child.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {(() => {
                                      const gender = child.gender ? String(child.gender).toLowerCase() : '';
                                      return gender === 'male' ? 'Son' : 'Daughter';
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          ) : (
            children
          )}
          </div>
        </div>

        {/* Edit Controls - Sticky Footer (like AddResidentsView) */}
        {children && children.id && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
            {!isEditing ? (
              // Normal Mode - Edit and Reset PIN Buttons
              <>
                {/* Reset PIN button - only show if resident has user account */}
                {children.user_id && (
                  <button 
                    className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9"
                    onClick={handleResetPinClick}
                    title="Reset user PIN and generate new temporary credentials"
                  >
                    <i className="bi bi-arrow-clockwise mr-1.5" />
                    Reset PIN
                  </button>
                )}
                <button 
                  className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 focus:ring-1 focus:ring-yellow-500 transition-colors cursor-pointer h-9"
                  onClick={handleEditStart}
                  title="Edit resident information"
                >
                  <i className="bi bi-pencil mr-1.5" />
                  Edit
                </button>
              </>
            ) : (
              // Edit Mode - Cancel and Update Buttons
              <>
                <button 
                  className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"
                  onClick={handleEditCancel}
                  disabled={isUpdatingResident}
                  title="Cancel editing"
                >
                  Cancel
                </button>
                <button 
                  className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer h-9"
                  onClick={() => {/* TODO: Handle update */}}
                  disabled={isUpdatingResident}
                  title="Save changes"
                >
                  {isUpdatingResident ? (
                    <>
                      <i className="bi bi-arrow-clockwise animate-spin mr-1.5" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

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
    </div>
  )
}
