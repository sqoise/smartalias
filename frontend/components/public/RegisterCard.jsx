'use client'

import Link from 'next/link'
import Spinner from '../common/Spinner'
import CustomSelect from '../common/CustomSelect'

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
  className = '',
  specialCategories = [],
  isLoadingCategories = false
}) {
  
  // Step 1: Name Fields
  const renderStep1 = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Last Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="Enter first name"
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
            name="middleName"
            value={formData.middleName}
            onChange={onInputChange}
            className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 transition-all duration-200 h-9"
            placeholder="Enter middle name"
          />
          {errors.middleName && (
            <p className="text-xs text-red-600 mt-1">{errors.middleName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Suffix */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Suffix <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <CustomSelect
              value={formData.suffix}
              onChange={(value) => onInputChange({ target: { name: 'suffix', value } })}
              options={[
                { value: '', label: 'Select' },
                { value: '1', label: 'Jr.' },
                { value: '2', label: 'Sr.' },
                { value: '3', label: 'II' },
                { value: '4', label: 'III' },
                { value: '5', label: 'IV' },
                { value: '6', label: 'V' }
              ]}
              placeholder="Select"
              title="Select Suffix"
              focusColor="green"
              className="h-9"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Step 2: Personal Information
  const renderStep2 = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Birth Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={onInputChange}
            min={(() => {
              // Maximum 200 years old
              const today = new Date()
              const maxAge = new Date()
              maxAge.setFullYear(today.getFullYear() - 200)
              const year = maxAge.getFullYear()
              const month = String(maxAge.getMonth() + 1).padStart(2, '0')
              const day = String(maxAge.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })()}
            max={(() => {
              // Minimum 12 years old
              const today = new Date()
              const minAge = new Date()
              minAge.setFullYear(today.getFullYear() - 12)
              const year = minAge.getFullYear()
              const month = String(minAge.getMonth() + 1).padStart(2, '0')
              const day = String(minAge.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })()}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.birthDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none bg-white hover:border-gray-400 h-9`}
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
          <CustomSelect
            value={formData.gender}
            onChange={(value) => onInputChange({ target: { name: 'gender', value } })}
            options={[
              { value: '1', label: 'Male' },
              { value: '2', label: 'Female' }
            ]}
            placeholder="Select Gender"
            title="Gender"
            error={errors.gender}
          />
          {errors.gender && (
            <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
          )}
        </div>

        {/* Civil Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Civil Status <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.civilStatus}
            onChange={(value) => onInputChange({ target: { name: 'civilStatus', value } })}
            options={[
              { value: 'Single', label: 'Single' },
              { value: 'Married', label: 'Married' },
              { value: 'Widowed', label: 'Widowed' },
              { value: 'Separated', label: 'Separated' }
            ]}
            placeholder="Select Civil Status"
            title="Civil Status"
            error={errors.civilStatus}
          />
          {errors.civilStatus && (
            <p className="text-xs text-red-600 mt-1">{errors.civilStatus}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email Address <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="name@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
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
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="09XX XXX XXXX"
            inputMode="numeric"
            maxLength={11}
          />
          {errors.mobileNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
          )}
        </div>
      </div>

      <div>
        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="Complete address"
          />
          {errors.address && (
            <p className="text-xs text-red-600 mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  )

  // Step 3: Additional Information
  const renderStep3 = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Purok */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Purok <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.purok}
            onChange={(value) => onInputChange({ target: { name: 'purok', value } })}
            options={[
              { value: '1', label: 'Purok 1' },
              { value: '2', label: 'Purok 2' },
              { value: '3', label: 'Purok 3' },
              { value: '4', label: 'Purok 4' },
              { value: '5', label: 'Purok 5' },
              { value: '6', label: 'Purok 6' },
              { value: '7', label: 'Purok 7' }
            ]}
            placeholder="Select Purok"
            title="Purok"
            error={errors.purok}
          />
          {errors.purok && (
            <p className="text-xs text-red-600 mt-1">{errors.purok}</p>
          )}
        </div>

        {/* Religion */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Religion <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.religion}
            onChange={(value) => onInputChange({ target: { name: 'religion', value } })}
            options={[
              { value: 'ROMAN_CATHOLIC', label: 'Roman Catholic' },
              { value: 'PROTESTANT', label: 'Protestant' },
              { value: 'IGLESIA_NI_CRISTO', label: 'Iglesia ni Cristo' },
              { value: 'ISLAM', label: 'Islam' },
              { value: 'OTHERS', label: 'Others' }
            ]}
            placeholder="Select Religion"
            title="Religion"
            error={errors.religion}
          />
          {errors.religion && (
            <p className="text-xs text-red-600 mt-1">{errors.religion}</p>
          )}
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Occupation <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.occupation}
            onChange={(value) => onInputChange({ target: { name: 'occupation', value } })}
            options={[
              { value: 'EMPLOYED', label: 'Employed' },
              { value: 'SELF_EMPLOYED', label: 'Self-employed' },
              { value: 'UNEMPLOYED', label: 'Unemployed' },
              { value: 'RETIRED', label: 'Retired' },
              { value: 'OTHERS', label: 'Others' }
            ]}
            placeholder="Select Occupation"
            title="Occupation"
            error={errors.occupation}
          />
          {errors.occupation && (
            <p className="text-xs text-red-600 mt-1">{errors.occupation}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Special Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Special Category <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <CustomSelect
            value={formData.specialCategory}
            onChange={(value) => onInputChange({ target: { name: 'specialCategory', value } })}
            options={[
              { value: '', label: 'Not Applicable' },
              ...(isLoadingCategories ? 
                [{ value: '', label: 'Loading categories...', disabled: true }] :
                specialCategories.map(category => ({
                  value: category.category_code,
                  label: category.category_name
                }))
              )
            ]}
            placeholder="Select Special Category"
            title="Special Category"
            error={errors.specialCategory}
            disabled={isLoadingCategories}
          />
          {errors.specialCategory && (
            <p className="text-xs text-red-600 mt-1">{errors.specialCategory}</p>
          )}
        </div>


      </div>
    </div>
  )

  // Step 4: Account Information
  const renderStep4 = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {/* Document Upload */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Proof of Residency Document <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              name="documentImage"
              onChange={onInputChange}
              accept="image/jpeg,image/jpg,image/png"
              className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
                errors.documentImage ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } focus:ring-1 focus:outline-none bg-white hover:border-gray-400 h-9 cursor-pointer file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="bi bi-upload text-gray-400 text-xs"></i>
            </div>
          </div>
          {errors.documentImage ? (
            <p className="text-xs text-red-600 mt-1">{errors.documentImage}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Upload a clear photo of your Valid ID, proof of residency such as (Electricity Bill, Voter Registration Card, Internet Bill, Car Registration, Proof of Address, Student ID, Bank Statement, Etc.,) - JPEG, JPG, PNG only, max 3MB
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="firstname.lastname"
          />
          {errors.username ? (
            <p className="text-xs text-red-600 mt-1">{errors.username}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Format: name.name (lowercase letters and numbers only)</p>
          )}
        </div>

        {/* PIN */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="pin"
            value={formData.pin}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.pin ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="6-digit PIN"
            maxLength={6}
            inputMode="numeric"
          />
          {errors.pin && (
            <p className="text-xs text-red-600 mt-1">{errors.pin}</p>
          )}
        </div>

        {/* Confirm PIN */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Confirm PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPin"
            value={formData.confirmPin}
            onChange={onInputChange}
            className={`w-full rounded-md px-3 py-1.5 text-sm border transition-all duration-200 ${
              errors.confirmPin ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } focus:ring-1 focus:outline-none placeholder:text-sm placeholder:text-gray-400 bg-white hover:border-gray-400 h-9`}
            placeholder="Confirm 6-digit PIN"
            maxLength={6}
            inputMode="numeric"
          />
          {errors.confirmPin && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPin}</p>
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
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto ${className}`}>
      {/* Logo */}
      {showLogo && (
        <div className="flex justify-center mb-1 sm:mb-2">
          <img
            src="/images/barangay_logo.png"
            alt="Barangay Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-2 sm:mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{stepTitle}</h2>
        <div className="flex items-center justify-center space-x-2 px-2">
          <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Step {currentStep} of 4</span>
          <div className="flex-1 max-w-24 sm:max-w-32 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Step Content */}
        <div>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors min-h-[40px] sm:min-h-[36px]"
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
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[40px] sm:min-h-[36px]"
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : currentStep === 4 ? (
              <>
                <span>Complete Registration</span>
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-3 text-center">
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
