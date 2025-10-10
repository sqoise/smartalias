'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../lib/apiClient'
import CustomSelect from '../../../components/common/CustomSelect'

export default function MyRequestsContainer({ toastRef, selectedDocumentType: initialDocumentType = 'all' }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDocuments, setExpandedDocuments] = useState({}) // Track which documents are expanded
  const [expandedRequestDetails, setExpandedRequestDetails] = useState({}) // Track which requests show details
  const [selectedDocumentType, setSelectedDocumentType] = useState(initialDocumentType)
  const [availableDocuments, setAvailableDocuments] = useState([]) // All available documents from database

  // Load requests on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load both requests and available documents in parallel
      const [requestsResponse, documentsResponse] = await Promise.all([
        ApiClient.getMyDocumentRequests(),
        ApiClient.getDocumentCatalog(false) // Get ALL documents, not just active ones
      ])
      
      // Handle requests
      if (requestsResponse.success && requestsResponse.data?.requests) {
        const transformedRequests = requestsResponse.data.requests.map(request => ({
          id: request.id,
          documentId: request.document_id,
          document: request.document_type,
          purpose: request.purpose,
          status: request.status_text,
          requestDate: request.created_at,
          completedDate: request.processed_at,
          notes: request.notes,
          remarks: request.remarks,
          fee: parseFloat(request.fee || 0),
          residentName: request.resident_name,
          processedBy: request.processed_by
        }))
        setRequests(transformedRequests)
      } else {
        setRequests([])
      }

      // Handle available documents
      if (documentsResponse.success && documentsResponse.data) {
        setAvailableDocuments(documentsResponse.data)
      } else {
        setAvailableDocuments([])
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toastRef?.current?.show('Failed to load document data', 'error')
      setRequests([])
      setAvailableDocuments([])
    } finally {
      setLoading(false)
    }
  }

  // Group requests by document type and get the most recent (active) request for each
  const getDocumentGroups = () => {
    const groups = {}
    
    // Filter requests by selected document type first
    const filteredRequests = selectedDocumentType === 'all' 
      ? requests 
      : requests.filter(request => request.document === selectedDocumentType)
    
    filteredRequests.forEach(request => {
      if (!groups[request.document]) {
        groups[request.document] = []
      }
      groups[request.document].push(request)
    })
    
    // Sort each group by date (newest first) and return with active request
    return Object.entries(groups).map(([documentType, documentRequests]) => {
      const sortedRequests = documentRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
      const activeRequest = sortedRequests[0] // Most recent request
      const isOngoing = ['pending', 'processing', 'ready'].includes(activeRequest.status)
      
      return {
        documentType,
        activeRequest,
        allRequests: sortedRequests,
        isOngoing,
        hasHistory: sortedRequests.length > 1
      }
    }).sort((a, b) => {
      // Sort by: ongoing first, then by most recent request date
      if (a.isOngoing && !b.isOngoing) return -1
      if (!a.isOngoing && b.isOngoing) return 1
      return new Date(b.activeRequest.requestDate) - new Date(a.activeRequest.requestDate)
    })
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: 'bi-clock',
        label: 'Pending Review',
        iconColor: 'text-blue-600'
      },
      processing: {
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: 'bi-gear',
        label: 'Being Processed',
        iconColor: 'text-orange-600'
      },
      ready: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'bi-check-circle',
        label: 'Ready for Pickup',
        iconColor: 'text-green-600'
      },
      completed: {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: 'bi-check-circle-fill',
        label: 'Completed',
        iconColor: 'text-gray-600'
      },
      claimed: {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: 'bi-check-circle-fill',
        label: 'Claimed',
        iconColor: 'text-gray-600'
      },
      rejected: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: 'bi-x-circle',
        label: 'Rejected',
        iconColor: 'text-red-600'
      }
    }
    return configs[status] || configs.pending
  }

  const formatRequestId = (id) => {
    if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
      const year = new Date().getFullYear()
      const paddedId = String(id).padStart(3, '0')
      return `REQ-${year}-${paddedId}`
    }
    return id
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const toggleDocumentHistory = (documentType) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [documentType]: !prev[documentType]
    }))
  }

  const toggleRequestDetails = (requestId) => {
    setExpandedRequestDetails(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }))
  }

  // Get document types from database catalog
  const getDocumentTypeOptions = () => {
    // Get ALL available documents from database catalog (active and inactive)
    const allDocuments = availableDocuments.map(doc => doc.title)
    
    // Create options without request counts
    const options = [
      { value: 'all', label: 'All Document Types' },
      ...allDocuments.map(docType => ({
        value: docType,
        label: docType
      }))
    ]
    
    return options
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const documentGroups = getDocumentGroups()

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <i className="bi bi-info-circle text-blue-600 text-sm mt-0.5"></i>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Request Timeline View</p>
            <p>Each document type shows your most recent request. Click the arrow to view complete history for that document type.</p>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Request Timeline</h3>
              <h4 className="text-gray-500 mt-1">Track the status of your document requests and view timeline history.</h4>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center space-x-2">
                <i className="bi bi-funnel text-gray-400"></i>
                <label className="text-sm font-medium text-gray-700">Filter by Document Type:</label>
              </div>
              <div className="w-full sm:w-64">
                <CustomSelect
                  value={selectedDocumentType}
                  onChange={setSelectedDocumentType}
                  options={getDocumentTypeOptions()}
                  placeholder="Select document type..."
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {documentGroups.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-file-earmark-text text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Requests</h3>
              <p className="text-sm text-gray-600">You haven't submitted any document requests yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-4 top-2 bottom-0 w-px bg-gray-200"></div>
              
              <div className="space-y-6">
                {/* Document Groups with Timeline */}
                {documentGroups.map(({ documentType, activeRequest, allRequests, isOngoing, hasHistory }, groupIndex) => {
                  const statusConfig = getStatusConfig(activeRequest.status)
                  const isExpanded = expandedDocuments[documentType]
                  
                  return (
                    <div key={documentType} className="relative flex gap-4">
                      {/* Simple Timeline Icon */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-sm">
                          <i className={`bi ${statusConfig.icon} text-sm ${statusConfig.iconColor}`}></i>
                        </div>
                      </div>
                      
                      {/* Content Card - Clickable */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                          {/* Main Request Content - Clickable for details */}
                          <div 
                            className="p-4 cursor-pointer"
                            onClick={() => toggleRequestDetails(activeRequest.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-medium text-gray-900 truncate">{documentType}</h3>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                    {statusConfig.label}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center space-x-4">
                                    <span className="font-medium">ID: {formatRequestId(activeRequest.id)}</span>
                                    <span>Requested: {formatDate(activeRequest.requestDate)}</span>
                                    {activeRequest.fee > 0 && (
                                      <span className="font-medium text-green-600">Fee: ₱{activeRequest.fee.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {/* Details Toggle */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleRequestDetails(activeRequest.id)
                                  }}
                                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <i className={`bi bi-chevron-${expandedRequestDetails[activeRequest.id] ? 'up' : 'down'} text-sm`}></i>
                                </button>
                                
                                {/* History Toggle */}
                                {hasHistory && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleDocumentHistory(documentType)
                                    }}
                                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <i className={`bi bi-${isExpanded ? 'clock-history' : 'clock-history'} text-sm`}></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Request Details (Inline) */}
                          {expandedRequestDetails[activeRequest.id] && (
                            <div className="border-t border-gray-200 bg-white p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Request Details</h4>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
                                  <p className="text-gray-900">{activeRequest.purpose}</p>
                                </div>
                                
                                {activeRequest.notes && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                    <p className="text-gray-900">{activeRequest.notes}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Request Date</label>
                                  <p className="text-gray-900">{formatDate(activeRequest.requestDate)} at {formatTime(activeRequest.requestDate)}</p>
                                </div>
                                
                                {activeRequest.completedDate && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Completed Date</label>
                                    <p className="text-gray-900">{formatDate(activeRequest.completedDate)} at {formatTime(activeRequest.completedDate)}</p>
                                  </div>
                                )}

                                {activeRequest.processedBy && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Processed By</label>
                                    <p className="text-gray-900">{activeRequest.processedBy}</p>
                                  </div>
                                )}

                                {activeRequest.remarks && (
                                  <div>
                                    <label className="block text-xs font-medium text-orange-600 mb-1">Remarks</label>
                                    <p className="text-orange-900 bg-orange-50 p-2 rounded border border-orange-200">{activeRequest.remarks}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Request History Timeline (Collapsible) */}
                          {hasHistory && isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Complete History</h4>
                              <div className="relative">
                                {/* Mini timeline line for history */}
                                <div className="absolute left-3 top-2 bottom-0 w-px bg-gray-300"></div>
                                
                                <div className="space-y-4">
                                  {allRequests.map((request, index) => {
                                    const requestStatusConfig = getStatusConfig(request.status)
                                    const isFirst = index === 0
                                    
                                    return (
                                      <div key={request.id} className="relative">
                                        <div 
                                          className="relative flex items-start space-x-3 cursor-pointer shadow-sm hover:shadow-md rounded-md p-2 -m-2 transition-shadow duration-200"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleRequestDetails(request.id)
                                          }}
                                        >
                                          {/* Simple Mini Timeline Icon */}
                                          <div className="relative z-10 flex-shrink-0 mt-1">
                                            <div className={`w-6 h-6 bg-white border-2 ${isFirst ? 'border-blue-300' : 'border-gray-300'} rounded-full flex items-center justify-center shadow-sm`}>
                                              <i className={`bi ${requestStatusConfig.icon} text-xs ${requestStatusConfig.iconColor}`}></i>
                                            </div>
                                          </div>
                                          
                                          {/* Timeline Content */}
                                          <div className="flex-1 min-w-0 pb-2">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                  {formatRequestId(request.id)}
                                                </span>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${requestStatusConfig.color}`}>
                                                  {requestStatusConfig.label}
                                                </span>
                                                {isFirst && (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                    Current
                                                  </span>
                                                )}
                                              </div>
                                              
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  toggleRequestDetails(request.id)
                                                }}
                                                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                              >
                                                <i className={`bi bi-chevron-${expandedRequestDetails[request.id] ? 'up' : 'down'} text-xs`}></i>
                                              </button>
                                            </div>
                                            
                                            <div className="text-xs text-gray-600">
                                              Submitted: {formatDate(request.requestDate)} at {formatTime(request.requestDate)}
                                              {request.fee > 0 && (
                                                <span className="ml-2 font-medium text-green-600">• Fee: ₱{request.fee.toFixed(2)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Historical Request Details (Inline) */}
                                        {expandedRequestDetails[request.id] && (
                                          <div className="ml-9 mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                                            <h5 className="text-xs font-medium text-gray-700 mb-2">Request Details</h5>
                                            <div className="space-y-2 text-xs">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
                                                <p className="text-gray-900">{request.purpose}</p>
                                              </div>
                                              
                                              {request.notes && (
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                                  <p className="text-gray-900">{request.notes}</p>
                                                </div>
                                              )}
                                              
                                              {request.completedDate && (
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Completed Date</label>
                                                  <p className="text-gray-900">{formatDate(request.completedDate)} at {formatTime(request.completedDate)}</p>
                                                </div>
                                              )}

                                              {request.processedBy && (
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Processed By</label>
                                                  <p className="text-gray-900">{request.processedBy}</p>
                                                </div>
                                              )}

                                              {request.remarks && (
                                                <div>
                                                  <label className="block text-xs font-medium text-orange-600 mb-1">Remarks</label>
                                                  <p className="text-orange-900 bg-orange-50 p-2 rounded border border-orange-200">{request.remarks}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
