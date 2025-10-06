import React from 'react'
import Modal from '../../common/Modal'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'
import ApiClient from '../../../lib/apiClient'
import SMSTargetSection from './SMSTargetSection'

export default function AnnouncementDetailView({ open, onClose, announcement, onUpdate, onToast }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({})
  const [errors, setErrors] = React.useState({})
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showPublishModal, setShowPublishModal] = React.useState(false)
  const [smsStatus, setSmsStatus] = React.useState(null) // { total: 0, sent: 0, failed: 0 }

  // Load announcement data when panel opens
  React.useEffect(() => {
    if (open && announcement) {
      // Determine status based on published_at field
      const status = announcement.published_at ? 'published' : 'draft'
      
      // Use SMS target groups directly from API response (backend already converts target_type/target_value)
      const smsTargetGroups = announcement.sms_target_groups || []
      const isSmsEnabled = smsTargetGroups.length > 0 // SMS enabled if there are target groups
      
      // Debug logging
      console.log('Loading announcement for edit:', {
        announcement,
        target_type: announcement.target_type,
        target_value: announcement.target_value,
        sms_target_groups: announcement.sms_target_groups,
        isSmsEnabled,
        smsTargetGroups
      })
      
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 1,
        is_urgent: announcement.is_urgent || false,
        target_groups: announcement.target_groups || ['all'],
        sms_target_groups: smsTargetGroups,
        send_sms: isSmsEnabled,
        status: status
      })
      setIsEditing(false)
      setErrors({})
      setSmsStatus(null) // Reset SMS status when loading new announcement
    }
  }, [open, announcement])

  // Fetch SMS status for published announcements with SMS enabled
  React.useEffect(() => {
    const fetchSmsStatus = async () => {
      if (open && announcement && announcement.published_at && 
          announcement.target_type !== null) {
        try {
          const smsResponse = await ApiClient.request(`/announcements/${announcement.id}/sms-status`)
          if (smsResponse.success && smsResponse.data) {
            setSmsStatus({
              total: smsResponse.data.total_recipients || 0,
              sent: smsResponse.data.successful_sends || 0,
              failed: smsResponse.data.failed_sends || 0
            })
          }
        } catch (smsError) {
          console.error('Error fetching SMS status on load:', smsError)
        }
      }
    }
    
    fetchSmsStatus()
  }, [open, announcement])

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

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.trim().length < 30) {
      newErrors.content = 'Content must be at least 30 characters'
    } else if (formData.content.length > 1000) {
      newErrors.content = 'Content must be 1000 characters or less'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    // SMS Target Group Validation - Only if SMS is enabled
    if (formData.send_sms && (!formData.sms_target_groups || formData.sms_target_groups.length === 0)) {
      newErrors.smsTargets = 'Please select at least one target group for SMS notifications'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !announcement?.id) {
      return // Just return without toast - validation errors are shown inline
    }

    setIsSaving(true)
    try {
      // Ensure target_groups is always set to 'all'
      const updateData = {
        title: formData.title,
        content: formData.content,
        type: parseInt(formData.type) || 1,
        target_groups: ['all'],
        sms_target_groups: formData.send_sms ? (formData.sms_target_groups || []) : [],
        send_sms: formData.send_sms || false,
        status: 'draft' // Use 'draft' instead of 'unpublished'
      }

      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      if (response.success) {
        onToast?.('Announcement updated successfully', 'success')
        setIsEditing(false)
        onUpdate()
      } else {
        console.error('Update failed:', response)
        onToast?.(response.error || 'Failed to update announcement', 'error')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      onToast?.('Failed to update announcement', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!announcement?.id) {
      onToast?.('No announcement selected', 'error')
      return
    }
    
    setIsPublishing(true)
    setSmsStatus(null) // Reset SMS status
    
    try {
      // Ensure target_groups is always set to 'all'
      const publishData = {
        title: formData.title,
        content: formData.content,
        target_groups: ['all'],
        sms_target_groups: formData.sms_target_groups || [],
        status: 'published'
      }

      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify(publishData)
      })

      if (response.success) {
        // If SMS is enabled, fetch SMS status
        if (formData.sms_target_groups && formData.sms_target_groups.length > 0) {
          try {
            const smsResponse = await ApiClient.request(`/announcements/${announcement.id}/sms-status`)
            if (smsResponse.success && smsResponse.data) {
              setSmsStatus({
                total: smsResponse.data.total_recipients || 0,
                sent: smsResponse.data.successful_sends || 0,
                failed: smsResponse.data.failed_sends || 0
              })
            }
          } catch (smsError) {
            console.error('Error fetching SMS status:', smsError)
          }
          onToast?.('Announcement published and SMS notifications sent!', 'success')
        } else {
          onToast?.('Announcement published successfully', 'success')
        }
        
        setShowPublishModal(false)
        onUpdate()
      } else {
        console.error('Publish failed:', response)
        onToast?.(response.error || 'Failed to publish announcement', 'error')
      }
    } catch (error) {
      console.error('Error publishing announcement:', error)
      onToast?.('Failed to publish announcement', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!announcement?.id) return

    try {
      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        onToast?.('Announcement deleted successfully', 'success')
        setShowDeleteModal(false)
        onClose()
        onUpdate()
      } else {
        onToast?.(response.error || 'Failed to delete announcement', 'error')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      onToast?.('Failed to delete announcement', 'error')
    }
  }

  const handleTargetGroupChange = (e) => {
    const { value, checked } = e.target
    
    if (value === 'all') {
      setFormData(prev => ({
        ...prev,
        target_groups: checked ? ['all'] : []
      }))
    } else {
      setFormData(prev => {
        let newGroups = [...prev.target_groups.filter(g => g !== 'all')]
        
        if (checked) {
          newGroups.push(value)
        } else {
          newGroups = newGroups.filter(g => g !== value)
        }
        
        return { ...prev, target_groups: newGroups.length === 0 ? ['all'] : newGroups }
      })
    }
  }

  const handleSMSTargetChange = (newTargetGroups) => {
    setFormData(prev => ({ ...prev, sms_target_groups: newTargetGroups }))
  }

  const handleSendSMSChange = (sendSMS) => {
    setFormData(prev => ({ 
      ...prev, 
      send_sms: sendSMS,
      sms_target_groups: sendSMS ? (prev.sms_target_groups || []) : []
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Default values for when announcement is null
  const announcementData = announcement || {
    title: '',
    content: '',
    status: 'unpublished',
    is_urgent: false,
    type: 1,
    target_groups: ['all'],
    sms_target_groups: [],
    created_at: null,
    created_by: null,
    published_at: null,
    published_by: null
  }
  
  const isPublished = announcementData.status === 'published'

  // Get announcement type name
  const getTypeName = (typeId) => {
    return ANNOUNCEMENT_TYPE_NAMES[typeId] || 'General'
  }

  // Get type badge color
  const getTypeBadgeColor = (typeId) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800 border-blue-200',      // General
      2: 'bg-green-100 text-green-800 border-green-200',   // Health
      3: 'bg-purple-100 text-purple-800 border-purple-200', // Activities
      4: 'bg-orange-100 text-orange-800 border-orange-200', // Assistance
      5: 'bg-yellow-100 text-yellow-800 border-yellow-200'  // Advisory
    }
    return colors[typeId] || colors[1]
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal={open ? "true" : "false"}
      aria-hidden={!open}
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={open ? onClose : undefined}
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
        className={`relative ml-auto h-full w-full sm:w-[520px] lg:w-[650px] xl:w-[750px] bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
      >
        {/* Panel Header */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">
              {isEditing ? 'Edit Announcement' : 'Announcement Details'}
            </div>
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {!isEditing ? (
              // View Mode - Blog Article Style
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Article Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">
                      {announcementData.title}
                    </h1>
                    {!isPublished && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 focus:ring-2 focus:ring-orange-500 transition-colors cursor-pointer text-sm font-medium"
                          title="Edit"
                        >
                          <i className="bi bi-pencil text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer text-sm font-medium"
                          title="Delete"
                        >
                          <i className="bi bi-trash text-xs" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    {isPublished ? (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        <i className="bi bi-check-circle-fill mr-1.5" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                        <i className="bi bi-pencil-fill mr-1.5" />
                        Unpublished
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3">
                    {/* First Row - Created and Published */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <i className="bi bi-calendar3 text-gray-400" />
                        <span className="text-xs">Created: {formatDate(announcementData.created_at)}</span>
                        {announcementData.created_by && (
                          <span className="text-xs text-gray-500">by {announcementData.created_by}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {announcementData.published_at ? (
                          <>
                            <i className="bi bi-send-check text-gray-400" />
                            <span className="text-xs">Published: {formatDate(announcementData.published_at)}</span>
                            {announcementData.published_by && (
                              <span className="text-xs text-gray-500">by {announcementData.published_by}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clock text-gray-400" />
                            <span className="text-xs text-gray-500">Unpublished</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Second Row - SMS and Type in 2 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {/* SMS Notification Status */}
                      <div className="flex items-center gap-1.5 text-left">
                        {announcementData.target_type !== null && announcementData.sms_target_groups && announcementData.sms_target_groups.length > 0 ? (
                          <>
                            <i className="bi bi-phone-vibrate text-amber-600" />
                            <span className="text-xs">
                              {announcementData.status === 'published' ? 'SMS sent to:' : 'SMS will be sent to:'}
                            </span>
                            <div className="flex gap-1">
                              {announcementData.sms_target_groups.length <= 2 ? (
                                // Show all groups if 2 or fewer
                                announcementData.sms_target_groups.map((group, index) => (
                                  <span key={index} className="text-xs text-amber-700 font-medium">
                                    {group === 'all' ? 'All Residents' : 
                                     group === 'special_category:PWD' ? 'PWD' :
                                     group === 'special_category:SENIOR_CITIZEN' ? 'Senior Citizens' :
                                     group === 'special_category:SOLO_PARENT' ? 'Solo Parents' :
                                     group === 'special_category:INDIGENT' ? 'Indigent Families' :
                                     group}
                                    {index < announcementData.sms_target_groups.length - 1 && ', '}
                                  </span>
                                ))
                              ) : (
                                // Show count if 3 or more
                                <span className="text-xs text-amber-700 font-medium">
                                  {announcementData.sms_target_groups.length} groups
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-telephone-x text-gray-400" />
                            <span className="text-xs text-gray-500">No SMS notifications</span>
                          </>
                        )}
                      </div>

                      {/* Announcement Type */}
                      <div className="flex items-center gap-1.5 text-left">
                        <i className="bi bi-tag text-gray-400" />
                        <span className="text-xs">Type:</span>
                        <span className="text-xs text-blue-700 font-medium">{getTypeName(announcementData.type)}</span>
                        {announcementData.is_urgent && (
                          <>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-red-700 font-medium">
                              <i className="bi bi-exclamation-triangle-fill mr-1" />
                              Urgent
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="px-6 py-5">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {announcementData.content}
                    </div>
                  </div>
                </div>

                {/* Article Footer - SMS Delivery Status (only when available) */}
                {smsStatus && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">SMS Delivery Status</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Recipients:</span>
                          <span className="font-medium text-gray-800">{smsStatus.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Successfully Sent:</span>
                          <span className="font-medium text-green-600">{smsStatus.sent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Failed:</span>
                          <span className="font-medium text-red-600">{smsStatus.failed}</span>
                        </div>
                        {smsStatus.total > 0 && (
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="text-gray-600">Success Rate:</span>
                            <span className="font-medium text-gray-800">{((smsStatus.sent / smsStatus.total) * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  {/* Form Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm">
                        <i className="bi bi-pencil" />
                      </div>
                      <div>
                        <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                          Edit Announcement
                        </h1>
                        <p className="text-xs text-gray-500">Update announcement information</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="space-y-4">
                    {/* Title Field */}
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors h-9 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter announcement title"
                      />
                      {errors.title && (
                        <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                      )}
                    </div>

                    {/* Content Field */}
                    <div>
                      <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="edit-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors resize-none ${
                          errors.content ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter announcement content"
                      />
                      {errors.content && (
                        <p className="text-xs text-red-600 mt-1">{errors.content}</p>
                      )}
                    </div>

                    {/* Type Field */}
                    <div>
                      <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="edit-type"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                          className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8 ${
                            errors.type 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
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

                    {/* Target Groups - FYI Only */}
                    {/* Target Groups - FYI Only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visibility
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <i className="bi bi-info-circle text-blue-600 mt-0.5"></i>
                          <div>
                            <p className="text-sm text-blue-900 font-medium">All Residents</p>
                            <p className="text-xs text-blue-700 mt-1">
                              All announcements are visible to all residents by default. This ensures important information reaches everyone in the barangay.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>                    {/* SMS Notifications */}
                    <SMSTargetSection
                      sendSMS={formData.send_sms || false}
                      targetGroups={formData.sms_target_groups || []}
                      onSendSMSChange={handleSendSMSChange}
                      onTargetGroupsChange={handleSMSTargetChange}
                      hasError={!!errors.smsTargets}
                    />
                    {errors.smsTargets && (
                      <p className="text-xs text-red-600 mt-1">{errors.smsTargets}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
          {!isEditing ? (
            // View Mode Buttons
            <>
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => setShowPublishModal(true)}
                  disabled={isPublishing}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-3 h-3 mr-2">
                        <div className="w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send mr-1" />
                      Publish Now
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            // Edit Mode Buttons
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    title: announcementData.title || '',
                    content: announcementData.content || '',
                    is_urgent: announcementData.is_urgent || false,
                    target_groups: announcementData.target_groups || ['all'],
                    sms_target_groups: announcementData.sms_target_groups || [],
                    status: announcementData.status || 'unpublished'
                  })
                  setErrors({})
                }}
                disabled={isSaving}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <i className="bi bi-arrow-clockwise animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Announcement"
        type="confirm"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        confirmButtonClass="text-white bg-red-600 hover:bg-red-700"
      >
        <p className="text-gray-700">Are you sure you want to delete?</p>
      </Modal>

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Announcement"
        type="confirm"
        confirmText={isPublishing ? "Publishing..." : "Yes, Publish"}
        cancelText="Cancel"
        onConfirm={handlePublish}
        confirmButtonClass="text-white bg-green-600 hover:bg-green-700"
        confirmDisabled={isPublishing}
      >
        <div className="space-y-3">
          <p className="text-gray-700">Are you sure you want to publish this announcement?</p>
          
          {formData.sms_target_groups && formData.sms_target_groups.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <i className="bi bi-phone-vibrate text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">SMS notifications will be sent to:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.sms_target_groups.map((group, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800">
                        {group === 'all' ? 'All Residents' : 
                         group === 'special_category:PWD' ? 'PWD' :
                         group === 'special_category:SENIOR_CITIZEN' ? 'Senior Citizens' :
                         group === 'special_category:SOLO_PARENT' ? 'Solo Parents' :
                         group === 'special_category:INDIGENT' ? 'Indigent Families' :
                         group}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600">Once published, this announcement will be visible to residents and cannot be edited.</p>
        </div>
      </Modal>
    </div>
  )
}
