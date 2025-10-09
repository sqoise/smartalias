'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DocumentRequestForm from './DocumentRequestForm'
import ApiClient from '../../../lib/apiClient'

export default function DocumentRequestsGrid({ toastRef }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [ongoingRequests, setOngoingRequests] = useState({}) // Track ongoing requests by document ID
  const [checkingRequests, setCheckingRequests] = useState(true)
  
  const router = useRouter()

  // Load available documents
  useEffect(() => {
    loadDocuments()
    checkForOngoingRequests()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Fetch active document catalog from API
      const response = await ApiClient.request('/document-catalog?active_only=true', {
        method: 'GET'
      })
      
      if (response.success) {
        setDocuments(response.data || [])
      } else {
        console.error('Failed to load documents:', response.error)
        setDocuments([])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const checkForOngoingRequests = async () => {
    setCheckingRequests(true)
    try {
      // Get user's document requests
      const response = await ApiClient.getMyDocumentRequests()
      
      if (response.success && response.data?.requests) {
        const ongoing = {}
        const ongoingStatuses = ['pending', 'processing', 'ready']
        
        response.data.requests.forEach(request => {
          if (ongoingStatuses.includes(request.status_text)) {
            ongoing[request.document_id] = {
              id: request.id,
              status: request.status_text,
              document: request.document_type,
              created: request.created_at
            }
          }
        })
        
        setOngoingRequests(ongoing)
      }
    } catch (error) {
      console.error('Error checking ongoing requests:', error)
    } finally {
      setCheckingRequests(false)
    }
  }

  const handleRequestDocument = (document) => {
    // Check if there's an ongoing request for this document
    if (ongoingRequests[document.id]) {
      const ongoing = ongoingRequests[document.id]
      toastRef?.current?.show(
        `You already have a ${ongoing.status} request for this document. Please check your requests page.`,
        'warning'
      )
      return
    }
    
    setSelectedDocument(document)
    setShowRequestForm(true)
  }

  const handleViewOngoingRequest = (documentId) => {
    // Navigate to My Requests page
    router.push('/resident/requests')
  }

  const handleFormSubmit = async (requestData) => {
    try {
      // Validate required data before sending
      if (!requestData.document || !requestData.document.id) {
        throw new Error('Document information is missing')
      }
      
      if (!requestData.purpose || !requestData.purpose.trim()) {
        throw new Error('Purpose is required')
      }

      console.log('Submitting request data:', {
        document_id: requestData.document.id,
        document_type: requestData.document.title,
        purpose: requestData.purpose.trim(),
        notes: requestData.notes ? requestData.notes.trim() : null
      })

      // Submit document request via API
      const response = await ApiClient.request('/document-requests', {
        method: 'POST',
        body: JSON.stringify({
          document_id: requestData.document.id,
          document_type: requestData.document.title,
          purpose: requestData.purpose.trim(),
          notes: requestData.notes ? requestData.notes.trim() : null
        })
      })
      
      if (response.success) {
        console.log('Request submitted successfully:', response.data)
        toastRef?.current?.show('Document request submitted successfully!', 'success')
        
        // Refresh ongoing requests to update the UI
        await checkForOngoingRequests()
      } else {
        console.error('API Error:', response.error)
        toastRef?.current?.show(response.error || 'Failed to submit request', 'error')
        throw new Error(response.error || 'Failed to submit request')
      }
      
    } catch (error) {
      console.error('Error submitting request:', error)
      
      // Show appropriate error message via toast
      if (error.message.includes('Document information is missing')) {
        toastRef?.current?.show('Document information is missing. Please try again.', 'error')
      } else if (error.message.includes('Purpose is required')) {
        toastRef?.current?.show('Please select a purpose for your request.', 'error')
      } else if (error.message.includes('Document ID and purpose are required')) {
        toastRef?.current?.show('Document ID and purpose are required. Please check your selection.', 'error')
      } else {
        toastRef?.current?.show(error.message || 'Failed to submit request. Please try again.', 'error')
      }
      
      throw error
    }
  }

  const closeModal = () => {
    setShowRequestForm(false)
    setSelectedDocument(null)
  }

  if (loading || checkingRequests) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Disclaimer Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <i className="bi bi-info-circle text-blue-600 text-sm mt-0.5"></i>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Request Policy</p>
            <p>You can only have one active request per document type. If you have an ongoing request, please wait for it to be completed before submitting a new one.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((document) => {
              const hasOngoingRequest = ongoingRequests[document.id]
              
              return (
                <div
                  key={document.id}
                  className={`group relative bg-white border rounded-lg p-4 transition-all duration-200 ${
                    hasOngoingRequest 
                      ? 'border-gray-300' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!hasOngoingRequest) {
                      handleRequestDocument(document)
                    }
                  }}
                >
                  {/* Simple Status Badge */}
                  {hasOngoingRequest && (
                    <div className="absolute top-2 left-2 z-10">
                      <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-sm">
                        <i className="bi bi-lock text-white text-xs"></i>
                        <span>{ongoingRequests[document.id].status.charAt(0).toUpperCase() + ongoingRequests[document.id].status.slice(1)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 ${
                      hasOngoingRequest 
                        ? 'bg-gray-100 text-gray-400' 
                        : document.iconColor || 'bg-gray-100 text-gray-600'
                    } rounded-lg flex items-center justify-center mb-3 ${
                      hasOngoingRequest ? '' : 'group-hover:scale-105'
                    } transition-transform duration-200`}>
                      <i className={`bi ${document.icon || 'bi-file-earmark-text'} text-lg`}></i>
                    </div>
                    <h4 className="font-medium mb-2 text-sm leading-tight text-gray-900">{document.title}</h4>
                    <p className="text-xs leading-relaxed line-clamp-2 text-gray-600">{document.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {documents.length === 0 && (
            <div className="text-center py-8 col-span-full">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-file-earmark-text text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents available</h3>
              <p className="text-sm text-gray-600">Check back later for available document types.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Request Form Modal */}
      <DocumentRequestForm
        isOpen={showRequestForm}
        onClose={closeModal}
        document={selectedDocument}
        onSubmit={handleFormSubmit}
        toastRef={toastRef}
      />
    </>
  )
}
