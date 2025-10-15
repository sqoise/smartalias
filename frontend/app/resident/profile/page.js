'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ApiClient from '../../../lib/apiClient'
import PageLoadingV2 from '../../../components/common/PageLoadingV2'
import { 
  mapReligionToFrontend, 
  mapOccupationToFrontend, 
  mapSpecialCategoryToFrontend,
  mapGenderToFrontend
} from '../../../lib/valueMappers'

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
            gender: mapGenderToFrontend(resident.gender) || '',
            civilStatus: resident.civil_status || '',
            
            // Contact Information
            email: resident.email || '',
            homeNumber: resident.home_number || '',
            mobileNumber: resident.mobile_number || '',
            address: resident.address || '',
            purok: resident.purok || '',
            
            // Additional Information
            religion: mapReligionToFrontend(resident.religion) || '',
            occupation: mapOccupationToFrontend(resident.occupation) || '',
            specialCategory: mapSpecialCategoryToFrontend(resident.special_category) || '',
            
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
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1 text-sm text-gray-500">
          <li>
            <Link href="/resident" className="hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">My Profile</span>
          </li>
        </ol>
      </nav>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">User Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your personal information and account settings</p>
          </div>
          {/* Edit functionality disabled */}
          {/* {!isEditing ? (
            <button
              onClick={handleEdit}
              className="cursor-pointer inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg hover:text-white focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                color: '#333843',
                '--hover-bg': '#3b42521b'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333843'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <i className="bi bi-pencil text-lg"></i>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                <i className="bi bi-check-lg mr-2"></i>
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                <i className="bi bi-x-lg mr-2"></i>
                Cancel
              </button>
            </div>
          )} */}
        </div>

        {/* Profile Summary Card */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#333843' }}
            >
              <i className="bi bi-person-fill text-3xl text-white"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profileData.firstName} {profileData.middleName} {profileData.lastName} {profileData.suffix}
                </h2>
                {/* Special Category Badge */}
                {profileData.specialCategory && (
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {profileData.specialCategory === 'PWD' ? (
                      <i className="bi bi-universal-access mr-1"></i>
                    ) : profileData.specialCategory === 'Senior Citizen' ? (
                      <i className="bi bi-person-walking mr-1"></i>
                    ) : profileData.specialCategory === 'Solo Parent' ? (
                      <i className="bi bi-person-heart mr-1"></i>
                    ) : profileData.specialCategory === 'Indigenous' ? (
                      <i className="bi bi-tree mr-1"></i>
                    ) : (
                      <i className="bi bi-star mr-1"></i>
                    )}
                    {profileData.specialCategory}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="inline-flex items-center">
                  <i className="bi bi-briefcase mr-2"></i>
                  {profileData.occupation || 'Not specified'}
                </span>
                <span className="inline-flex items-center">
                  <i className="bi bi-geo-alt mr-2"></i>
                  {profileData.purok || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>Age: {profileData.age}</span>
                <span>•</span>
                <span>{profileData.gender}</span>
                <span>•</span>
                <span>{profileData.civilStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <i className="bi bi-person mr-2 text-gray-600"></i>
              Personal Information
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Middle Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="middleName"
                    value={editData.middleName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.middleName || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Suffix</label>
                {isEditing ? (
                  <select
                    name="suffix"
                    value={editData.suffix}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                  <p className="text-base font-medium text-gray-700">{profileData.suffix || 'None'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Birth Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={editData.birthDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-700">
                    {new Date(profileData.birthDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={editData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.gender}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Civil Status</label>
                {isEditing ? (
                  <select
                    name="civilStatus"
                    value={editData.civilStatus}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.civilStatus}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Purok</label>
                {isEditing ? (
                  <select
                    name="purok"
                    value={editData.purok}
                    onChange={handleInputChange}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  >
                    <option value="">Select Purok</option>
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                    <option value="Purok 5">Purok 5</option>
                    <option value="Purok 6">Purok 6</option>
                    <option value="Purok 7">Purok 7</option>
                  </select>
                ) : (
                  <p className="text-base font-medium text-gray-700">{profileData.purok || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <i className="bi bi-telephone mr-2 text-gray-600"></i>
              Contact Information
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Email Address</label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className={`w-full rounded-lg px-3 py-2 text-sm border transition-all duration-200 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-slate-500 focus:ring-slate-500'
                    } focus:ring-1 focus:outline-none`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-base font-medium text-gray-700">{profileData.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Mobile Number</label>
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
                    className={`w-full rounded-lg px-3 py-2 text-sm border transition-all duration-200 ${
                      errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-slate-500 focus:ring-slate-500'
                    } focus:ring-1 focus:outline-none`}
                  />
                  {errors.mobileNumber && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-base font-medium text-gray-700">{profileData.mobileNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Home Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="homeNumber"
                  value={editData.homeNumber}
                  onChange={handleInputChange}
                  placeholder="(02) XXX-XXXX or 7-digit local number"
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                />
              ) : (
                <p className="text-base font-medium text-gray-700">{profileData.homeNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Complete Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={editData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none resize-none"
                />
              ) : (
                <p className="text-base font-medium text-gray-700">{profileData.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <i className="bi bi-info-circle mr-2 text-gray-600"></i>
              Additional Information
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Religion</label>
              {isEditing ? (
                <select
                  name="religion"
                  value={editData.religion}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="">Select Religion</option>
                  <option value="Roman Catholic">Roman Catholic</option>
                  <option value="Protestant">Protestant</option>
                  <option value="Islam">Islam</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Others">Others</option>
                </select>
              ) : (
                <p className="text-base font-medium text-gray-700">{profileData.religion || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Occupation</label>
              {isEditing ? (
                <select
                  name="occupation"
                  value={editData.occupation}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                <p className="text-base font-medium text-gray-700">{profileData.occupation || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Special Category</label>
              {isEditing ? (
                <select
                  name="specialCategory"
                  value={editData.specialCategory}
                  onChange={handleInputChange}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="PWD">PWD (Person with Disability)</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Solo Parent">Solo Parent</option>
                  <option value="Indigenous">Indigenous People</option>
                  <option value="Others">Others</option>
                </select>
              ) : (
                <div>
                  {profileData.specialCategory ? (
                    <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {profileData.specialCategory === 'PWD' ? (
                        <i className="bi bi-universal-access mr-2"></i>
                      ) : profileData.specialCategory === 'Senior Citizen' ? (
                        <i className="bi bi-person-walking mr-2"></i>
                      ) : profileData.specialCategory === 'Solo Parent' ? (
                        <i className="bi bi-person-heart mr-2"></i>
                      ) : profileData.specialCategory === 'Indigenous' ? (
                        <i className="bi bi-tree mr-2"></i>
                      ) : (
                        <i className="bi bi-star mr-2"></i>
                      )}
                      {profileData.specialCategory}
                    </div>
                  ) : (
                    <p className="text-base font-medium text-gray-700">Not specified</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <i className="bi bi-shield-check mr-2 text-gray-600"></i>
              Account Information
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Username</label>
              <p className="text-base font-medium text-gray-700">@{profileData.username}</p>
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Last Login</label>
              <p className="text-base font-medium text-gray-700">{profileData.lastLogin || 'Not available'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">Member Since</label>
              <p className="text-base font-medium text-gray-700">
                {profileData.dateRegistered ? new Date(profileData.dateRegistered).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
