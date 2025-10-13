'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import SlidePanel from '../../common/SlidePanel'
import Modal from '../../common/Modal'
import ToastNotification from '../../common/ToastNotification'
import { 
  APP_CONFIG, 
  formatDocumentType, 
  getDocumentTypeKey, 
  DOCUMENT_TYPE_OPTIONS 
} from '../../../lib/constants'

export default function DocumentsContainer({ 
  documents = [], 
  loading = false, 
  onView,
  onRefresh
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState('requestDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('7days')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  
  // SlidePanel state for document details
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentPanel, setShowDocumentPanel] = useState(false)

  // Loading state for document download
  const [isDownloadingDocument, setIsDownloadingDocument] = useState(false)

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [documentToReject, setDocumentToReject] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  // Toast notification ref
  const toastRef = useRef(null)

  // Fixed number of rows to maintain consistent table height
  const FIXED_ROWS_COUNT = 1

  // Helper function to display "-" for empty values
  const displayValue = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return fallback;
    }
    return value;
  };

  // Validate rejection reason - letters, spaces, numbers, dot, parenthesis, exclamation, question mark, comma
  const validateRejectionReason = (reason) => {
    if (!reason || reason.trim() === '') {
      return 'Reason is required'
    }
    
    // Allow letters, spaces, numbers, dot, parenthesis, exclamation point, question mark, and comma
    const allowedPattern = /^[a-zA-Z0-9\s.,()!?]+$/
    
    if (!allowedPattern.test(reason)) {
      return 'Reason can only contain letters, numbers, spaces, and these symbols: . , ( ) ! ?'
    }
    
    if (reason.trim().length < 3) {
      return 'Reason must be at least 3 characters long'
    }
    
    if (reason.trim().length > 255) {
      return 'Reason cannot exceed 255 characters'
    }
    
    return null
  }



  // Handle document processing and download
  const handleProcessDocument = async (documentRequest) => {
    try {
      console.log('Processing document request:', documentRequest.id)
      
      // Change status to processing
      // Use rawId for API calls (numeric database ID)
      const documentId = documentRequest.rawId || documentRequest.id
      await handleStatusChange(documentId, 'processing')
      
      // Show success toast
      toastRef.current?.show('Document status changed to processing', 'success')
    } catch (error) {
      console.error('Error processing document:', error)
      
      // Show error toast
      const errorMessage = error.message || 'Failed to process document. Please try again.'
      toastRef.current?.show(errorMessage, 'error')
    }
  }

  // Handle document rejection - show confirmation modal
  const handleRejectDocument = (document) => {
    setDocumentToReject(document)
    setRejectionReason('')
    setRejectionError('')
    setShowRejectModal(true)
  }

  // Confirm document rejection with reason
  const confirmRejectDocument = async () => {
    const validationError = validateRejectionReason(rejectionReason)
    
    if (validationError) {
      setRejectionError(validationError)
      return false // Prevent modal from closing
    }

    setIsRejecting(true)
    setRejectionError('')

    try {
      // Use rawId for API calls (numeric database ID)
      const documentId = documentToReject.rawId || documentToReject.id
      await handleStatusChangeWithReason(documentId, 'rejected', rejectionReason.trim())
      
      // Toast notification is already shown in handleStatusChangeWithReason
      // No need to show another toast here
      
      // Reset state (modal will close automatically via Modal component)
      setDocumentToReject(null)
      setRejectionReason('')
      setShowRejectModal(false)
      
      // Return undefined/true to allow modal to close
      return true
    } catch (error) {
      console.error('Error rejecting document:', error)
      
      // Error toast is already shown in handleStatusChangeWithReason
      // No need to show another toast here
      
      return false // Prevent modal from closing on error
    } finally {
      setIsRejecting(false)
    }
  }

  // Cancel document rejection
  const cancelRejectDocument = () => {
    setShowRejectModal(false)
    setDocumentToReject(null)
    setRejectionReason('')
    setRejectionError('')
  }

  // Download template function
  const downloadTemplate = async (documentType) => {
    try {
      console.log('Downloading template for:', documentType)
      
      // Normalize to internal key if display name is provided
      const normalizedType = getDocumentTypeKey(documentType)
      
      const url = `${APP_CONFIG.API.BASE_URL}/documents/download-template/${normalizedType}`
      const token = localStorage.getItem('token')
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = downloadUrl
        a.download = `${documentType}_template.docx`
        document.body.appendChild(a)
        a.click()
        
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl)
          document.body.removeChild(a)
        }, 100)
        
        console.log('Template downloaded successfully')
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  // Download generated document function (for processing status)
  const downloadGeneratedDocument = async (documentRequest) => {
    // Prevent multiple simultaneous downloads
    if (isDownloadingDocument) {
      console.log('Download already in progress, ignoring duplicate request')
      return
    }

    try {
      setIsDownloadingDocument(true)
      
      const docxData = {
        documentId: documentRequest.id, // Keep formatted ID for document display
        documentType: documentRequest.documentType,
        residentName: documentRequest.residentName,
        address: documentRequest.address || 'Barangay [Your Barangay Name]',
        purpose: documentRequest.purpose,
        requestDate: documentRequest.requestDate,
        fee: documentRequest.fee || 0, // Include fee from database
        requestId: documentRequest.rawId, // Use numeric rawId for database lookup
        details: documentRequest.details // Include details if available
      }
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}/documents/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(docxData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to download document')
      }

      // Check content type to ensure it's a DOCX file
      const contentType = response.headers.get('Content-Type')
      console.log('Response Content-Type:', contentType)
      
      if (!contentType || !(
        contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        contentType.includes('application/octet-stream')
      )) {
        console.error('Invalid content type received:', contentType)
        throw new Error('Invalid file format received from server')
      }

      // Get the blob
      const blob = await response.blob()
      console.log('Blob received, size:', blob.size, 'type:', blob.type)
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('Received empty document file')
      }

      // Get filename from Content-Disposition header or generate uppercase format
      const contentDisposition = response.headers.get('Content-Disposition')
      
      // Format: ELECTRICAL_PERMIT_DR2024-001_20251013143025.docx
      const documentTypeUpper = documentRequest.documentType.toUpperCase().replace(/\s+/g, '_')
      const reqId = documentRequest.id
      const now = new Date()
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      let filename = `${documentTypeUpper}_${reqId}_${timestamp}.docx`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          // If backend provides filename, still format it to uppercase
          filename = filenameMatch[1]
        }
      }
      
      console.log('Downloading as:', filename)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      // Show success toast after successful download
      toastRef.current?.show('Document downloaded successfully', 'success')
      
    } catch (error) {
      console.error('Error downloading generated document:', error)
      
      // Show error toast
      const errorMessage = error.message || 'Failed to download document. Please try again.'
      toastRef.current?.show(errorMessage, 'error')
    } finally {
      // Always reset loading state
      setIsDownloadingDocument(false)
    }
  }

  // Ready for pickup modal state
  const [showReadyModal, setShowReadyModal] = useState(false)
  const [documentToReady, setDocumentToReady] = useState(null)
  const [isSettingReady, setIsSettingReady] = useState(false)

  // Mark as completed modal state
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [documentToComplete, setDocumentToComplete] = useState(null)
  const [isSettingCompleted, setIsSettingCompleted] = useState(false)

  // Handle mark as ready for pickup
  const handleMarkAsReady = (document) => {
    setDocumentToReady(document)
    setShowReadyModal(true)
  }

  // Confirm mark as ready
  const confirmMarkAsReady = async () => {
    if (!documentToReady) return false

    setIsSettingReady(true)

    try {
      const documentId = documentToReady.rawId || documentToReady.id
      await handleStatusChange(documentId, 'ready')
      
      setDocumentToReady(null)
      setShowReadyModal(false)
      
      return true
    } catch (error) {
      console.error('Error marking document as ready:', error)
      return false
    } finally {
      setIsSettingReady(false)
    }
  }

  // Cancel mark as ready
  const cancelMarkAsReady = () => {
    setShowReadyModal(false)
    setDocumentToReady(null)
  }

  // Handle mark as completed
  const handleMarkAsCompleted = (document) => {
    setDocumentToComplete(document)
    setShowCompletedModal(true)
  }

  // Confirm mark as completed
  const confirmMarkAsCompleted = async () => {
    if (!documentToComplete) return false

    setIsSettingCompleted(true)

    try {
      const documentId = documentToComplete.rawId || documentToComplete.id
      await handleStatusChange(documentId, 'completed')
      
      setDocumentToComplete(null)
      setShowCompletedModal(false)
      
      return true
    } catch (error) {
      console.error('Error marking document as completed:', error)
      return false
    } finally {
      setIsSettingCompleted(false)
    }
  }

  // Cancel mark as completed
  const cancelMarkAsCompleted = () => {
    setShowCompletedModal(false)
    setDocumentToComplete(null)
  }

  // Create footer content based on document status
  const getDocumentFooter = (document) => {
    if (!document) return null

    // Pending status footer
    if (document.status === 'pending') {
      return (
        <div className="flex items-center justify-end">
          <div className="flex space-x-2">
            <button
              onClick={() => handleRejectDocument(document)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 border border-red-600 hover:bg-red-700 focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer h-9"
            >
              Reject
            </button>
            {document.templateFilename && (
              <button
                onClick={() => handleProcessDocument(document)}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9"
              >
                Process
              </button>
            )}
          </div>
        </div>
      )
    }

    // Processing status footer
    if (document.status === 'processing') {
      return (
        <div className="flex items-center justify-end">
          <div className="flex space-x-2">
            <button
              onClick={() => handleRejectDocument(document)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 border border-red-600 hover:bg-red-700 focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer h-9"
            >
              Reject
            </button>
            <button
              onClick={() => handleMarkAsReady(document)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9"
            >
              Ready for Pickup
            </button>
          </div>
        </div>
      )
    }

    // Ready status footer
    if (document.status === 'ready') {
      return (
        <div className="flex items-center justify-end">
          <div className="flex space-x-2">
            <button
              onClick={closeDocumentDetails}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"
            >
              Close
            </button>
            <button
              onClick={() => handleMarkAsCompleted(document)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9"
            >
              Completed
            </button>
          </div>
        </div>
      )
    }

    // For other statuses, no footer actions
    return null
  }

  // Helper function to get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-orange-100 text-orange-800',
      'processing': 'bg-blue-100 text-blue-800', 
      'ready': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800', // Status 4 - completed/claimed
      'rejected': 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  // Format status text - converts backend status to user-friendly display
  const formatStatus = (status) => {
    if (status === 'claimed') return 'Completed' // Legacy: convert old 'claimed' to 'Completed'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }
  
  // Check if any filters are active
  const isAnyFilterActive = searchQuery !== '' || 
    statusFilter !== 'all' || 
    documentTypeFilter !== 'all' ||
    dateRangeFilter !== '7days'
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  // Track scroll position for sticky header
  useEffect(() => {
    const handleScroll = (e) => {
      setIsScrolled(e.target.scrollTop > 0)
    }

    const tableContainer = document.querySelector('.table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = searchQuery === '' || 
        doc.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Handle status filter - map "completed" to match backend responses
      const matchesStatus = statusFilter === 'all' || 
        doc.status === statusFilter || 
        (statusFilter === 'completed' && doc.status === 'claimed') // Legacy support for old 'claimed' status
      
      const matchesDocumentType = documentTypeFilter === 'all' || doc.documentType === documentTypeFilter

      // Date range filtering
      const matchesDateRange = (() => {
        if (dateRangeFilter === 'all') return true
        
        const now = new Date()
        const docDate = new Date(doc.requestDate || doc.created_at)
        
        switch (dateRangeFilter) {
          case '7days':
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
            return docDate >= sevenDaysAgo
          case '30days':
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            return docDate >= thirtyDaysAgo
          case '90days':
            const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
            return docDate >= ninetyDaysAgo
          default:
            return true
        }
      })()

      return matchesSearch && matchesStatus && matchesDocumentType && matchesDateRange
    })

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortField] || ''
      let bValue = b[sortField] || ''
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [documents, searchQuery, statusFilter, documentTypeFilter, dateRangeFilter, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleDocumentTypeFilterChange = (value) => {
    setDocumentTypeFilter(value)
    setCurrentPage(1)
  }

  const handleDateRangeFilterChange = (value) => {
    setDateRangeFilter(value)
    setCurrentPage(1)
  }

  // Available filter options
  const availableFilters = {
    documentType: {
      key: 'documentType',
      label: 'Document Type',
      value: documentTypeFilter,
      setter: setDocumentTypeFilter,
      handler: handleDocumentTypeFilterChange,
      options: DOCUMENT_TYPE_OPTIONS
    },
    dateRange: {
      key: 'dateRange',
      label: 'Date Range',
      value: dateRangeFilter,
      setter: setDateRangeFilter,
      handler: handleDateRangeFilterChange,
      options: [
        { value: 'all', label: 'Any' },
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: '90days', label: 'Last 90 days' }
      ]
    }
  }

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Dropdown handlers
  const toggleDropdown = (docId) => {
    setOpenDropdown(openDropdown === docId ? null : docId)
  }

  const handleAction = (action, document) => {
    setOpenDropdown(null)
    if (action === 'view') onView?.(document)
  }

  // Document panel handlers
  const openDocumentDetails = (document) => {
    setSelectedDocument(document)
    setShowDocumentPanel(true)
  }

  const closeDocumentDetails = () => {
    setShowDocumentPanel(false)
    setSelectedDocument(null)
  }

  // Handle status change from pending to processing
  const handleStatusChange = async (documentId, newStatus) => {
    try {
      console.log(`Changing document ${documentId} status to ${newStatus}`)
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}/document-requests/${documentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: `Status changed to ${newStatus} after template processing`
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Document status updated successfully:', result)
        
        // Show success toast
        toastRef.current?.show(
          result.message || 'Document status updated successfully',
          'success'
        )
        
        // Refresh data after status change
        if (onRefresh) {
          onRefresh()
        }
        
        // Close panel after successful status change
        closeDocumentDetails()
      } else {
        const errorData = await response.json()
        console.error('Error updating document status:', errorData.message)
        
        // Show error toast
        toastRef.current?.show(
          errorData.message || 'Failed to update document status',
          'error'
        )
      }
      
    } catch (error) {
      console.error('Error updating document status:', error)
      
      // Only show error toast for network errors (not API errors)
      // API errors are already handled in the else block above
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toastRef.current?.show(
          'Network error. Please check your connection.',
          'error'
        )
      }
    }
  }

  // Handle status change with custom reason (for rejections)
  const handleStatusChangeWithReason = async (documentId, newStatus, reason) => {
    try {
      console.log(`Changing document ${documentId} status to ${newStatus} with reason:`, reason)
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}/document-requests/${documentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: reason
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Document status updated successfully:', result)
        
        // Show success toast
        toastRef.current?.show(
          result.message || 'Document status updated successfully',
          'success'
        )
        
        // Refresh data after status change
        if (onRefresh) {
          onRefresh()
        }
        
        // Close panel after successful status change
        closeDocumentDetails()
      } else {
        const errorData = await response.json()
        console.error('Error updating document status:', errorData.message)
        
        // Show error toast
        toastRef.current?.show(
          errorData.message || 'Failed to update document status',
          'error'
        )
        
        throw new Error(errorData.message || 'Failed to update document status')
      }
      
    } catch (error) {
      console.error('Error updating document status:', error)
      
      // If it's a network error (fetch failed), show a toast
      // Otherwise, the error toast was already shown in the else block above
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toastRef.current?.show(
          'Network error. Please check your connection.',
          'error'
        )
      }
      
      throw error
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDocumentTypeFilter('all')
    setDateRangeFilter('7days')
    setCurrentPage(1)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisible = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    // First Page button
    buttons.push(
      <button
        key="first"
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className="px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
        aria-label="First page"
      >
        First
      </button>
    )

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
        aria-label="Previous page"
      >
        Previous
      </button>
    )

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-2 py-1 text-xs font-semibold border-t border-b border-r border-gray-300 cursor-pointer flex items-center ${
            currentPage === i
              ? 'bg-blue-50 text-blue-600 border-blue-500 font-bold'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      )
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
        aria-label="Next page"
      >
        Next
      </button>
    )

    // Last Page button
    buttons.push(
      <button
        key="last"
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
        aria-label="Last page"
      >
        Last
      </button>
    )

    return buttons
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up text-gray-400 ml-1"></i>
    }
    return sortDirection === 'asc' 
      ? <i className="bi bi-arrow-up text-blue-600 ml-1"></i>
      : <i className="bi bi-arrow-down text-blue-600 ml-1"></i>
  }

  // Document Details Content Component
  const DocumentDetailsContent = ({ document }) => {
    if (!document) return null

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }





    return (
      <div className="space-y-3">
        {/* Request Details Container */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Request Details</h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Request ID</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{document.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(document.status)}`}>
                    {formatStatus(document.status)}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resident Name</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{document.residentName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document Type</label>
                <p className="text-sm text-gray-900 mt-1">{formatDocumentType(document.documentType)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purpose</label>
                <p className="text-sm text-gray-900 mt-1">{document.purpose || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document Fee</label>
                <p className="text-sm text-gray-900 mt-1">₱{document.fee ? Number(document.fee).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Request Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(document.requestDate)}</p>
              </div>
              {/* Rejected on: timestamp (only show for rejected status) */}
              {document.status === 'rejected' && document.rejectedAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected on</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(document.rejectedAt)}</p>
                </div>
              )}
              {/* Completed at: timestamp (only show for completed/claimed status) */}
              {(document.status === 'completed' || document.status === 'claimed') && document.completedAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed at</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(document.completedAt)}</p>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                <p className="text-sm text-gray-900 mt-1">{document.notes || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Preview for Processing Status Only */}
        {document.status === 'processing' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Document Preview</h4>
              </div>
              <div className="p-4">
                {/* Template Preview Options */}
                {document.templateFilename ? (
                  <div className="space-y-3">

                    {/* Generated Document Preview Card */}
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {/* MS Word Icon */}
                          <i className="bi bi-file-earmark-word text-2xl text-blue-600"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {document.documentType.toUpperCase().replace(/\s+/g, '_')}_{document.id}_{(() => {
                              const now = new Date()
                              return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
                            })()}.docx
                          </p>
                          <p className="text-xs text-gray-500">Microsoft Word Document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadGeneratedDocument(document)}
                        disabled={isDownloadingDocument}
                        className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Download document"
                      >
                        {isDownloadingDocument ? (
                          <i className="bi bi-hourglass-split text-xl animate-pulse"></i>
                        ) : (
                          <i className="bi bi-download text-lg"></i>
                        )}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-center">
                      <i className="bi bi-file-earmark-x text-2xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-600">Template not available for {formatDocumentType(document.documentType)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Status Views */}
        {document.status !== 'pending' && document.status !== 'processing' && (
          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-sm">
            <div className="flex items-center space-x-2">
              <i className="bi bi-info-circle text-gray-500"></i>
              <span className="text-gray-700">
                Document is currently in <span className="font-semibold">{formatStatus(document.status)}</span> status
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Search Bar */}
         <div className="flex items-center justify-between mb-1">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">All Requests & Applications</h3>
            </div>
           <div className="flex gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Refresh Applications"
                >
                  <i className="bi bi-arrow-clockwise text-md"></i>
                </button>
              )}
                        {/* Per Page Dropdown with minimalist design */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'perPage' ? null : 'perPage')}
              className="inline-flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              title="Items per page"
            >
              <i className="bi bi-three-dots-vertical text-md"></i>
            </button>
            
            {openDropdown === 'perPage' && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {[25, 50, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setItemsPerPage(value)
                        setCurrentPage(1)
                        setOpenDropdown(null)
                      }}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-100 flex items-center cursor-pointer ${
                        itemsPerPage === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <i className="bi bi-grid mr-2 text-gray-600"></i>
                      {value} per page
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
            </div>
        </div>
    
        <div className="mb-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search by name, ID, or purpose..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-sm font-medium tracking-normal antialiased border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-text"
            />
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => handleSearchChange('')}
                  className="w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <i className="bi bi-x text-sm"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Status Filter */}
          <div className="w-auto min-w-32">
            <div className="relative dropdown-container">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'statusFilter' ? null : 'statusFilter')}
                className="w-full inline-flex items-center justify-between px-3 py-1 text-xs font-medium tracking-normal antialiased bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center min-w-0">
                  <span className="text-xs text-gray-500 font-normal mr-1">Status:</span>
                  <span className="font-medium text-gray-900 truncate">
                    {statusFilter === 'all' ? 'Any' : formatStatus(statusFilter)}
                  </span>
                </div>
                <i className="bi bi-chevron-down text-xs text-gray-400 ml-1 flex-shrink-0"></i>
              </button>
              
              {openDropdown === 'statusFilter' && (
                <div className="absolute left-0 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleStatusFilterChange('all')
                        setOpenDropdown(null)
                      }}
                      className={`w-full text-left px-3 py-1 text-xs font-medium tracking-normal antialiased transition-colors cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Any
                      {statusFilter === 'all' && (
                        <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                      )}
                    </button>
                    {['pending', 'processing', 'ready', 'completed', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusFilterChange(status)
                          setOpenDropdown(null)
                        }}
                        className={`w-full text-left px-3 py-1 text-xs transition-colors cursor-pointer ${
                          statusFilter === status
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {formatStatus(status)}
                        {statusFilter === status && (
                          <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Filters - Always Visible */}
          {Object.entries(availableFilters).map(([filterKey, filter]) => (
            <div key={filterKey} className="w-auto min-w-32">
              <div className="relative dropdown-container">
                <button
                  onClick={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
                  className="w-full inline-flex items-center justify-between px-3 py-1 text-xs font-medium tracking-normal antialiased bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-xs text-gray-500 font-normal mr-1">{filter.label}:</span>
                    <span className="font-medium text-gray-900 truncate">
                      {filter.options.find(opt => opt.value === filter.value)?.label || 'Any'}
                    </span>
                  </div>
                  <i className="bi bi-chevron-down text-xs text-gray-400 ml-1 flex-shrink-0"></i>
                </button>
                
                {openDropdown === filterKey && (
                  <div className="absolute left-0 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {filter.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            filter.handler(option.value)
                            setOpenDropdown(null)
                          }}
                          className={`w-full text-left px-3 py-1 text-xs transition-colors cursor-pointer ${
                            filter.value === option.value
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {option.label}
                          {filter.value === option.value && (
                            <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Clear All Filters Button */}
          {isAnyFilterActive && (
           <div className="w-auto min-w-24 relative">
              <div className="relative dropdown-container">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setDocumentTypeFilter('all')
                    setDateRangeFilter('7days')
                    setCurrentPage(1)
                  }}
                  className="w-full inline-flex items-center justify-between px-2 py-1 text-xs font-medium tracking-normal antialiased text-gray-600 hover:text-blue-600 hover:underline decoration-blue-500 underline-offset-2 rounded-md transition-all cursor-pointer"
                  title="Reset all filters"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

        
        </div>

        {/* Results Summary */}
        <div className="mt-3 flex items-center justify-between text-xs font-medium tracking-normal antialiased text-gray-600">
          <div>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} applications
            {isAnyFilterActive && (
              <span className="text-blue-600">
                {' '}(filtered from {documents.length} total)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>Sort by:</span>
            <span className="font-medium capitalize">{sortField}</span>
            <span className="text-gray-400">
              ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div 
            className="table-container overflow-auto min-h-[calc(100vh-515px)] max-h-[calc(100vh-515px)]"
          >
            <table className="min-w-full h-full divide-y divide-gray-200 divide-x divide-gray-200 table-fixed">
              <thead className="bg-gray-100 sticky top-0 z-[5] border-b border-gray-200">
                <tr className="divide-x divide-gray-200">
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse ml-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 h-full">
                {/* Skeleton rows */}
                {Array.from({ length: FIXED_ROWS_COUNT }, (_, index) => (
                  <tr key={`skeleton-${index}`} className={`divide-x divide-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}>
                    <td className="px-3 py-1 whitespace-nowrap w-20">
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-52">
                      <div className="space-y-1">
                        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-1 w-48">
                      <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-40">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-24">
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-16">
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="overflow-hidden">
            <div className="table-container overflow-auto min-h-[calc(100vh-515px)] max-h-[calc(100vh-515px)] bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <i className="bi bi-file-earmark-text text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg mb-2">No document applications found</p>
                <p className="text-gray-400 text-sm">
                  {isAnyFilterActive 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Document applications will appear here when residents submit requests.'
                  }
                </p>
                {isAnyFilterActive && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-sm font-medium text-gray-600 hover:text-blue-600 underline decoration-gray-600 hover:decoration-blue-600 underline-offset-2 transition-colors cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="table-container overflow-auto min-h-[calc(100vh-515px)] max-h-[calc(100vh-515px)] bg-gray-50">
              <table className="w-full bg-white table-fixed">
                <thead className={`bg-gray-100 sticky top-0 z-[5] ${isScrolled ? 'shadow-sm' : ''}`}>
                  <tr>
                    <th 
                      onClick={() => handleSort('id')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-20"
                    >
                      Req ID <SortIcon field="id" />
                    </th>
                    <th 
                      onClick={() => handleSort('residentName')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-52"
                    >
                      Resident Name <SortIcon field="residentName" />
                    </th>
                    <th 
                      onClick={() => handleSort('documentType')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-48"
                    >
                      Document Type <SortIcon field="documentType" />
                    </th>
                    <th className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-40">
                      Purpose
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-24"
                    >
                      Status <SortIcon field="status" />
                    </th>
                    <th className="px-5 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-12">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {currentData.map((doc, index) => (
                    <tr 
                      key={`${doc.id}-${index}`} 
                      onClick={(e) => {
                        onView?.(doc);
                      }}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer divide-x divide-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      } ${
                        index === currentData.length - 1 ? 'shadow-sm' : ''
                      }`}
                    >
                      <td className="px-3 py-1 whitespace-nowrap w-20">
                        <span className="text-xs font-semibold tracking-normal antialiased text-gray-900">
                          {doc.id}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-52">
                        <span className="text-xs font-semibold tracking-normal antialiased text-gray-900">
                          {displayValue(doc.residentName)}
                        </span>
                      </td>
                      <td className="px-3 py-1 w-48">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900 max-w-xs truncate" title={formatDocumentType(doc.documentType)}>
                          {formatDocumentType(doc.documentType)}
                        </span>
                      </td>
                      <td className="px-3 py-1 w-40">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900 max-w-xs truncate" title={doc.purpose}>
                          {displayValue(doc.purpose)}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-24">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(doc.status)}`}>
                          {formatStatus(doc.status)}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-16">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            openDocumentDetails(doc)
                          }}
                          className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <i className="bi bi-eye text-xs mr-1"></i>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredAndSortedData.length > 0 && (
        <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium tracking-normal antialiased text-gray-700">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            
            <div className="flex py-1 items-center min-w-0 px-4 min-h-[32px]">
              {totalPages > 1 && renderPaginationButtons()}
            </div>
            
            <div className="text-xs font-medium tracking-normal antialiased text-gray-700">
              <span className="font-semibold">{filteredAndSortedData.length}</span> total results
            </div>
          </div>
        </div>
      )}

      {/* Pagination Skeleton - Loading State */}
      {loading && (
        <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Document Details Slide Panel */}
      <SlidePanel
        open={showDocumentPanel}
        onClose={closeDocumentDetails}
        title="Document Request Details"
        footer={getDocumentFooter(selectedDocument)}
      >
        {selectedDocument && <DocumentDetailsContent document={selectedDocument} />}
      </SlidePanel>

      {/* Rejection Confirmation Modal */}
      <Modal
        open={showRejectModal}
        onClose={cancelRejectDocument}
        title="Reject Document Request"
        subtitle={documentToReject ? `Are you sure you want to reject this request?` : ''}
        type="confirm"
        size="md"
        variant="danger"
        confirmText={isRejecting ? "Rejecting..." : "Yes, Reject"}
        cancelText="Cancel"
        onConfirm={confirmRejectDocument}
        confirmDisabled={isRejecting}
        confirmLoading={isRejecting}
        confirmLoadingText="Rejecting..."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value)
                // Clear validation error when user starts typing
                if (rejectionError) {
                  setRejectionError('')
                }
              }}
              disabled={isRejecting}
              className={`w-full px-3 py-2 text-sm border rounded-md transition-colors resize-none ${
                rejectionError 
                  ? 'border-red-500 bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
              } ${isRejecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Please provide a reason for rejecting this request..."
              rows={4}
              maxLength={255}
            />
            {rejectionError && (
              <p className="text-xs text-red-600 mt-1">{rejectionError}</p>
            )}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Allowed: letters, numbers, spaces, and symbols: . , ( ) ! ?
              </p>
              <p className="text-xs text-gray-500">
                {rejectionReason.length}/255
              </p>
            </div>
          </div>
          
          {documentToReject && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Request Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>ID:</strong> {documentToReject.id}</div>
                <div><strong>Document:</strong> {documentToReject.documentType}</div>
                <div><strong>Resident:</strong> {documentToReject.residentName}</div>
                <div><strong>Purpose:</strong> {documentToReject.purpose}</div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Ready for Pickup Confirmation Modal */}
      <Modal
        open={showReadyModal}
        onClose={cancelMarkAsReady}
        title="Ready for Pickup"
        subtitle="Are you sure you want to set this document as ready for pickup?"
        type="confirm"
        size="sm"
        variant="success"
        confirmText={isSettingReady ? "Confirming..." : "Yes, Confirm"}
        cancelText="Cancel"
        onConfirm={confirmMarkAsReady}
        confirmDisabled={isSettingReady}
        confirmLoading={isSettingReady}
        confirmLoadingText="Confirming..."
      >
        {documentToReady && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="bi bi-check-circle text-green-600 text-2xl"></i>
                <div className="flex-1">
                  <p className="text-sm text-green-800">
                    The document will be marked as <strong>Ready for Pickup</strong> and the resident will be notified to claim their document.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Document Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>ID:</strong> {documentToReady.id}</div>
                <div><strong>Document:</strong> {formatDocumentType(documentToReady.documentType)}</div>
                <div><strong>Resident:</strong> {documentToReady.residentName}</div>
                <div><strong>Purpose:</strong> {documentToReady.purpose}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Mark as Completed Confirmation Modal */}
      <Modal
        open={showCompletedModal}
        onClose={cancelMarkAsCompleted}
        title="Mark as Completed"
        subtitle="Are you sure you want to mark this document as completed?"
        type="confirm"
        size="sm"
        variant="success"
        confirmText={isSettingCompleted ? "Confirming..." : "Yes, Confirm"}
        cancelText="Cancel"
        onConfirm={confirmMarkAsCompleted}
        confirmDisabled={isSettingCompleted}
        confirmLoading={isSettingCompleted}
        confirmLoadingText="Confirming..."
      >
        {documentToComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <i className="bi bi-check-circle-fill text-green-600 text-2xl"></i>
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  The document will be marked as <strong>Completed</strong>. This means the resident has successfully claimed their document.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification - Outside modal so it persists after modal closes */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
