'use client'

import { useState, useEffect } from 'react'
import MyRequestsContainer from '../../../components/authenticated/resident/MyRequestsContainer'
import ApiClient from '../../../lib/apiClient'
import CustomSelect from '../../../components/common/CustomSelect'

export default function RequestHistory() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDocumentType, setSelectedDocumentType] = useState('all')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await ApiClient.getMyDocumentRequests()
      
      if (response.success && response.data?.requests) {
        const transformedRequests = response.data.requests.map(request => ({
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
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Basic document types - static list
  const getDocumentTypeOptions = () => {
    const basicDocumentTypes = [
      'Barangay Clearance',
      'Certificate of Residency', 
      'Certificate of Indigency',
      'Business Permit',
      'Barangay ID',
      'Certificate of Employment',
      'Death Certificate',
      'Birth Certificate',
      'Marriage Certificate'
    ]

    // Get unique document types from requests that exist
    const existingTypes = [...new Set(requests.map(request => request.document))]
    
    // Combine basic types with any additional types from actual requests
    const allTypes = [...new Set([...basicDocumentTypes, ...existingTypes])].sort()
    
    return [
      { value: 'all', label: `All Document Types${requests.length > 0 ? ` (${requests.length})` : ''}` },
      ...allTypes.map(docType => {
        const count = requests.filter(r => r.document === docType).length
        return {
          value: docType,
          label: count > 0 ? `${docType} (${count})` : docType
        }
      })
    ]
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Document Requests</h1>
        <p className="text-sm text-gray-600 mt-1">Track the status of your document requests and view timeline history.</p>
      </div>

      {/* Document Type Filter */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      )}

      {/* Timeline-Based Requests Container */}
      <MyRequestsContainer selectedDocumentType={selectedDocumentType} />
    </div>
  )
}
