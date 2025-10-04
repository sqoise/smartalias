'use client'

import Link from 'next/link'
import Spinner from '../common/Spinner'

export default function RegisterCard({ 
  formData,
  onInputChange, 
  onSubmit,
  onNext,
  onBack,
  currentStep = 1,
  stepTitle = 'Registration',
  isLoading,
  errors,
  showLogo = false,
  className = ''
}) {
  
  // Step 1: Name Fields
  const renderStep1 = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.lastName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-green-500 focus:ring-green-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
            placeholder="Last name"
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.firstName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-green-500 focus:ring-green-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
            placeholder="First name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Middle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.middleName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-green-500 focus:ring-green-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
            placeholder="Middle name"
          />
          {errors.middleName && (
            <p className="text-sm text-red-600 mt-1">{errors.middleName}</p>
          )}
        </div>

        {/* Suffix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
          <select
            name="suffix"
            value={formData.suffix}
            onChange={onInputChange}
            className="w-full rounded-md px-3 py-2 border transition-all duration-200 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none bg-white hover:border-gray-400"
            style={{ fontSize: '14px' }}
          >
            <option value="">Select suffix (optional)</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
          </select>
        </div>
      </div>
    </div>
  )

  // Step 2: Personal Information
  const renderStep2 = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.birthDate ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          />
          {errors.birthDate && (
            <p className="text-sm text-red-600 mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.gender ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <p className="text-sm text-red-600 mt-1">{errors.gender}</p>
          )}
        </div>

        {/* Civil Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Civil Status <span className="text-red-500">*</span>
          </label>
          <select
            name="civilStatus"
            value={formData.civilStatus}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.civilStatus ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          >
            <option value="">Select Civil Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {errors.civilStatus && (
            <p className="text-sm text-red-600 mt-1">{errors.civilStatus}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            className="w-full rounded-md px-3 py-2 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400 transition-all duration-200"
            placeholder="email@example.com"
            style={{ fontSize: '14px' }}
          />
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 11) {
                const event = {
                  target: {
                    name: 'mobileNumber',
                    value: value
                  }
                };
                onInputChange(event);
              }
            }}
            className="w-full rounded-md px-3 py-2 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400 transition-all duration-200"
            placeholder="09xxxxxxxxx"
            style={{ fontSize: '14px' }}
          />
        </div>
      </div>

      <div>
        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.address ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            placeholder="Complete address"
            style={{ fontSize: '14px' }}
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  )

  // Step 3: Additional Information
  const renderStep3 = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Purok */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purok <span className="text-red-500">*</span>
          </label>
          <select
            name="purok"
            value={formData.purok}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.purok ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
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
          {errors.purok && (
            <p className="text-sm text-red-600 mt-1">{errors.purok}</p>
          )}
        </div>

        {/* Religion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Religion <span className="text-red-500">*</span>
          </label>
          <select
            name="religion"
            value={formData.religion}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.religion ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          >
            <option value="">Select Religion</option>
            <option value="Roman Catholic">Roman Catholic</option>
            <option value="Protestant">Protestant</option>
            <option value="Islam">Islam</option>
            <option value="Buddhism">Buddhism</option>
            <option value="Others">Others</option>
          </select>
          {errors.religion && (
            <p className="text-sm text-red-600 mt-1">{errors.religion}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Occupation <span className="text-red-500">*</span>
          </label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.occupation ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          >
            <option value="">Select Occupation</option>
            <option value="Employed">Employed</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Retired">Retired</option>
            <option value="Others">Others</option>
          </select>
          {errors.occupation && (
            <p className="text-sm text-red-600 mt-1">{errors.occupation}</p>
          )}
        </div>

        {/* Special Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Category <span className="text-red-500">*</span>
          </label>
          <select
            name="specialCategory"
            value={formData.specialCategory}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.specialCategory ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none bg-white hover:border-gray-400`}
            style={{ fontSize: '14px' }}
          >
            <option value="">Select Category</option>
            <option value="Not Applicable">Not Applicable</option>
            <option value="Senior Citizen">Senior Citizen</option>
            <option value="PWD">PWD</option>
            <option value="Solo Parent">Solo Parent</option>
            <option value="Indigent">Indigent</option>
            <option value="Student">Student</option>

          </select>
          {errors.specialCategory && (
            <p className="text-sm text-red-600 mt-1">{errors.specialCategory}</p>
          )}
        </div>
      </div>
    </div>
  )

  // Step 4: Account Information
  const renderStep4 = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.username ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            placeholder="Choose a username"
            style={{ fontSize: '14px' }}
          />
          {errors.username && (
            <p className="text-sm text-red-600 mt-1">{errors.username}</p>
          )}
        </div>

        {/* PIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="pin"
            value={formData.pin}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.pin ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            placeholder="6-digit PIN"
            maxLength={6}
            inputMode="numeric"
            style={{ fontSize: '14px' }}
          />
          {errors.pin && (
            <p className="text-sm text-red-600 mt-1">{errors.pin}</p>
          )}
        </div>

        {/* Confirm PIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPin"
            value={formData.confirmPin}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-2 border transition-all duration-200 ${
              errors.confirmPin ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            } focus:ring-2 focus:outline-none placeholder:text-gray-400 bg-white hover:border-gray-400`}
            placeholder="Confirm 6-digit PIN"
            maxLength={6}
            inputMode="numeric"
            style={{ fontSize: '14px' }}
          />
          {errors.confirmPin && (
            <p className="text-sm text-red-600 mt-1">{errors.confirmPin}</p>
          )}
        </div>
      </div>
    </div>
  )

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentStep === 4) {
      onSubmit(e)
    } else {
      onNext()
    }
  }

  return (
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto ${className}`}>
      {/* Logo */}
      {showLogo && (
        <div className="flex justify-center mb-3 sm:mb-4">
          <img
            src="/images/barangay_logo.png"
            alt="Barangay Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{stepTitle}</h2>
        <div className="flex items-center justify-center space-x-2 px-2">
          <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Step {currentStep} of 4</span>
          <div className="flex-1 max-w-24 sm:max-w-32 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors min-h-[44px] sm:min-h-[36px]"
              disabled={isLoading}
            >
              Back
            </button>
          ) : (
            <div className="hidden sm:block sm:flex-1"></div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-[36px]"
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : currentStep === 4 ? (
              <>
                <span className="hidden sm:inline">Complete Registration</span>
                <span className="sm:hidden">Register</span>
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
