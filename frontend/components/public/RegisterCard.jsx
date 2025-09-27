'use client'

import Link from 'next/link'
import Spinner from '../common/Spinner'

export default function RegisterCard({ 
  formData,
  onInputChange, 
  onSubmit, 
  isLoading,
  errors,
  showLogo = false, // This prop will be passed by PublicLayout
  className = '' // This prop will be passed by PublicLayout
}) {
  return (
    <>
      {/* Header Container - Outside main card (similar to LoginCard) */}
      {showLogo && (
        <div className="text-center pb-4">
          <img 
            src="/images/barangay_logo.jpg" 
            alt="Barangay Logo" 
            className="w-20 h-20 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full mx-auto mb-1"
          />
          <h2 className="font-bold text-gray-800 text-4xl sm:text-3xl lg:text-4xl">Create Your Account</h2>
        </div>
      )}

      {/* Main Card Container - Fully responsive and scrollable */}
      <div className={`relative w-full max-w-sm mx-auto sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl bg-transparent ${className} mt-4 sm:mt-6 lg:mt-8`}>
        
        {/* Main Content Area */}
        <div className="w-full px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3">
          {/* Header - only show when logo is not shown */}
          {!showLogo && (
            <div className="mb-1 text-center">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
                Create Your Account
              </h2>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={onSubmit} className="space-y-1 sm:space-y-1.5 lg:space-y-2">
            {/* Personal Information */}
            <div className="space-y-1">
              {/* Name Fields - 4 columns on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {/* Last Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.lastName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300`}
                    style={{ fontSize: '14px' }}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.lastName}</p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.firstName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300`}
                    style={{ fontSize: '14px' }}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Middle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.middleName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300`}
                    placeholder="Middle name"
                    style={{ fontSize: '14px' }}
                  />
                  {errors.middleName && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.middleName}</p>
                  )}
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Suffix</label>
                  <input
                    type="text"
                    name="suffix"
                    value={formData.suffix}
                    onChange={onInputChange}
                    className="w-full rounded-md px-2 py-1 border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200 min-h-[28px]"
                    placeholder="Jr., Sr., III"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Birth Date, Gender, Civil Status - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Birth Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.birthDate ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '12.5px' }}
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.birthDate}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.gender ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.gender}</p>
                  )}
                </div>

                {/* Civil Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Civil Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.civilStatus ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="separated">Separated</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  {errors.civilStatus && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.civilStatus}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-1">
              {/* Email and Contact Number - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onInputChange}
                    className="w-full rounded-md px-2 py-1 border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200 min-h-[28px]"
                    placeholder="Email (optional)"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={onInputChange}
                    onKeyPress={(e) => {
                      // Only allow numbers (0-9)
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    pattern="[0-9]{11}"
                    inputMode="numeric"
                    maxLength="11"
                    className="w-full rounded-md px-2 py-1 border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200 min-h-[28px]"
                    placeholder="09123456789"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Address and Purok - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.address ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300`}
                    style={{ fontSize: '14px' }}
                    placeholder="Full address"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>
                  )}
                </div>

                {/* Purok */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Purok <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="purok"
                    value={formData.purok}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2 py-1 border transition-all duration-200 min-h-[28px] ${
                      errors.purok ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select purok</option>
                    <option value="purok1">Purok 1</option>
                    <option value="purok2">Purok 2</option>
                    <option value="purok3">Purok 3</option>
                    <option value="purok4">Purok 4</option>
                    <option value="purok5">Purok 5</option>
                    <option value="purok6">Purok 6</option>
                    <option value="purok7">Purok 7</option>
                  </select>
                  {errors.purok && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.purok}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-1">
              {/* Religion and Occupation - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {/* Religion */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Religion <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                      errors.religion ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select religion</option>
                    <option value="catholic">Catholic</option>
                    <option value="islam">Islam</option>
                    <option value="christian">Christian</option>
                    <option value="inc">INC</option>
                    <option value="others">Others</option>
                  </select>
                  {errors.religion && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.religion}</p>
                  )}
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Occupation <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="occupation"
                    value={formData.occupation}
                    onChange={onInputChange}
                    className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                      errors.occupation ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select occupation</option>
                    <option value="private">Private Sector</option>
                    <option value="government">Government / Public Sector</option>
                    <option value="self_employed">Self-Employed / Entrepreneur</option>
                    <option value="ofw">Overseas Filipino Worker (OFW)</option>
                    <option value="student">Student</option>
                    <option value="homemaker">Homemaker</option>
                    <option value="unemployed">Unemployed / Job Seeker</option>
                    <option value="retired">Retired</option>
                    <option value="others">Others</option>
                  </select>
                  {errors.occupation && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.occupation}</p>
                  )}
                </div>
              </div>

              {/* Special Category - Full width */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Special Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialCategory"
                  value={formData.specialCategory}
                  onChange={onInputChange}
                  className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                    errors.specialCategory ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                  } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300 transition-all duration-200`}
                  style={{ fontSize: '14px' }}
                >
                  <option value="">Select special category</option>
                  <option value="pwd">Person with Disability (PWD)</option>
                  <option value="senior">Senior Citizen</option>
                  <option value="solo_parent">Solo Parent</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="4ps">4Ps Beneficiary</option>
                  <option value="none">None</option>
                </select>
                {errors.specialCategory && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.specialCategory}</p>
                )}
              </div>
            </div>

            {/* Account Credentials */}
            <div className="space-y-1">
              {/* Username - Full width */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={onInputChange}
                  className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                    errors.username ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                  } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white hover:border-gray-300`}
                  placeholder="Choose a username"
                  style={{ fontSize: '14px' }}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.username}</p>
                )}
              </div>

              {/* PIN Fields - side by side */}
              <div className="grid grid-cols-2 gap-2">
                {/* PIN */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={onInputChange}
                    onKeyPress={(e) => {
                      // Only allow numbers (0-9)
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                      errors.pin ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white text-center hover:border-gray-300 font-mono tracking-wider`}
                    style={{ fontSize: '14px' }}
                    placeholder="6-digit"
                    maxLength="6"
                  />
                  {errors.pin && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.pin}</p>
                  )}
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPin"
                    value={formData.confirmPin}
                    onChange={onInputChange}
                    onKeyPress={(e) => {
                      // Only allow numbers (0-9)
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    className={`w-full rounded-md px-2.5 py-1.5 border transition-all duration-200 ${
                      errors.confirmPin ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-black focus:ring-black/20'
                    } focus:ring-2 focus:outline-none placeholder:text-gray-400 placeholder:text-sm bg-white text-center hover:border-gray-300 font-mono tracking-wider`}
                    style={{ fontSize: '14px' }}
                    placeholder="Confirm"
                    maxLength="6"
                  />
                  {errors.confirmPin && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.confirmPin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button & Login Link - Combined row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-1">
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-green-600 hover:text-green-700 font-medium transition-colors hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
              
              <button
                type="submit"
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 min-w-[80px] min-h-[28px] ${
                  isLoading 
                    ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700 focus:ring-2 focus:ring-green-500/20 focus:outline-none shadow-sm hover:shadow-md'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}