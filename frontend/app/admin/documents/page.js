'use client'

import { useState, useEffect } from 'react'
import DocumentsContainer from '../../../components/authenticated/admin/DocumentsContainer'

export default function DocumentsPage() {
  const [documentsData, setDocumentsData] = useState({
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    applications: []
  })
  
  const [loading, setLoading] = useState(true)

  // Mock data for now - replace with real API call
  useEffect(() => {
    const fetchDocumentsData = async () => {
      try {
        setLoading(true)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data
        const mockData = {
          stats: {
            total: 247,
            pending: 23,
            approved: 198,
            rejected: 26
          },
          applications: [
            {
              id: "DOC-2024-001",
              residentId: 123,
              residentName: "Juan Dela Cruz",
              documentType: "barangay_certificate",
              purpose: "Employment requirement",
              requestDate: "2024-10-06",
              status: "pending",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
            {
              id: "DOC-2024-002", 
              residentId: 124,
              residentName: "Maria Santos",
              documentType: "barangay_clearance",
              purpose: "Travel abroad",
              requestDate: "2024-10-05",
              status: "processing",
              priority: "urgent"
            },
            {
              id: "DOC-2024-003",
              residentId: 125, 
              residentName: "Jose Garcia",
              documentType: "indigency_certificate",
              purpose: "Medical assistance",
              requestDate: "2024-10-04",
              status: "ready",
              priority: "normal"
            },
          ]
        }
        
        setDocumentsData(mockData)
      } catch (error) {
        console.error('Error fetching documents data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentsData()
  }, [])

  return (
    <div className="space-y-3">
      {/* Header */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Requests */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Requests</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1.5">
                {loading ? (
                  <span className="w-16 h-6 bg-gray-200 rounded animate-pulse inline-block"></span>
                ) : (
                  documentsData.stats.total.toLocaleString()
                )}
              </p>
              <div className="flex items-center text-xs text-blue-600 font-medium">
                <i className="bi bi-file-earmark-text mr-1.5 text-blue-500"></i>
                <span>All document applications</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="bi bi-files text-lg text-blue-600"></i>
            </div>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1.5">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 rounded animate-pulse inline-block"></span>
                ) : (
                  documentsData.stats.pending
                )}
              </p>
              <div className="flex items-center text-xs text-orange-600 font-medium">
                <i className="bi bi-clock mr-1.5 text-orange-500"></i>
                <span>Awaiting review & processing</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="bi bi-hourglass-split text-lg text-orange-600"></i>
            </div>
          </div>
        </div>

        {/* Approved Applications */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1.5">
                {loading ? (
                  <span className="w-14 h-6 bg-gray-200 rounded animate-pulse inline-block"></span>
                ) : (
                  documentsData.stats.approved
                )}
              </p>
              <div className="flex items-center text-xs text-green-600 font-medium">
                <i className="bi bi-check-circle mr-1.5 text-green-500"></i>
                <span>Ready for pickup & completed</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="bi bi-check-circle text-lg text-green-600"></i>
            </div>
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1.5">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 rounded animate-pulse inline-block"></span>
                ) : (
                  documentsData.stats.rejected
                )}
              </p>
              <div className="flex items-center text-xs text-red-600 font-medium">
                <i className="bi bi-x-circle mr-1.5 text-red-500"></i>
                <span>Applications denied or declined</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="bi bi-x-circle text-lg text-red-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table Container */}
      <DocumentsContainer 
        documents={documentsData.applications}
        loading={loading}
        onRefresh={() => window.location.reload()}
      />
    </div>
  )
}
