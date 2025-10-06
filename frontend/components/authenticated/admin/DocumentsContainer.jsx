'use client'

import { useState, useMemo, useEffect } from 'react'

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
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Fixed number of rows to maintain consistent table height
  const FIXED_ROWS_COUNT = 25

  // Helper function to display "-" for empty values
  const displayValue = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return fallback;
    }
    return value;
  };

  // Helper function to format document type for display
  const formatDocumentType = (type) => {
    const types = {
      'barangay_certificate': 'Barangay Certificate',
      'barangay_clearance': 'Barangay Clearance', 
      'indigency_certificate': 'Certificate of Indigency',
      'business_permit': 'Business Permit',
      'residency_certificate': 'Certificate of Residency',
      'good_moral': 'Certificate of Good Moral'
    }
    return types[type] || type
  }

  // Helper function to get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-orange-100 text-orange-800',
      'processing': 'bg-blue-100 text-blue-800', 
      'ready': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  // Format status text
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }
  
  // Check if any filters are active
  const isAnyFilterActive = searchQuery !== '' || 
    statusFilter !== 'all' || 
    documentTypeFilter !== 'all' ||
    priorityFilter !== 'all'
  
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
      
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      
      const matchesDocumentType = documentTypeFilter === 'all' || doc.documentType === documentTypeFilter

      const matchesPriority = priorityFilter === 'all' || doc.priority === priorityFilter
      
      return matchesSearch && matchesStatus && matchesDocumentType && matchesPriority
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
  }, [documents, searchQuery, statusFilter, documentTypeFilter, priorityFilter, sortField, sortDirection])

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

  const handlePriorityFilterChange = (value) => {
    setPriorityFilter(value)
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
      options: [
        { value: 'all', label: 'Any' },
        { value: 'barangay_certificate', label: 'Barangay Certificate' },
        { value: 'barangay_clearance', label: 'Barangay Clearance' },
        { value: 'indigency_certificate', label: 'Certificate of Indigency' },
        { value: 'business_permit', label: 'Business Permit' },
        { value: 'residency_certificate', label: 'Certificate of Residency' },
        { value: 'good_moral', label: 'Certificate of Good Moral' }
      ]
    },
    priority: {
      key: 'priority',
      label: 'Priority',
      value: priorityFilter,
      setter: setPriorityFilter,
      handler: handlePriorityFilterChange,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'normal', label: 'Normal' },
        { value: 'urgent', label: 'Urgent' }
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDocumentTypeFilter('all')
    setPriorityFilter('all')
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
              <i className="bi bi-three-dots-vertical text-sm"></i>
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
                  className="w-4 h-4 p-3 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <i className="bi bi-x text-xl"></i>
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
                <i className="bi bi-chevron-down text-sm text-gray-400 ml-1 flex-shrink-0"></i>
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
                  <i className="bi bi-chevron-down text-sm text-gray-400 ml-1 flex-shrink-0"></i>
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
                    setPriorityFilter('all')
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
            className="table-container overflow-auto min-h-[calc(100vh-475px)] max-h-[calc(100vh-475px)]"
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
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
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
                    <td className="px-3 py-1 whitespace-nowrap w-20">
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-24">
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-20">
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
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
            <div className="table-container overflow-auto min-h-[calc(100vh-475px)] max-h-[calc(100vh-475px)] bg-gray-50 flex items-center justify-center">
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
                    className="mt-4 inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer"
                  >
                    <i className="bi bi-x-circle mr-1"></i>
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="table-container overflow-auto min-h-[calc(100vh-475px)] max-h-[calc(100vh-475px)] bg-gray-50">
              <table className="w-full bg-white table-fixed">
                <thead className={`bg-gray-100 sticky top-0 z-[5] ${isScrolled ? 'shadow-sm' : ''}`}>
                  <tr>
                    <th 
                      onClick={() => handleSort('id')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-20"
                    >
                      App ID
                      {sortField === 'id' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('residentName')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-52"
                    >
                      Resident Name
                      {sortField === 'residentName' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('documentType')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-48"
                    >
                      Document Type
                      {sortField === 'documentType' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-40">
                      Purpose
                    </th>
                    <th 
                      onClick={() => handleSort('requestDate')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-20"
                    >
                      Date
                      {sortField === 'requestDate' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-24"
                    >
                      Status
                      {sortField === 'status' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('priority')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-20"
                    >
                      Priority
                      {sortField === 'priority' && (
                        <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'} text-xs ml-1`}></i>
                      )}
                    </th>
                    <th className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {currentData.map((doc, index) => (
                    <tr 
                      key={doc.id} 
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
                      <td className="px-3 py-1 whitespace-nowrap w-20">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">
                          {new Date(doc.requestDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-24">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(doc.status)}`}>
                          {formatStatus(doc.status)}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-20">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          doc.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.priority}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-16">
                        <div 
                          className="relative dropdown-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            onClick={() => toggleDropdown(doc.id)}
                            className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 rounded cursor-pointer"
                            title="Actions"
                          >
                            <i className="bi bi-three-dots-vertical text-sm"></i>
                          </button>
                          
                          {openDropdown === doc.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                              <div className="py-1">
                                <button 
                                  onClick={() => handleAction('view', doc)}
                                  className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer"
                                >
                                  <i className="bi bi-eye mr-2 text-blue-600"></i>
                                  View Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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
        <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg">
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
        <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  )
}
