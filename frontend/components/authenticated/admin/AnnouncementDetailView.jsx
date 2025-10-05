import React from 'react'
import ToastNotification from '../../common/ToastNotification'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'

export default function AnnouncementDetailView({ open, onClose, announcement, onUpdate }) {
  const toastRef = React.useRef()
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({})
  const [errors, setErrors] = React.useState({})
  const [isSaving, setIsSaving] = React.useState(false)

  // Load announcement data when panel opens
  React.useEffect(() => {
    if (open && announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        is_urgent: announcement.is_urgent || false,
        target_groups: announcement.target_groups || ['all'],
        sms_target_groups: announcement.sms_target_groups || [],
        status: announcement.status || 'draft'
      })
      setIsEditing(false)
      setErrors({})
    }
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
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required'
    }

    if (!formData.target_groups || formData.target_groups.length === 0) {
      newErrors.target_groups = 'At least one target group is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !announcement?.id) {
      toastRef.current?.show('Please fix the errors before saving', 'error')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toastRef.current?.show('Announcement updated successfully', 'success')
        setIsEditing(false)
        onUpdate()
      } else {
        toastRef.current?.show(result.message || 'Failed to update announcement', 'error')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toastRef.current?.show('Failed to update announcement', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!announcement?.id) {
      toastRef.current?.show('No announcement selected', 'error')
      return
    }
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          status: 'published'
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (formData.sms_target_groups && formData.sms_target_groups.length > 0) {
          toastRef.current?.show('Announcement published and SMS notifications sent!', 'success')
        } else {
          toastRef.current?.show('Announcement published successfully', 'success')
        }
        onUpdate()
      } else {
        toastRef.current?.show(result.message || 'Failed to publish announcement', 'error')
      }
    } catch (error) {
      console.error('Error publishing announcement:', error)
      toastRef.current?.show('Failed to publish announcement', 'error')
    } finally {
      setIsSaving(false)
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

  const handleSMSTargetChange = (e) => {
    const { value, checked } = e.target
    
    setFormData(prev => {
      let newSMSGroups = [...(prev.sms_target_groups || [])]
      
      if (value === 'all') {
        newSMSGroups = checked ? ['all'] : []
      } else {
        newSMSGroups = newSMSGroups.filter(group => group !== 'all')
        
        if (checked) {
          if (!newSMSGroups.includes(value)) {
            newSMSGroups.push(value)
          }
        } else {
          newSMSGroups = newSMSGroups.filter(group => group !== value)
        }
      }
      
      return { ...prev, sms_target_groups: newSMSGroups }
    })
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
    status: 'draft',
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
        } overflow-hidden`}
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
        <div className="h-full overflow-y-auto pb-12">
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
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9 flex-shrink-0"
                      >
                        <i className="bi bi-pencil mr-1" />
                        Edit
                      </button>
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
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-calendar3 text-gray-400" />
                      <span className="text-xs">Created: {formatDate(announcementData.created_at)}</span>
                      {announcementData.created_by && (
                        <span className="text-xs text-gray-500">by {announcementData.created_by}</span>
                      )}
                    </div>
                    {announcementData.published_at && (
                      <div className="flex items-center gap-1.5">
                        <i className="bi bi-send-check text-gray-400" />
                        <span className="text-xs">Published: {formatDate(announcementData.published_at)}</span>
                        {announcementData.published_by && (
                          <span className="text-xs text-gray-500">by {announcementData.published_by}</span>
                        )}
                      </div>
                    )}
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

                {/* Article Footer - Tags and Categories */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Target Audience */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Audience:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {announcementData.target_groups?.map((group, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
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

                    {/* Announcement Type */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">Type:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${getTypeBadgeColor(announcementData.type)}`}>
                          {getTypeName(announcementData.type)}
                        </span>
                        {announcementData.is_urgent && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-200">
                            <i className="bi bi-exclamation-triangle-fill mr-1" />
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SMS Notifications Info */}
                  {announcementData.sms_target_groups && announcementData.sms_target_groups.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <i className="bi bi-phone-vibrate text-amber-600 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-gray-700">SMS notifications sent to:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {announcementData.sms_target_groups.map((group, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-800 border border-amber-200">
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
                </div>
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
                        Title *
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
                        Content *
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

                    {/* Urgent Flag */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_urgent}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_urgent: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Mark as urgent</span>
                      </label>
                    </div>

                    {/* Target Groups */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visibility *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="all"
                            checked={formData.target_groups?.includes('all')}
                            onChange={handleTargetGroupChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">All Residents</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:PWD"
                            checked={formData.target_groups?.includes('special_category:PWD')}
                            onChange={handleTargetGroupChange}
                            disabled={formData.target_groups?.includes('all')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">PWD</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:SENIOR_CITIZEN"
                            checked={formData.target_groups?.includes('special_category:SENIOR_CITIZEN')}
                            onChange={handleTargetGroupChange}
                            disabled={formData.target_groups?.includes('all')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Senior Citizens</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:SOLO_PARENT"
                            checked={formData.target_groups?.includes('special_category:SOLO_PARENT')}
                            onChange={handleTargetGroupChange}
                            disabled={formData.target_groups?.includes('all')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Solo Parents</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:INDIGENT"
                            checked={formData.target_groups?.includes('special_category:INDIGENT')}
                            onChange={handleTargetGroupChange}
                            disabled={formData.target_groups?.includes('all')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Indigent Families</span>
                        </label>
                      </div>
                      {errors.target_groups && <p className="text-xs text-red-600 mt-1">{errors.target_groups}</p>}
                    </div>

                    {/* SMS Notifications */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMS Notifications (sent when published)
                      </label>
                      <div className="space-y-2 bg-yellow-50 p-3 rounded-md">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:PWD"
                            checked={formData.sms_target_groups?.includes('special_category:PWD')}
                            onChange={handleSMSTargetChange}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Send SMS to PWD</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:SENIOR_CITIZEN"
                            checked={formData.sms_target_groups?.includes('special_category:SENIOR_CITIZEN')}
                            onChange={handleSMSTargetChange}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Send SMS to Senior Citizens</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:SOLO_PARENT"
                            checked={formData.sms_target_groups?.includes('special_category:SOLO_PARENT')}
                            onChange={handleSMSTargetChange}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Send SMS to Solo Parents</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="special_category:INDIGENT"
                            checked={formData.sms_target_groups?.includes('special_category:INDIGENT')}
                            onChange={handleSMSTargetChange}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Send SMS to Indigent Families</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value="all"
                            checked={formData.sms_target_groups?.includes('all')}
                            onChange={handleSMSTargetChange}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">Send SMS to All Residents</span>
                        </label>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Note: SMS will only be sent to residents who have mobile phone numbers in their records.
                        </p>
                      </div>
                    </div>
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
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"
              >
                Close
              </button>
              {!isPublished && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <i className="bi bi-arrow-clockwise animate-spin mr-1" />
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
                    status: announcementData.status || 'draft'
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

      <ToastNotification ref={toastRef} />
    </div>
  )
}
