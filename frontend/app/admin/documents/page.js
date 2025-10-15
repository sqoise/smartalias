'use client'

import { useState, useEffect, useRef } from 'react'
import DocumentsContainer from '../../../components/authenticated/admin/DocumentsContainer'
import ToastNotification from '../../../components/common/ToastNotification'
import ApiClient from '../../../lib/apiClient'
import { alertToast, formatDocumentRequestID } from '../../../lib/utility'

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
  const toastRef = useRef()

  // Toast helper
  const handleAlert = (message, type = 'info') => alertToast(toastRef, message, type)

  // Function to fetch documents statistics
  const fetchDocumentsStats = async () => {
    try {
      const response = await ApiClient.getDocumentRequestStats({
        dateRange: '7days' // Default to last 7 days for overview
      })
      
      if (response.success && response.data?.basic) {
        const stats = response.data.basic
        return {
          total: stats.total,
          pending: stats.pending,
          approved: stats.claimed, // Completed documents (backend status=4)
          rejected: stats.rejected
        }
      } else {
        throw new Error(response.error || 'Failed to fetch statistics')
      }
    } catch (error) {
      console.error('Error fetching document stats:', error)
      handleAlert('Failed to load document statistics', 'error')
      // Return fallback data
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      }
    }
  }

  // Function to fetch documents data
  const fetchDocumentsData = async () => {
    try {
      setLoading(true)
      
      // Fetch both statistics and applications in parallel
      const [statsData, applicationsResponse] = await Promise.all([
        fetchDocumentsStats(),
        ApiClient.searchDocumentRequests({
          page: 1,
          limit: 100,
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      ])

      let applications = []
      if (applicationsResponse.success && applicationsResponse.data?.requests) {
        applications = applicationsResponse.data.requests.map(request => ({
          id: formatDocumentRequestID(request.id, request.created_at), // Formatted ID for display
          rawId: request.id, // Raw numeric ID for API calls
          residentId: request.resident_id,
          residentName: request.resident_name,
          address: request.address, // Include resident address
          documentType: request.document_type,
          templateFilename: request.template_filename, // Template filename from database
          purpose: request.purpose,
          notes: request.notes, // Include notes from request
          requestDate: request.created_at,
          status: request.status_text,
          fee: request.fee || 0, // Document fee from catalog
          rejectedAt: request.rejected_at, // Timestamp when rejected (from logs)
          completedAt: request.completed_at // Timestamp when completed (from logs)
        }))
      }

      setDocumentsData({
        stats: statsData,
        applications: applications
      })
      
    } catch (error) {
      console.error('Error fetching documents data:', error)
      handleAlert('Failed to load documents data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchDocumentsData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle refresh
  const handleRefresh = () => {
    fetchDocumentsData()
  }

  return (
    <div className="space-y-4">
      {/* MERGED SECTION: Document Services & Analytics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* Total Requests */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Requests</p>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {loading ? (
                    <span className="w-14 h-5 bg-gray-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    documentsData.stats.total.toLocaleString()
                  )}
                </p>
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <span>All document applications</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="bi bi-files text-blue-600"></i>
              </div>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</p>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {loading ? (
                    <span className="w-10 h-5 bg-gray-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    documentsData.stats.pending
                  )}
                </p>
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <span>Awaiting review</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="bi bi-hourglass-split text-orange-600"></i>
              </div>
            </div>
          </div>

          {/* Approved Applications */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {loading ? (
                    <span className="w-12 h-5 bg-gray-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    documentsData.stats.approved
                  )}
                </p>
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <span>Claimed</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="bi bi-check-circle text-green-600"></i>
              </div>
            </div>
          </div>

          {/* Rejected Applications */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected</p>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {loading ? (
                    <span className="w-10 h-5 bg-gray-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    documentsData.stats.rejected
                  )}
                </p>
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <span>Denied or Rejected</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="bi bi-x-circle text-red-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Analytics & Actions - Commented out for now
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <i className="bi bi-clock text-blue-600"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Avg. Processing</p>
                <p className="text-xs text-gray-600">2.3 days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <i className="bi bi-graph-up text-green-600"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Success Rate</p>
                <p className="text-xs text-gray-600">89.4%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <i className="bi bi-star text-yellow-600"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Most Popular</p>
                <p className="text-xs text-gray-600">Brgy Clearance</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2">
              <i className="bi bi-hourglass-split text-orange-600"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Process Pending</p>
                <p className="text-xs text-gray-600">Review requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2">
              <i className="bi bi-download text-purple-600"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Export Data</p>
                <p className="text-xs text-gray-600">Generate reports</p>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>

      {/* Documents Table */}
      
        <DocumentsContainer 
          documents={documentsData.applications}
          loading={loading}
          onRefresh={handleRefresh}
        />

      {/* Toast Notifications */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
