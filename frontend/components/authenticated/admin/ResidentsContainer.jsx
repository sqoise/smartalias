'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
export default function ResidentsContainer({ 
  residents = [], 
  loading = false, 
  onView, 
  onEdit, 
  onDelete,
  onRefresh,
  onAdd
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState('first_name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // Default to 'active' status
  const [openDropdown, setOpenDropdown] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredFilter, setHoveredFilter] = useState(null) // Track which filter is being hovered
  
    // Filter values for additional filters
  const [civilStatusFilter, setCivilStatusFilter] = useState('all')
  const [purokFilter, setPurokFilter] = useState('all')
  const [householdRoleFilter, setHouseholdRoleFilter] = useState('all')
  const [ageGroupFilter, setAgeGroupFilter] = useState('all')
  const [specialCategoryFilter, setSpecialCategoryFilter] = useState('all')

  // Helper function to display "-" for empty values
  const displayValue = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return fallback;
    }
    return value;
  };
  
  // Check if any filters are active (excluding default 'active' status)
  const isAnyFilterActive = searchQuery !== '' || 
    (statusFilter !== 'all' && statusFilter !== 'active') || 
    householdRoleFilter !== 'all' || 
    ageGroupFilter !== 'all' || 
    civilStatusFilter !== 'all' || 
    specialCategoryFilter !== 'all'
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close main dropdowns
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
  }, [])  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = residents.filter(resident => {
      const fullName = `${resident.first_name || ''} ${resident.last_name || ''}`.trim()
      const matchesSearch = searchQuery === '' || 
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resident.first_name && resident.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resident.last_name && resident.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resident.address && resident.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (resident.contact_number && resident.contact_number.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && resident.is_active === 1) ||
        (statusFilter === 'inactive' && resident.is_active === 0)
      
      // Household Role Filter
      const matchesHouseholdRole = householdRoleFilter === 'all' || 
        (resident.family_relationship && resident.family_relationship.toLowerCase() === householdRoleFilter.toLowerCase())
      
      // Age Group Filter
      const matchesAgeGroup = ageGroupFilter === 'all' || (() => {
        if (!resident.age) return false
        const age = parseInt(resident.age)
        switch (ageGroupFilter) {
          case 'child': return age < 18
          case 'adult': return age >= 18 && age <= 59
          case 'senior': return age >= 60
          default: return true
        }
      })()
      
      // Civil Status Filter
      const matchesCivilStatus = civilStatusFilter === 'all' || 
        (resident.civil_status && resident.civil_status.toLowerCase() === civilStatusFilter.toLowerCase())
      
      // Special Category Filter
      const matchesSpecialCategory = specialCategoryFilter === 'all' || (() => {
        if (!resident.specialCategories) return false
        const categories = Array.isArray(resident.specialCategories) ? resident.specialCategories : [resident.specialCategories]
        return categories.some(category => category && typeof category === 'string' && category.toLowerCase() === specialCategoryFilter.toLowerCase())
      })()
      
      return matchesSearch && matchesStatus && matchesHouseholdRole && 
             matchesAgeGroup && matchesCivilStatus && matchesSpecialCategory
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
  }, [residents, searchQuery, statusFilter, householdRoleFilter, ageGroupFilter, civilStatusFilter, specialCategoryFilter, sortField, sortDirection])

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

  // Additional filter handlers
  const handlePurokFilterChange = (value) => {
  setPurokFilter(value)
  setSearchQuery('')
  setStatusFilter('active')
  setHouseholdRoleFilter('all')
  setAgeGroupFilter('all')
  setCivilStatusFilter('all')
  setSpecialCategoryFilter('all')
  setCurrentPage(1)
  }
  const handleHouseholdRoleFilterChange = (value) => {
    setHouseholdRoleFilter(value)
    setCurrentPage(1)
  }

  const handleAgeGroupFilterChange = (value) => {
    setAgeGroupFilter(value)
    setCurrentPage(1)
  }

  const handleCivilStatusFilterChange = (value) => {
    setCivilStatusFilter(value)
    setCurrentPage(1)
  }

  const handleSpecialCategoryFilterChange = (value) => {
    setSpecialCategoryFilter(value)
    setCurrentPage(1)
  }

  // Available filter options
  const availableFilters = {
    purok: {
      key: 'purok',
      label: 'Purok',
      value: purokFilter,
      setter: setPurokFilter,
      handler: handlePurokFilterChange,
      options: [
  { value: 'all', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' }
      ]
    },
    householdRole: {
      key: 'householdRole',
      label: 'Household Role',
      value: householdRoleFilter,
      setter: setHouseholdRoleFilter,
      handler: handleHouseholdRoleFilterChange,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'father', label: 'Father' },
        { value: 'mother', label: 'Mother' },
        { value: 'child', label: 'Child' },
        { value: 'grandfather', label: 'Grandfather' },
        { value: 'grandmother', label: 'Grandmother' },
        { value: 'sibling', label: 'Sibling' }
      ]
    },
    ageGroup: {
      key: 'ageGroup',
      label: 'Age Group',
      value: ageGroupFilter,
      setter: setAgeGroupFilter,
      handler: handleAgeGroupFilterChange,
      options: [
  { value: 'all', label: 'Any' },
        { value: 'child', label: 'Child/Minor (<18)' },
        { value: 'adult', label: 'Adult (18-59)' },
        { value: 'senior', label: 'Senior Citizen (60+)' }
      ]
    },
    civilStatus: {
      key: 'civilStatus',
      label: 'Civil Status',
      value: civilStatusFilter,
      setter: setCivilStatusFilter,
      handler: handleCivilStatusFilterChange,
      options: [
  { value: 'all', label: 'Any' },
        { value: 'Single', label: 'Single' },
        { value: 'Married', label: 'Married' },
        { value: 'Live in', label: 'Live in' },
        { value: 'Solo Parent', label: 'Solo Parent' },
        { value: 'Widowed', label: 'Widowed' },
        { value: 'Separated', label: 'Separated' }
      ]
    },
    specialCategory: {
      key: 'specialCategory',
  label: 'Resident Type',
      value: specialCategoryFilter,
      setter: setSpecialCategoryFilter,
      handler: handleSpecialCategoryFilterChange,
      options: [
  { value: 'all', label: 'Any' },
        { value: 'pwd', label: 'Persons with Disability (PWD)' },
        { value: 'solo-parent', label: 'Solo Parent' },
        { value: 'indigent', label: 'Indigent/Low-income' },
        { value: 'ofw', label: 'OFW Family Member' },
        { value: 'voter', label: 'Voter' },
        { value: 'non-voter', label: 'Non-Voter' }
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
  const toggleDropdown = (residentId) => {
    setOpenDropdown(openDropdown === residentId ? null : residentId)
  }

  const handleAction = (action, resident) => {
    setOpenDropdown(null)
    if (action === 'view') onView?.(resident)
    else if (action === 'edit') onEdit?.(resident)
    else if (action === 'delete') onDelete?.(resident)
  }

  // Fixed table height - calculate based on viewport for maximum space utilization
  // Approximately 60vh allows for ~20-25 rows on most screens while keeping fixed row height
  const FIXED_ROWS_COUNT = 20

  // Render empty rows to maintain fixed height (only when there is data)
  const renderEmptyRows = () => {
    // Don't render empty rows if there's no data at all
    if (currentData.length === 0) {
      return null
    }
    
    const emptyRowsCount = Math.max(0, FIXED_ROWS_COUNT - currentData.length)
    const emptyRows = []
    
    for (let i = 0; i < emptyRowsCount; i++) {
      emptyRows.push(
        <tr key={`empty-${i}`} className="bg-gray-300 divide-x divide-gray-200">
          <td className="px-2 py-1 whitespace-nowrap">
            <div className="h-6"></div>
          </td>
          <td className="px-2 py-1">
            <div className="h-6"></div>
          </td>
          <td className="px-2 py-1 whitespace-nowrap">
            <div className="h-6"></div>
          </td>
          <td className="px-2 py-1 whitespace-nowrap">
            <div className="h-6"></div>
          </td>
          <td className="px-2 py-1 whitespace-nowrap text-right text-sm font-medium">
            <div className="h-6"></div>
          </td>
        </tr>
      )
    }
    
    return emptyRows
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisible = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

  // First Page button (icon)
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

  // Last Page button (icon)
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

  return (
    <div className="space-y-2 antialiased font-medium tracking-normal">
      {/* Filters and Search */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 relative">
        {/* Fixed buttons in top right corner */}
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          {/* Add Resident Button */}
          {onAdd && (
            <button
              onClick={() => onAdd?.()}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium tracking-normal rounded-md hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer"
              title="Add new resident"
            >
              <i className="bi bi-person-plus mr-1 text-xs"></i>
              Add Resident
            </button>
          )}

          {/* Refresh Button */}
                    {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={() => onRefresh?.()}
              disabled={loading}
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 font-medium tracking-normal bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Refresh residents list"
            >
              <i className="bi bi-arrow-clockwise text-sm"></i>
            </button>
          )}

          {/* Per Page Dropdown with minimalist design */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'perPage' ? null : 'perPage')}
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
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

        {/* Search Field */}
        <div className="pr-16 mb-2">
          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search by resident id, name, address.."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 text-sm font-medium tracking-normal antialiased border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            />
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
                    {statusFilter === 'all' ? 'Any' : 
                     statusFilter === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <i className="bi bi-chevron-down text-sm text-gray-400 ml-1 flex-shrink-0"></i>
              </button>
              
              {openDropdown === 'statusFilter' && (
                <div className="absolute left-0 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {/* Any Status Option */}
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

                    {/* Active Status Option */}
                    <button
                      onClick={() => {
                        handleStatusFilterChange('active')
                        setOpenDropdown(null)
                      }}
                      className={`w-full text-left px-3 py-1 text-xs transition-colors cursor-pointer ${
                        statusFilter === 'active'
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Active
                      {statusFilter === 'active' && (
                        <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                      )}
                    </button>

                    {/* Inactive Status Option */}
                    <button
                      onClick={() => {
                        handleStatusFilterChange('inactive')
                        setOpenDropdown(null)
                      }}
                      className={`w-full text-left px-3 py-1 text-xs transition-colors cursor-pointer ${
                        statusFilter === 'inactive'
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Inactive
                      {statusFilter === 'inactive' && (
                        <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Filters - Always Visible */}
          {Object.entries(availableFilters).map(([filterKey, filter]) => {
            const isHovered = hoveredFilter === filterKey
            return (
              <div key={filterKey} className={`w-auto relative ${filterKey === 'ageGroup' ? 'min-w-32' : 'min-w-24'}`}>
                <div className="relative dropdown-container">
                  {/* Filter Dropdown with Hover Effect */}
                  <button
                    onClick={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
                    onMouseEnter={() => setHoveredFilter(filterKey)}
                    onMouseLeave={() => setHoveredFilter(null)}
                    className="w-full inline-flex items-center justify-between px-2 py-1 text-xs font-medium tracking-normal antialiased bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                    title={`Click to filter ${filter.label}`}
                  >
                    <div className="flex items-center min-w-0">
                      <span className="text-xs text-gray-500 font-normal mr-1">
                        {filter.label.split(' ')[0]}:
                      </span>
                      <span className="font-medium text-gray-900 truncate">
                        {filter.options.find(opt => opt.value === filter.value)?.label || 'Any'}
                      </span>
                    </div>
                    {/* Show reset icon on hover only if filter is not set to 'all' */}
                    <div className="ml-1 flex-shrink-0">
                      {isHovered && filter.value !== 'all' ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 hover:bg-white hover:border hover:border-gray-300 transition-colors">
                          <svg 
                            className="w-3 h-3 text-gray-500 cursor-pointer"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent dropdown toggle
                              filter.handler('all') // Reset to 'all'
                              setHoveredFilter(null)
                            }}
                            title={`Reset ${filter.label} filter`}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <i className="bi bi-chevron-down text-sm text-gray-400"></i>
                      )}
                    </div>
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
                            className={`w-full text-left px-3 py-1 text-xs font-medium tracking-normal antialiased transition-colors cursor-pointer ${
                              filter.value === option.value
                                ? 'bg-blue-50 text-blue-700 font-semibold'
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
            )
          })}

          {/* Reset Filters Button - Same Container Structure */}
          {isAnyFilterActive && (
            <div className="w-auto min-w-24 relative">
              <div className="relative dropdown-container">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    // Keep status filter as 'active' by default, don't reset it
                    setHouseholdRoleFilter('all')
                    setAgeGroupFilter('all')
                    setCivilStatusFilter('all')
                    setSpecialCategoryFilter('all')
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
        <div className="mt-2 flex items-center justify-between text-xs font-medium tracking-normal antialiased text-gray-600">
          <div>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} residents
            {(searchQuery || statusFilter !== 'all' || 
              householdRoleFilter !== 'all' || ageGroupFilter !== 'all' || 
              civilStatusFilter !== 'all' || specialCategoryFilter !== 'all') && (
              <span className="text-blue-600">
                {' '}(filtered from {residents.length} total)
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
            className="table-container overflow-auto min-h-[calc(100vh-280px)] max-h-[calc(100vh-280px)]"
          >
            <table className="min-w-full h-full divide-y divide-gray-200 divide-x divide-gray-200 table-fixed">
              <thead className="bg-gray-100 sticky top-0 z-[5] border-b border-gray-200">
                <tr className="divide-x divide-gray-200">
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">
                    <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse ml-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 h-full">
                {/* Skeleton rows */}
                {Array.from({ length: FIXED_ROWS_COUNT }, (_, index) => (
                  <tr key={`skeleton-${index}`} className={`divide-x divide-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}>
                    <td className="px-3 py-1 whitespace-nowrap w-14">
                      <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-52">
                      <div className="space-y-1">
                        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-1 w-72">
                      <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-12">
                      <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-28">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-12">
                      <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-28">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap w-24">
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="overflow-hidden">
            <div className="table-container overflow-auto min-h-[calc(100vh-280px)] max-h-[calc(100vh-280px)] bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <i className="bi bi-search text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg mb-2">No residents found</p>
                {(searchQuery || statusFilter !== 'all') ? (
                  <p className="text-sm text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Add your first resident to get started
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="table-container overflow-auto min-h-[calc(100vh-280px)] max-h-[calc(100vh-280px)] bg-gray-50">
              <table className="w-full bg-white table-fixed">
                <thead className={`bg-gray-100 sticky top-0 z-[5] ${isScrolled ? 'shadow-sm' : ''}`}>
                  <tr>
                    <th 
                      onClick={() => handleSort('id')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-14"
                    >
                      ID <SortIcon field="id" />
                    </th>
                    <th 
                      onClick={() => handleSort('first_name')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-52"
                    >
                      Name <SortIcon field="first_name" />
                    </th>
                    <th 
                      onClick={() => handleSort('address')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-72"
                    >
                      Address <SortIcon field="address" />
                    </th>
                    <th 
                      onClick={() => handleSort('purok')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-14"
                    >
                      Purok <SortIcon field="purok" />
                    </th>
                    <th className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-28">
                      Contact
                    </th>
                    <th 
                      onClick={() => handleSort('age')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-12"
                    >
                      Age <SortIcon field="age" />
                    </th>
                    <th className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase w-28">
                      Resident Type
                    </th>
                    <th 
                      onClick={() => handleSort('civil_status')}
                      className="px-3 py-1 text-left text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase cursor-pointer hover:bg-gray-200 select-none transition-colors w-24"
                    >
                      Civil Status <SortIcon field="civil_status" />
                    </th>
                    {/*
                    <th className="px-3 py-1 text-right text-xs font-semibold tracking-normal antialiased text-gray-600 uppercase">
                      Actions
                    </th>
                    */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentData.map((resident, index) => (
                    <tr 
                      key={resident.id} 
                      onClick={(e) => {
                        onView?.(resident);
                      }}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer divide-x divide-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      } ${
                        index === currentData.length - 1 ? 'shadow-sm' : ''
                      }`}
                    >
                      <td className="px-3 py-1 whitespace-nowrap w-14">
                        <span className="text-xs font-semibold tracking-normal antialiased text-gray-900">
                          {resident.id}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-52">
                        <span className="text-xs font-semibold tracking-normal antialiased text-gray-900">
                          {(() => {
                            const firstName = displayValue(resident.first_name, '');
                            const middleInitial = resident.middle_name ? resident.middle_name.charAt(0) + '.' : '';
                            const lastName = displayValue(resident.last_name, '');
                            const fullName = `${firstName} ${middleInitial} ${lastName}`.replace(/\s+/g, ' ').trim();
                            return fullName || '-';
                          })()}
                        </span>
                      </td>
                      <td className="px-3 py-1 w-72">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900 max-w-xs truncate" title={resident.address}>
                          {displayValue(resident.address)}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-12">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">
                          {resident.purok ? `${resident.purok}` : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-28">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">{displayValue(resident.contact_number)}</span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-12">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">
                          {displayValue(resident.age)}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-28">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">
                          {displayValue(resident.resident_type, 'Regular')}
                        </span>
                      </td>
                      <td className="px-3 py-1 whitespace-nowrap w-24">
                        <span className="text-xs font-medium tracking-normal antialiased text-gray-900">
                          {displayValue(resident.civil_status)}
                        </span>
                      </td>
                      {/*
                      <td className="px-3 py-1 whitespace-nowrap text-right text-sm font-medium">
                        <div 
                          className="relative dropdown-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            onClick={() => toggleDropdown(resident.id)}
                            className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 rounded cursor-pointer"
                            title="Actions"
                          >
                            <i className="bi bi-three-dots-vertical text-sm"></i>
                          </button>
                          
                          {openDropdown === resident.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                              <div className="py-1">
                                <button 
                                  onClick={() => handleAction('view', resident)}
                                  className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer"
                                >
                                  <i className="bi bi-eye mr-2 text-blue-600"></i>
                                  View Details
                                </button>
                                <button 
                                  onClick={() => handleAction('edit', resident)}
                                  className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer"
                                >
                                  <i className="bi bi-pencil mr-2 text-amber-600"></i>
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleAction('delete', resident)}
                                  className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 flex items-center border-t border-gray-100 cursor-pointer"
                                >
                                  <i className="bi bi-trash mr-2 text-red-600"></i>
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      */}
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
            <div className="text-xs font-medium tracking-normal antialiased text-gray-700">
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="flex py-1 items-center min-w-0 px-4 min-h-[32px] space-x-1">
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="text-xs font-medium tracking-normal antialiased text-gray-700">
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
