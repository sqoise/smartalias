import React from 'react'
import ToastNotification from '../../common/ToastNotification'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'
import ApiClient from '../../../lib/apiClient'
import SMSTargetSection from './SMSTargetSection'

export default function AddAnnouncementView({ open, onClose, onSubmit, loading = false }) {
  const toastRef = React.useRef()
  const titleInputRef = React.useRef()
  const STORAGE_KEY = 'smartlias_add_announcement_draft'
  
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    type: '',
    visibility: 'all_residents',
    targetGroups: [], // Default to no selection - user must choose
    sendSMS: false  // Whether to send SMS notifications
  })

  const [errors, setErrors] = React.useState({})
  const [isDraft, setIsDraft] = React.useState(false)

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
      
      // Focus on title input when panel opens
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 300) // Delay to allow panel animation to complete
    }
  }, [open])

  // Reset form to default state when panel closes (unless draft is saved)
  React.useEffect(() => {
    if (!open) {
      // Only reset if no draft is saved in localStorage
      const savedDraft = localStorage.getItem(STORAGE_KEY)
      if (!savedDraft) {
        setFormData({
          title: '',
          content: '',
          type: '',
          visibility: 'all_residents',
          targetGroups: [],
          sendSMS: false  // Reset SMS toggle to default OFF
        })
        setErrors({})
        setIsDraft(false)
      }
    }
  }, [open])

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    if (open) {
      const hasData = formData.title || formData.content || formData.type
      if (hasData) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        } catch (error) {
          console.error('Failed to save draft:', error)
        }
      }
    }
  }, [formData, open])

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

  const clearDraft = () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
    
    // Reset form data
    setFormData({
      title: '',
      content: '',
      type: '',
      visibility: 'all_residents',
      targetGroups: [], // Reset to no selection
      sendSMS: false
    })
    setErrors({})
    setIsDraft(false)
    
    // Focus title input
    setTimeout(() => {
      titleInputRef.current?.focus()
    }, 100)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.trim().length < 30) {
      newErrors.content = 'Content must be at least 30 characters'
    } else if (formData.content.length > 1000) {
      newErrors.content = 'Content must be 1000 characters or less'
    } else if (formData.content.toLowerCase().includes('test')) {
      newErrors.content = 'Content cannot contain the word "TEST" as it may be blocked by SMS providers'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    // SMS Target Group Validation - Only if SMS is enabled
    if (formData.sendSMS && (!formData.targetGroups || formData.targetGroups.length === 0)) {
      newErrors.smsTargets = 'Please select at least one target group for SMS notifications'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const response = await ApiClient.createAnnouncement({
        title: formData.title,
        content: formData.content,
        type: parseInt(formData.type) || 1,
        status: 'unpublished',
        target_groups: formData.sendSMS ? formData.targetGroups : ['all'],
        sms_target_groups: formData.sendSMS ? formData.targetGroups : []
      })

      if (response.success) {
        toastRef.current?.show('Announcement saved successfully', 'success')
        
        // Clear draft from localStorage after successful submission
        try {
          localStorage.removeItem(STORAGE_KEY)
          setIsDraft(false)
        } catch (error) {
          console.error('Failed to clear draft:', error)
        }
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          type: '',
          visibility: 'all_residents',
          targetGroups: [], // Reset to no selection
          sendSMS: false
        })
        setErrors({})
        
        // Close panel and call onSubmit callback
        onClose()
        if (onSubmit) {
          onSubmit(response.data)
        }
      } else {
        // Show the actual error from the backend
        const errorMessage = response.error || response.message || 'Failed to publish announcement. Please try again.'
        toastRef.current?.show(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error publishing announcement:', error)
      if (error.message && error.message.includes('timeout')) {
        toastRef.current?.show('Request timeout. Please try again.', 'error')
      } else if (error.message && error.message.includes('Failed to fetch')) {
        toastRef.current?.show('Backend server is not running. Please start the server and try again.', 'error')
      } else {
        toastRef.current?.show('Network error. Please check your connection and try again.', 'error')
      }
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-modal={open ? "true" : "false"}
      aria-hidden={!open}
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={open && !loading ? onClose : undefined}
      >
        {/* Floating Close Button next to Panel */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!loading) onClose();
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
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">
              Create Announcement
            </div>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-2">
            {/* Blog Article Style Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">
                      <i className="bi bi-plus-lg" />
                    </div>
                    <div>
                      <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                        New Announcement
                      </h1>
                                      <p className="text-xs text-gray-500">Create announcements for residents</p>

                    </div>
                  </div>
                  
                  {/* Right Side - Status Badge and Clear Draft Button */}
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                      <i className={`mr-1.5 ${
                        isDraft ? 'bi bi-file-earmark-check' : 'bi bi-file-earmark-plus'
                      }`} />
                      {isDraft ? 'Draft Saved' : 'Unpublished'}
                    </span>
                    
                    {/* Clear Draft Button */}
                    {isDraft && (
                      <button
                        onClick={clearDraft}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Clear all form data"
                      >
                        <i className="bi bi-trash mr-1"></i>
                        Clear Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 py-5">
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 ${
                        errors.title 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      placeholder="Enter announcement title"
                      disabled={loading}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Content Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${
                        formData.content.length > 1000 ? 'text-red-600' : 
                        formData.content.length > 900 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {formData.content.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      maxLength={1000}
                      rows={8}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors resize-none ${
                        errors.content ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Write your announcement content here..."
                      disabled={loading}
                    />
                    {errors.content && (
                      <p className="text-xs text-red-600 mt-1">{errors.content}</p>
                    )}
                  </div>

                  {/* Type Field */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8 ${
                          errors.type 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        {Object.entries(ANNOUNCEMENT_TYPE_NAMES).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                    </div>
                    {errors.type && (
                      <p className="text-xs text-red-600 mt-1">{errors.type}</p>
                    )}
                  </div>

                  {/* Divider - Spans full width */}
                  <div className="col-span-full">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                      </div>
                    </div>
                  </div>

                  {/* SMS Target Section */}
                  <div className="col-span-full">
                    <SMSTargetSection
                      sendSMS={formData.sendSMS}
                      targetGroups={formData.targetGroups}
                      onSendSMSChange={(value) => handleChange('sendSMS', value)}
                      onTargetGroupsChange={(value) => handleChange('targetGroups', value)}
                      disabled={loading}
                      hasError={!!errors.smsTargets}
                    />
                    {errors.smsTargets && (
                      <p className="text-xs text-red-600 mt-2">{errors.smsTargets}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Footer - Visibility Info */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {formData.sendSMS 
                    ? `This announcement will be visible to all residents and SMS notifications will be sent to ${
                        formData.targetGroups.includes('all') 
                          ? 'all residents with mobile numbers' 
                          : `${formData.targetGroups.length} selected group(s)`
                      } when published.`
                    : 'This announcement will be visible to all residents when published. No SMS notifications will be sent.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom outside scrollable area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin mr-1" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check mr-1 text-lg" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      <ToastNotification ref={toastRef} />
    </div>
  )
}
