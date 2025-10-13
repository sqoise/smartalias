'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../lib/apiClient'
import CustomSelect from '../../common/CustomSelect'
import SlidePanel from '../../common/SlidePanel'
import { formatDocumentRequestID } from '../../../lib/utility'

export default function MyRequestsContainer({ toastRef, selectedDocumentType: initialDocumentType = 'all' }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDocumentType, setSelectedDocumentType] = useState(initialDocumentType)
  const [availableDocuments, setAvailableDocuments] = useState([]) // All available documents from database
  
  // Timeline slide panel state
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showTimelinePanel, setShowTimelinePanel] = useState(false)

  // Timeline panel handlers
  const openTimeline = (request) => {
    setSelectedRequest(request)
    setShowTimelinePanel(true)
  }

  const closeTimeline = () => {
    setShowTimelinePanel(false)
    setSelectedRequest(null)
  }

  // Load requests on component mount
  useEffect(() => {
    loadData()
    // Temporarily add sample data for testing
    setSampleData()
  }, [])

  const setSampleData = () => {
    const sampleRequests = [
      {
        id: 1,
        documentId: 1,
        document: 'Barangay Certificate',
        purpose: 'For employment requirements',
        status: 'completed',
        requestDate: '2024-10-01T10:00:00Z',
        completedDate: '2024-10-05T14:30:00Z',
        notes: 'Please bring valid ID for pickup',
        remarks: null,
        fee: 50.00,
        residentName: 'John Doe',
        processedBy: 'Admin Staff'
      },
      {
        id: 2,
        documentId: 2,
        document: 'Barangay Clearance',
        purpose: 'For business permit application',
        status: 'rejected',
        requestDate: '2024-10-08T09:15:00Z',
        completedDate: null,
        notes: 'Additional requirements needed',
        remarks: 'Missing proof of residency. Please submit updated documents and reapply.',
        fee: 100.00,
        residentName: 'John Doe',
        processedBy: null
      },
      {
        id: 3,
        documentId: 3,
        document: 'Certificate of Indigency',
        purpose: 'For medical assistance',
        status: 'processing',
        requestDate: '2024-10-09T11:00:00Z',
        completedDate: null,
        notes: 'Under review by social services',
        remarks: null,
        fee: 0.00,
        residentName: 'John Doe',
        processedBy: 'Social Worker'
      },
      {
        id: 4,
        documentId: 4,
        document: 'Barangay ID',
        purpose: 'For identification purposes',
        status: 'ready',
        requestDate: '2024-10-10T08:30:00Z',
        completedDate: null,
        notes: 'Ready for pickup at barangay office. Office hours: 8AM-5PM',
        remarks: null,
        fee: 25.00,
        residentName: 'John Doe',
        processedBy: 'Registration Staff'
      },
      {
        id: 5,
        documentId: 1,
        document: 'Barangay Certificate',
        purpose: 'For school enrollment',
        status: 'pending',
        requestDate: '2024-10-10T14:00:00Z',
        completedDate: null,
        notes: 'Urgent request for tomorrow',
        remarks: null,
        fee: 50.00,
        residentName: 'John Doe',
        processedBy: null
      }
    ]
    
    setRequests(sampleRequests)
    setAvailableDocuments([
      { id: 1, title: 'Barangay Certificate' },
      { id: 2, title: 'Barangay Clearance' },
      { id: 3, title: 'Certificate of Indigency' },
      { id: 4, title: 'Barangay ID' }
    ])
  }

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
        isOngoing
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
      submitted: {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: 'bi-plus-circle',
        label: 'Submitted',
        iconColor: 'text-gray-600'
      },
      pending: {
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: 'bi-clock',
        label: 'Pending Review',
        iconColor: 'text-amber-600'
      },
      rejected: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: 'bi-x-circle',
        label: 'Rejected',
        iconColor: 'text-red-600'
      },
      processing: {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: 'bi-gear',
        label: 'Processing',
        iconColor: 'text-blue-600'
      },
      ready: {
        color: 'text-violet-600 bg-violet-50 border-violet-200',
        icon: 'bi-check-circle',
        label: 'Ready for pick up',
        iconColor: 'text-violet-600'
      },
      completed: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'bi-check-circle-fill',
        label: 'Claimed',
        iconColor: 'text-green-600'
      },
      claimed: { // Legacy support
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'bi-check-circle-fill',
        label: 'Claimed',
        iconColor: 'text-green-600'
      }
    }
    return configs[status] || configs.pending
  }

  const formatRequestId = (id, requestDate = null) => {
    return formatDocumentRequestID(id, requestDate)
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

  // Timeline content component
  const TimelineContent = ({ request }) => {
    if (!request) return null

    const generateTimeline = (req) => {
      const steps = []
      const baseTime = new Date(req.requestDate)

      // Always start with submitted
      steps.push({
        id: 1,
        status: 'submitted',
        label: 'Submitted',
        icon: 'bi-plus-circle-fill',
        iconColor: 'text-gray-600',
        timestamp: req.requestDate,
        subtitle: `Submitted at: ${formatDate(req.requestDate)} at ${formatTime(req.requestDate)}`,
        content: null
      })

      // Add pending review if not immediately rejected/completed
      if (req.status !== 'submitted') {
        steps.push({
          id: 2,
          status: 'pending',
          label: 'Pending Review',
          icon: 'bi-clock-fill',
          iconColor: 'text-amber-600',
          timestamp: new Date(baseTime.getTime() + 30 * 60 * 1000),
          subtitle: null,
          content: {
            type: 'panel',
            data: [
              { label: 'Purpose', value: req.purpose },
              ...(req.notes ? [{ label: 'Notes', value: req.notes }] : [])
            ]
          }
        })
      }

      // Add processing if status reached that stage
      if (['processing', 'ready', 'claimed', 'completed'].includes(req.status)) {
        steps.push({
          id: 3,
          status: 'processing',
          label: 'Processing',
          icon: 'bi-gear-fill',
          iconColor: 'text-blue-600',
          timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
          subtitle: 'Request is being processed',
          content: {
            type: 'panel',
            data: [
              { label: 'Processing started', value: formatDate(new Date(baseTime.getTime() + 2 * 60 * 60 * 1000)) }
            ]
          }
        })
      }

      // Add ready status if applicable
      if (['ready', 'claimed', 'completed'].includes(req.status)) {
        steps.push({
          id: 4,
          status: 'ready',
          label: 'Ready for pick up',
          icon: 'bi-file-earmark-check-fill',
          iconColor: 'text-violet-600',
          timestamp: req.completedDate || new Date(baseTime.getTime() + 4 * 60 * 60 * 1000),
          subtitle: 'Requested document is ready for pickup at the barangay office',
          content: {
            type: 'panel',
            data: [
              { label: 'Ready since', value: formatDate(req.completedDate || new Date(baseTime.getTime() + 4 * 60 * 60 * 1000)) + ' at ' + formatTime(req.completedDate || new Date(baseTime.getTime() + 4 * 60 * 60 * 1000)) },
              { label: 'Pickup hours', value: '8:00 AM - 5:00 PM (Mon-Fri)' }
            ]
          }
        })
      }

      // Add completed status if applicable (handle both 'claimed' and 'completed')
      if (req.status === 'claimed' || req.status === 'completed') {
        steps.push({
          id: 5,
          status: 'completed',
          label: 'Claimed',
          icon: 'bi-check-circle-fill',
          iconColor: 'text-green-600',
          timestamp: req.completedDate || new Date(baseTime.getTime() + 5 * 60 * 60 * 1000),
          subtitle: `Claimed at: ${formatDate(req.completedDate || new Date(baseTime.getTime() + 5 * 60 * 60 * 1000))} at ${formatTime(req.completedDate || new Date(baseTime.getTime() + 5 * 60 * 60 * 1000))}`,
          content: null
        })
      }

      // Add rejected status if applicable
      if (req.status === 'rejected') {
        steps.push({
          id: steps.length + 1,
          status: 'rejected',
          label: 'Rejected',
          icon: 'bi-x-circle-fill',
          iconColor: 'text-red-600',
          timestamp: req.completedDate || new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
          subtitle: null,
          content: {
            type: 'panel',
            isRejected: true,
            data: [
              { label: 'Reason', value: req.remarks || 'No reason provided' },
              { label: 'Rejected on', value: formatDate(req.completedDate || new Date()) + ' at ' + formatTime(req.completedDate || new Date()) }
            ]
          }
        })
      }

      return steps.reverse() // Show newest first
    }

    const timeline = generateTimeline(request)

    const TimelineStep = ({ step, isFirst, isLast }) => (
      <div className="relative flex items-start space-x-3">
        {/* Status Icon */}
        <div className="relative z-10 flex-shrink-0 mt-1">
          <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-sm">
            <i className={`bi ${step.icon} text-lg ${step.iconColor}`}></i>
          </div>
        </div>
        
        {/* Timeline Content */}
        <div className={`flex-1 min-w-0 ${isLast ? 'pb-1' : 'pb-4'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">{step.label}</span>
            {isFirst && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300">
                Current
              </span>
            )}
          </div>
          
          {/* Subtitle */}
          {step.subtitle && (
            <p className="text-xs text-gray-500 mb-2">{step.subtitle}</p>
          )}
          
          {/* Content Panel */}
          {step.content && step.content.type === 'panel' && (
            <div className={`p-3 rounded-lg border-2 border-dotted text-xs space-y-2 ${
              step.content.isRejected 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-100 border-gray-200'
            }`}>
              {step.content.data.map((item, index) => (
                <div key={index}>
                  <div className={`font-medium mb-1 ${
                    step.content.isRejected && item.label === 'Reason' 
                      ? 'text-red-700' 
                      : 'text-gray-700'
                  }`}>
                    {item.label}:
                  </div>
                  <div className={`${
                    step.content.isRejected && item.label === 'Reason' 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Request Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <i className="bi bi-file-earmark text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{request.document}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ID: {formatRequestId(request.id, request.requestDate)}</span>
                <span className="font-bold">
                  Fee: <span className="font-bold">{request.fee === 0 ? 'FREE' : `₱${request.fee.toFixed(2)}`}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Status History</h4>
          <div className="relative">
            {/* Vertical timeline line for status history - precisely centered through circles */}
            <div className="absolute bg-gray-300 top-0" style={{ left: '14.5px', width: '3px', bottom: '10px'}}></div>
            
            <div className="space-y-3">
              {timeline.map((step, index) => (
                <TimelineStep 
                  key={step.id}
                  step={step}
                  isFirst={index === 0}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
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
            <div className="space-y-3">
              {/* Document Groups */}
              {documentGroups.map(({ documentType, activeRequest, isOngoing }, groupIndex) => {
                const statusConfig = getStatusConfig(activeRequest.status)
                
                return (
                  <div key={documentType} className="relative">
                    {/* Document Card */}
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Main Request Content - Clickable for timeline */}
                      <div 
                        className="p-4 cursor-pointer transition-colors duration-200 group"
                        onClick={() => openTimeline(activeRequest)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900 truncate">{documentType}</h3>
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-4">
                                <span className="font-medium">ID: {formatRequestId(activeRequest.id, activeRequest.requestDate)}</span>
                                <span>Requested: {formatDate(activeRequest.requestDate)}</span>
                                {activeRequest.fee > 0 && (
                                  <span className="font-medium text-green-600">Fee: ₱{activeRequest.fee.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                              <i className="bi bi-chevron-right text-lg"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Slide Panel */}
      <SlidePanel
        open={showTimelinePanel}
        onClose={closeTimeline}
        title="Request Timeline Details"
        subtitle=""
      >
        {selectedRequest && <TimelineContent request={selectedRequest} />}
      </SlidePanel>
    </div>
  )
}
