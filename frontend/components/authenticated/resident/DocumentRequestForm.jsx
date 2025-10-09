'use client'

import React, { useState, useEffect } from 'react'
import SlidePanel from '../../common/SlidePanel'
import CustomSelect from '../../common/CustomSelect'
import Modal from '../../common/Modal'
import { PURPOSES } from '../../../lib/constants'
import { ApiClient } from '../../../lib/apiClient'

export default function DocumentRequestForm({ 
  isOpen = false,
  onClose,
  document = null,
  onSubmit,
  toastRef
}) {
  const [formData, setFormData] = useState({
    purpose: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Purpose options based on document type
  const getPurposeOptions = (documentType) => {
    const purposes = {
      'Electrical Permit': [
        'Home renovation',
        'New electrical installation',
        'Electrical repair',
        'Business establishment'
      ],
      'Fence Permit': [
        'Property boundary',
        'Security purposes',
        'Privacy fence',
        'Property development'
      ],
      'Excavation Permit': [
        'Foundation construction',
        'Utility installation',
        'Landscaping project',
        'Property development'
      ],
      'Barangay Clearance': [
        'Employment requirement',
        'Travel abroad',
        'Bank loan application',
        'Business permit',
        'School enrollment',
        'Government transaction'
      ],
      'Certificate of Residency': [
        'School enrollment',
        'Employment requirement',
        'Government transaction',
        'Bank application'
      ],
      'Certificate of Good Moral': [
        'Employment requirement',
        'School application',
        'Character reference',
        'Legal purposes'
      ],
      'Certificate of Indigency (Medical)': [
        'Medical assistance',
        'Hospital bills',
        'Medicine assistance',
        'Health services'
      ],
      'Certificate of Indigency (Financial)': [
        'Financial assistance',
        'Educational support',
        'Emergency aid',
        'Social services'
      ],
      'Business Permit Clearance': [
        'New business',
        'Business renewal',
        'Business expansion',
        'Franchise application'
      ]
    }
    
    const purposeList = purposes[documentType] || ['General purpose']
    
    // Convert to options format for CustomSelect
    const options = purposeList.map(purpose => ({
      value: purpose,
      label: purpose
    }))
    
    // Add "Other" option
    options.push({
      value: 'Other',
      label: 'Other (specify in notes)'
    })
    
    return options
  }

    // Reset form when document changes or modal opens
  useEffect(() => {
    if (isOpen && document) {
      setLoading(true)
      setFormData({
        purpose: '',
        notes: ''
      })
      setErrors({})
      
      // Simulate loading time for form initialization
      const timer = setTimeout(() => {
        setLoading(false)
      }, 600)
      
      return () => clearTimeout(timer)
    } else if (!isOpen) {
      setLoading(false)
    }
  }, [isOpen, document])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required'
    }

    // Validate notes field for alphanumeric characters only
    if (formData.notes.trim()) {
      const alphanumericRegex = /^[a-zA-Z0-9\s.,!?()-]+$/
      if (!alphanumericRegex.test(formData.notes.trim())) {
        newErrors.notes = 'Notes can only contain letters, numbers, spaces, and basic punctuation (.,!?()-)'
      }
    }

    // Additional validation for indigency certificates
    if (document?.title?.includes('Indigency')) {
      if (!formData.notes.trim()) {
        newErrors.notes = 'Please provide details about your situation'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle notes input with alphanumeric validation
  const handleNotesChange = (e) => {
    const value = e.target.value
    // Allow alphanumeric characters, spaces, and basic punctuation
    const filteredValue = value.replace(/[^a-zA-Z0-9\s.,!?()-]/g, '')
    setFormData({ ...formData, notes: filteredValue })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    setShowConfirmModal(false)

    try {
      // Call parent submit handler
      await onSubmit?.({
        document: document,
        purpose: formData.purpose.trim(),
        notes: formData.notes.trim() || null
      })

      // Reset form and close
      setFormData({
        purpose: '',
        notes: ''
      })
      setErrors({})
      onClose?.()

    } catch (error) {
      console.error('Error submitting request:', error)
      // Error is handled by toast in parent component
      // Just re-show the modal for user to try again
      setShowConfirmModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SlidePanel
        open={isOpen && document} // Only open if we have both isOpen and document
        onClose={onClose}
        title="Request Document"
        subtitle=""
        headerIcon=""
        size="md"
        loading={loading}
        footer={
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 mr-2">
                    <div className="w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-check text-md mr-1" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        }
      >
        {document && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
            {/* Document Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                  <i className="bi bi-file-earmark-text text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                  <p className="text-sm text-gray-600">{document.description}</p>
                  {document.fee !== undefined && (
                    <div className="text-sm font-medium text-gray-700 mt-1">
                      Fee: {!document.fee || document.fee === 0 ? 'Free' : `₱${Number(document.fee).toFixed(2)}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Purpose Field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.purpose}
                  onChange={(value) => setFormData({ ...formData, purpose: value })}
                  options={getPurposeOptions(document.title)}
                  placeholder="Select purpose"
                  title="Select Purpose"
                  error={!!errors.purpose}
                />
                {errors.purpose && (
                  <p className="text-xs text-red-600 mt-1">{errors.purpose}</p>
                )}
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                  {document.title?.includes('Indigency') ? (
                    <span className="text-red-500"> *</span>
                  ) : (
                    <span className="text-gray-500"> (Optional)</span>
                  )}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder={
                    document.title?.includes('Indigency') 
                      ? 'Please describe your situation and why you need assistance (letters, numbers, and basic punctuation only)...'
                      : 'Optional: Add any additional information or special requests (letters, numbers, and basic punctuation only)...'
                  }
                  rows={4}
                  className={`w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors min-h-[44px] ${
                    errors.notes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                {errors.notes && (
                  <p className="text-xs text-red-600 mt-1">{errors.notes}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, spaces, and basic punctuation (.,!?()-) are allowed
                </p>
              </div>

              {/* Processing Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="bi bi-info-circle text-blue-600 mt-0.5 text-lg"></i>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">Processing Information:</p>
                    <ul className="space-y-1">
                      <li>• Processing time: 2-3 business days</li>
                      <li>• Payment is made when you pickup the document</li>
                      <li>• You will be notified when ready for collection</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>
        )}
      </SlidePanel>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Request"
        subtitle="Please review your request details"
        size="md"
        type="confirm"
        variant="safe"
        confirmText="Yes, Confirm"
        cancelText="Back"
        confirmLoading={isSubmitting}
        confirmLoadingText="Submitting..."
        onConfirm={handleConfirmSubmit}
      >
        {document && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm space-y-2">
              <div><strong>Document:</strong> {document.title}</div>
              <div><strong>Purpose:</strong> {formData.purpose}</div>
              {formData.notes && (
                <div><strong>Notes:</strong> {formData.notes}</div>
              )}
              {document.fee !== undefined && (
                <div><strong>Fee:</strong> {!document.fee || document.fee === 0 ? 'Free' : `₱${Number(document.fee).toFixed(2)} (Payable on pickup)`}</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
