'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../lib/apiClient'
import PageLoadingV2 from '../../../components/common/PageLoadingV2'

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [editData, setEditData] = useState({})
  const [errors, setErrors] = useState({})

  // Fetch resident profile on component mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      
      // Get current user session
      const sessionResponse = await ApiClient.getSession()
      
      if (!sessionResponse.success || !sessionResponse.data) {
        // Session expired or invalid - modal will handle this
        return
      }
      
      const user = sessionResponse.data
      
      // Fetch resident data by user ID
      // Note: We need to find the resident by user_id
      // For now, we'll fetch all residents and filter (you may want to add a backend endpoint)
      const residentsResponse = await ApiClient.getResidents()
      
      if (residentsResponse.success && residentsResponse.data) {
        // Find resident with matching user_id
        const resident = residentsResponse.data.find(r => r.user_id === user.id)
        
        if (resident) {
          setProfileData({
            // Personal Information
            firstName: resident.first_name || '',
            middleName: resident.middle_name || '',
            lastName: resident.last_name || '',
            suffix: resident.suffix || '',
            birthDate: resident.birth_date || '',
            age: resident.age || 0,
            gender: resident.gender || '',
            civilStatus: resident.civil_status || '',
            
            // Contact Information
            email: resident.email || '',
            homeNumber: resident.home_number || '',
            mobileNumber: resident.mobile_number || '',
            address: resident.address || '',
            purok: resident.purok || '',
            
            // Additional Information
            religion: resident.religion || '',
            occupation: resident.occupation || '',
            specialCategory: resident.special_category || '',
            
            // Account Information
            username: user.username,
            dateRegistered: resident.created_at || '',
            lastLogin: user.last_login || ''
          })
        } else {
          console.error('No resident found for user')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setEditData({ ...profileData })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditData({ ...profileData })
    setIsEditing(false)
  }

  const validateFields = () => {
    const newErrors = {}
    
    // Email validation (optional but must be valid if provided)
    if (editData.email && editData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }
    
    // Mobile number validation (optional but must be valid if provided)
    if (editData.mobileNumber && editData.mobileNumber.trim()) {
      const cleanMobile = editData.mobileNumber.replace(/\s+/g, '')
      if (!/^09\d{9}$/.test(cleanMobile)) {
        newErrors.mobileNumber = 'Enter valid 11-digit mobile (e.g., 09XX XXX XXXX)'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateFields()) {
      return
    }
    setProfileData({ ...editData })
    setIsEditing(false)
    // TODO: Make API call to save the data
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // For mobile number, only allow digits and limit to 11
    let processedValue = value
    if (name === 'mobileNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 11)
    }
    
    setEditData(prev => ({
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

  // Show loading state
  if (isLoading || !profileData) {
    return <PageLoadingV2 isLoading={true} />
  }

  return (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-500">Manage your information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <i className="bi bi-pencil mr-1.5"></i>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <i className="bi bi-check-lg mr-1.5"></i>
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            >
              <i className="bi bi-x-lg mr-1.5"></i>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Compact Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Profile Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="bi bi-person-fill text-2xl text-green-600"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {profileData.firstName} {profileData.middleName} {profileData.lastName} {profileData.suffix}
              </h2>
              <p className="text-sm text-gray-600">{profileData.occupation}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="inline-flex items-center text-xs text-gray-500">
                  <i className="bi bi-person-badge mr-1"></i>
                  @{profileData.username}
                </span>
                <span className="inline-flex items-center text-xs text-gray-500">
                  <i className="bi bi-geo-alt mr-1"></i>
                  {profileData.purok}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Age: {profileData.age}</div>
              <div>{profileData.civilStatus}</div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2">
            
            {/* Personal Information */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <i className="bi bi-person mr-2 text-green-600"></i>
                Personal Information
              </h3>
            </div>

            {/* Name Fields */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                />
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Middle Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="middleName"
                  value={editData.middleName}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                />
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.middleName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                />
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Suffix</label>
              {isEditing ? (
                <select
                  name="suffix"
                  value={editData.suffix}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                >
                  <option value="">None</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.suffix || 'None'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Birth Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="birthDate"
                  value={editData.birthDate}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                />
              ) : (
                <p className="text-sm text-gray-900 py-1">
                  {new Date(profileData.birthDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Gender</label>
              {isEditing ? (
                <select
                  name="gender"
                  value={editData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.gender}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="lg:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <i className="bi bi-telephone mr-2 text-green-600"></i>
                Contact Information
              </h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email Address</label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-1 focus:outline-none h-9`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Mobile Number</label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={editData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="09XX XXX XXXX"
                    inputMode="numeric"
                    maxLength={11}
                    className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
                      errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-1 focus:outline-none h-9`}
                  />
                  {errors.mobileNumber && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.mobileNumber || 'Not provided'}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Complete Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={editData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none resize-none"
                />
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.address}</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="lg:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <i className="bi bi-info-circle mr-2 text-green-600"></i>
                Additional Information
              </h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Religion</label>
              {isEditing ? (
                <select
                  name="religion"
                  value={editData.religion}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                >
                  <option value="">Select Religion</option>
                  <option value="Roman Catholic">Roman Catholic</option>
                  <option value="Protestant">Protestant</option>
                  <option value="Islam">Islam</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Others">Others</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.religion}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Occupation</label>
              {isEditing ? (
                <select
                  name="occupation"
                  value={editData.occupation}
                  onChange={handleInputChange}
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none h-9"
                >
                  <option value="">Select Occupation</option>
                  <option value="Student">Student</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                  <option value="Others">Others</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-1">{profileData.occupation}</p>
              )}
            </div>

            {/* Account Information */}
            <div className="lg:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <i className="bi bi-shield-check mr-2 text-green-600"></i>
                Account Information
              </h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Username</label>
              <p className="text-sm text-gray-500 py-1">{profileData.username}</p>
              <p className="text-xs text-gray-400">Cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Login</label>
              <p className="text-sm text-gray-500 py-1">{profileData.lastLogin}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
