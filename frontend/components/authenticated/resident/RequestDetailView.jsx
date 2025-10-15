'use client'

import React, { useState, useEffect } from 'react'
import SlidePanel from '../../common/SlidePanel'
import ApiClient from '../../../lib/apiClient'
import { formatDocumentRequestID } from '../../../lib/utility'

export default function RequestDetailView({ 
  isOpen = false,
  onClose,
  requestId = null,
  toastRef
}) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load request details when component opens
  useEffect(() => {
    if (isOpen && requestId) {
      loadRequestDetails()
    }
  }, [isOpen, requestId])

  const loadRequestDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await ApiClient.getDocumentRequest(requestId)
      
      if (response.success && response.data) {
        // Transform backend data to frontend format
        const transformedRequest = {
          id: response.data.id,
          requestNumber: formatDocumentRequestID(response.data.id, response.data.created_at),
          document: {
            title: response.data.document_type,
            description: response.data.document_description || 'Document details',
            fee: parseFloat(response.data.fee || 0)
          },
          purpose: response.data.purpose,
          notes: response.data.notes,
          remarks: response.data.remarks,
          status: response.data.status_text,
          submittedAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          processedAt: response.data.processed_at,
          processedBy: response.data.processed_by_name,
          residentName: response.data.resident_name,
          // Timeline will be handled separately if needed
          timeline: []
        }
        
        setRequest(transformedRequest)
      } else {
        throw new Error(response.error || 'Failed to load request details')
      }
    } catch (error) {
      console.error('Error loading request details:', error)
      setError(error.message)
      toastRef?.current?.show('Failed to load request details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: 'bi-clock',
        label: 'Pending Review'
      },
      processing: {
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: 'bi-gear',
        label: 'Processing'
      },
      ready: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'bi-check-circle',
        label: 'Ready for Pickup'
      },
      completed: {
        color: 'text-green-700 bg-green-100 border-green-300',
        icon: 'bi-check-circle-fill',
        label: 'Completed'
      },
      claimed: {
        color: 'text-green-700 bg-green-100 border-green-300',
        icon: 'bi-check-circle-fill',
        label: 'Claimed'
      },
      rejected: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: 'bi-x-circle',
        label: 'Rejected'
      }
    }
    return configs[status] || configs.pending
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return date.toLocaleDateString() === now.toLocaleDateString() ? 'Today' : 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <SlidePanel
      open={isOpen}
      onClose={onClose}
      title="Request Details"
      subtitle="View your document request status"
      headerIcon="bi bi-file-earmark-text"
      size="md"
      loading={loading}
    >
      {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              {/* Document header skeleton */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-48 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              
              {/* Status skeleton */}
              <div className="flex justify-center">
                <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
              </div>
              
              {/* Content skeleton */}
              <div className="space-y-3">
                <div className="w-full h-20 bg-gray-200 rounded-lg"></div>
                <div className="w-full h-16 bg-gray-200 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="bi bi-exclamation-circle text-red-500 mr-2"></i>
                <span className="text-sm text-red-600">{error}</span>
              </div>
            </div>
          </div>
        )}

        {request && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Request Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <i className="bi bi-file-earmark text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{request.document.title}</h3>
                  <p className="text-sm text-gray-600">{request.requestNumber}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Document Type</h4>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-900">{request.document.title}</div>
                  <div className="text-sm text-gray-600">{request.document.description}</div>
                  <div className="text-sm font-medium text-green-600">
                    Fee: {request.document.fee === 0 ? 'Free' : `₱${request.document.fee.toFixed(2)}`}
                    {(request.status === 'completed' || request.status === 'claimed') ? ' (Paid)' : ' (Payable on Pickup)'}
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="text-center">
                {(() => {
                  const config = getStatusConfig(request.status)
                  return (
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${config.color}`}>
                      <i className={`bi ${config.icon} mr-2`}></i>
                      {config.label}
                    </div>
                  )
                })()}
                
                {request.status !== 'completed' && request.status !== 'claimed' && request.status !== 'rejected' && request.estimatedCompletion && (
                  <p className="text-sm text-gray-600 mt-2">
                    Estimated completion: {formatDate(request.estimatedCompletion)}
                  </p>
                )}
              </div>

              {/* Request Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Request Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Purpose:</span>
                    <span className="text-sm font-medium text-gray-900">{request.purpose}</span>
                  </div>
                  {request.notes && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Additional Notes:</span>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border">{request.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Submitted:</span>
                    <span className="text-sm text-gray-700">{formatDateTime(request.submittedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Request Timeline</h4>
                <div className="space-y-4">
                  {request.timeline.map((event, index) => {
                    const config = getStatusConfig(event.status)
                    return (
                      <div key={index} className="flex items-start">
                        {/* Timeline Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${config.color}`}>
                          <i className={`bi ${config.icon} text-xs`}></i>
                        </div>
                        
                        {/* Timeline Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                          </div>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          {event.staff && (
                            <p className="text-xs text-gray-500 mt-1">Processed by: {event.staff}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status-specific information */}
              {request.status === 'ready' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <i className="bi bi-info-circle text-green-600 mr-2"></i>
                    <h4 className="font-medium text-green-800">Ready for Pickup</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Your document is ready for pickup. Please visit the barangay office during office hours 
                    (Monday-Friday, 8:00 AM - 5:00 PM) and bring a valid ID.
                  </p>
                </div>
              )}

              {request.status === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <i className="bi bi-clock text-blue-600 mr-2"></i>
                    <h4 className="font-medium text-blue-800">In Progress</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Your request is being processed. You will be notified once it's ready for pickup.
                  </p>
                </div>
              )}

              {request.status === 'claimed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <i className="bi bi-check-circle-fill text-green-600 mr-2"></i>
                    <h4 className="font-medium text-green-800">Document Claimed</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Your document has been successfully claimed. Thank you for using our services.
                  </p>
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <i className="bi bi-x-circle text-red-600 mr-2"></i>
                    <h4 className="font-medium text-red-800">Request Rejected</h4>
                  </div>
                  <p className="text-sm text-red-700">
                    Your request has been rejected. You may submit a new request if needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </SlidePanel>
  )
}
