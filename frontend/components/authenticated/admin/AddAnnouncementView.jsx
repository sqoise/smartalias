import React, { useState, useEffect } from 'react'
import ToastNotification from '../../common/ToastNotification'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'

export default function AddAnnouncementView({ open, onClose, onSubmit, loading = false }) {
  const toastRef = React.useRef()
  const titleInputRef = React.useRef()
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 1,
    visibility: 'all_residents',
    label: ''
  })

  const [errors, setErrors] = React.useState({})
  const [isSaving, setIsSaving] = React.useState(false)

  // Reset form when panel opens
  React.useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  // Focus title input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 300)
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 1,
      visibility: 'all_residents',
      label: ''
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toastRef.current?.show('Please fix the errors before submitting', 'error')
      return
    }

    setIsSaving(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          status: 'draft'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        toastRef.current?.show('Announcement saved as unpublished successfully', 'success')
        resetForm()
        onClose()
        onSubmit?.(result)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save announcement')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toastRef.current?.show('Request timed out. Please try again.', 'error')
      } else {
        toastRef.current?.show(error.message || 'Failed to save announcement', 'error')
      }
    } finally {
      setIsSaving(false)
    }
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
        onClick={open && !isSaving ? onClose : undefined}
      >
        {/* Floating Close Button next to Panel */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSaving) onClose();
          }}
          disabled={isSaving}
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
              Add New Announcement
            </div>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isSaving}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="h-full overflow-y-auto pb-12">
          <div className="p-4">
            {/* Blog Article Style Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    <i className="bi bi-plus-lg" />
                  </div>
                  <div>
                    <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                      New Announcement
                    </h1>
                    <p className="text-xs text-gray-500">Create and publish announcements for residents</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                    <i className="bi bi-file-earmark-plus mr-1.5" />
                    Unpublished
                  </span>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors h-9 ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter announcement title"
                      disabled={isSaving}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Content Field */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                      className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors resize-none ${
                        errors.content ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Write your announcement content here..."
                      disabled={isSaving}
                    />
                    {errors.content && (
                      <p className="text-xs text-red-600 mt-1">{errors.content}</p>
                    )}
                  </div>

                  {/* Type and Label Fields - 2 Columns */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Type Field */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: parseInt(e.target.value) }))}
                          className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8"
                          disabled={isSaving}
                        >
                          {Object.entries(ANNOUNCEMENT_TYPE_NAMES).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                      </div>
                    </div>

                    {/* Label Field */}
                    <div>
                      <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                        Label <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        id="label"
                        value={formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors h-9"
                        placeholder="e.g., Important, Event, Notice"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer - Visibility Info */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
               
                <p className="text-xs text-gray-500">
                  This announcement will be visible to all residents in the system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin mr-1" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle mr-1" />
                Create Announcement
              </>
            )}
          </button>
        </div>
      </div>

      <ToastNotification ref={toastRef} />
    </div>
  )
}
