'use client'

import React, { useState, useEffect } from 'react'
import SlidePanel from '../../common/SlidePanel'
import CustomSelect from '../../common/CustomSelect'
import Modal from '../../common/Modal'
import { PURPOSES, getPurposeOptions } from '../../../lib/constants'
import { ApiClient } from '../../../lib/apiClient'
import { hasDetailFields, getDetailFields, validateDetails, validateDetailField, validateNotesField } from '../../../lib/documentDetails'

export default function DocumentRequestForm({ 
  isOpen = false,
  onClose,
  document = null,
  onSubmit,
  toastRef
}) {
  const [formData, setFormData] = useState({
    purpose: '',
    notes: '',
    details: {}
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)



    // Reset form when document changes or modal opens
  useEffect(() => {
    if (isOpen && document) {
      setLoading(true)
      setFormData({
        purpose: '',
        notes: '',
        details: {}
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

    // Validate notes field format at submit time
    if (formData.notes.trim()) {
      const notesValidation = validateNotesField(formData.notes)
      if (!notesValidation.isValid) {
        newErrors.notes = notesValidation.message
      }
    }

    // Additional validation for indigency certificates
    if (document?.title?.includes('Indigency')) {
      if (!formData.notes.trim()) {
        newErrors.notes = 'Please provide details about your situation'
      }
    }

    // Validate details fields if document requires them
    if (document?.title && hasDetailFields(document.title)) {
      const detailsValidation = validateDetails(document.title, formData.details)
      if (!detailsValidation.isValid) {
        Object.assign(newErrors, detailsValidation.errors)
      }
      
      // Additional format validation for specific fields
      Object.entries(formData.details).forEach(([fieldName, value]) => {
        if (value && value.trim()) {
          const fieldValidation = validateDetailField(fieldName, value)
          if (!fieldValidation.isValid) {
            newErrors[fieldName] = fieldValidation.message
          }
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle notes input - no validation, just update state
  const handleNotesChange = (e) => {
    const value = e.target.value
    setFormData({ ...formData, notes: value })
  }

  // Handle details field changes - no validation, just update state
  const handleDetailChange = (fieldName, value) => {
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        [fieldName]: value
      }
    })
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
        notes: formData.notes.trim() || null,
        details: Object.keys(formData.details).length > 0 ? formData.details : null
      })

      // Reset form and close
      setFormData({
        purpose: '',
        notes: '',
        details: {}
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
        showFooter={true}
        cancelText="Cancel"
        confirmText="Submit Request"
        confirmIcon="bi-check"
        onConfirm={handleSubmit}
        confirmDisabled={isSubmitting}
        confirmLoading={isSubmitting}
        confirmLoadingText="Submitting..."
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

              {/* Additional Details Fields (Business Permit & Barangay Clearance only) */}
              {document?.title && hasDetailFields(document.title) && (
                <div>
                  <div className="space-y-4">
                    {Object.entries(getDetailFields(document.title)).map(([fieldName, fieldConfig]) => (
                      <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {fieldConfig.label}
                          {fieldConfig.required && <span className="text-red-500"> *</span>}
                        </label>
                        {fieldConfig.type === 'textarea' ? (
                          <textarea
                            value={formData.details[fieldName] || ''}
                            onChange={(e) => handleDetailChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            rows={3}
                            className={`w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors min-h-[44px] ${
                              errors[fieldName] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            style={{ fontSize: '16px' }}
                          />
                        ) : (
                          <input
                            type={fieldConfig.type}
                            value={formData.details[fieldName] || ''}
                            onChange={(e) => handleDetailChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            className={`w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[44px] ${
                              errors[fieldName] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            style={{ fontSize: '16px' }}
                          />
                        )}
                        {errors[fieldName] && (
                          <p className="text-xs text-red-600 mt-1">{errors[fieldName]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              {/* Show detail fields inline */}
              {Object.entries(formData.details).map(([key, value]) => {
                const fieldConfig = getDetailFields(document.title)[key]
                return value && (
                  <div key={key}>
                    <strong>{fieldConfig?.label || key}:</strong> {value}
                  </div>
                )
              })}
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
