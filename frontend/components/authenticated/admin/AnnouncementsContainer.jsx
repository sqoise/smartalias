'use client'

import { useState, useEffect, useRef } from 'react'

export default function AnnouncementsContainer({ 
  announcements = [], 
  loading = false, 
  onView,
  onDelete,
  onAdd,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('any')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [hoveredStatusFilter, setHoveredStatusFilter] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const statusDropdownRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Filter announcements based on search term
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (announcement.label && announcement.label.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === 'any' ||
      (statusFilter === 'published' && announcement.status === 'published') ||
      (statusFilter === 'unpublished' && announcement.status !== 'published')

    return matchesSearch && matchesStatus
  })

  // Get visible announcements for lazy loading
  const visibleAnnouncements = filteredAnnouncements.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAnnouncements.length

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(5)
  }, [searchTerm, statusFilter])

  // Lazy loading scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when scrolled to 80% of the content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        setVisibleCount(prev => Math.min(prev + 5, filteredAnnouncements.length))
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [filteredAnnouncements.length])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        year: 'numeric'
      })
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
          Published
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white shadow-sm">
        Draft
      </span>
    )
  }

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case 'published':
        return 'Published'
      case 'unpublished':
        return 'Unpublished'
      default:
        return 'Any'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
            <p className="text-sm text-gray-600 mt-0.5">Create and manage barangay announcements</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors cursor-pointer"
            >
              <i className="bi bi-megaphone mr-2"></i>
              Add Announcement
            </button>
          )}
         
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Announcements</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'announcement' : 'announcements'}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
             {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Refresh announcements"
            >
              <i className="bi bi-arrow-clockwise text-md"></i>
            </button>
          )}
          </div>
          
          {/* Search Bar - 50% width */}
          <div className="flex flex-col gap-3">
            <div className="w-1/2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-sm font-medium tracking-normal antialiased border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-text"
                  placeholder="Search announcements..."
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="w-4 h-4 p-3 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <i className="bi bi-x text-xl"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3" ref={statusDropdownRef}>
              <div className="w-auto min-w-32">
                <div className="relative">
                  <button
                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                    onMouseEnter={() => setHoveredStatusFilter(true)}
                    onMouseLeave={() => setHoveredStatusFilter(false)}
                    className="w-full inline-flex items-center justify-between px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center min-w-0">
                      <span className="text-xs text-gray-500 font-normal mr-1">Status:</span>
                      <span className="font-medium text-gray-900 truncate">{getStatusFilterLabel()}</span>
                    </div>
                    {/* Show reset icon on hover only if filter is not set to 'any' */}
                    <div className="ml-2 flex-shrink-0">
                      {hoveredStatusFilter && statusFilter !== 'any' ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 hover:bg-white hover:border hover:border-gray-300 transition-colors">
                          <svg 
                            className="w-3 h-3 text-gray-500 cursor-pointer"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            onClick={(e) => {
                              e.stopPropagation()
                              setStatusFilter('any')
                              setHoveredStatusFilter(false)
                            }}
                            title="Reset status filter"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <i className="bi bi-chevron-down text-sm text-gray-400"></i>
                      )}
                    </div>
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        {[
                          { value: 'any', label: 'Any' },
                          { value: 'published', label: 'Published' },
                          { value: 'unpublished', label: 'Unpublished' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setIsStatusDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-1 text-xs transition-colors cursor-pointer ${
                              statusFilter === option.value
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {option.label}
                            {statusFilter === option.value && (
                              <i className="bi bi-check ml-auto float-right text-blue-600"></i>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-6 ${filteredAnnouncements.length > 5 ? 'max-h-[calc(100vh-400px)] overflow-y-auto' : ''}`} ref={scrollContainerRef}>
          {loading ? (
            // Skeleton Loading
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3 p-3 rounded-lg border border-gray-100">
                    {/* Date Column Skeleton */}
                    <div className="flex-shrink-0 w-14 text-center space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-10 mx-auto"></div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          {/* Title and badges skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                          </div>
                          {/* Content skeleton */}
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                          {/* Target groups skeleton */}
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        
                        {/* Action button skeleton */}
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <i className="bi bi-search text-5xl text-gray-300 mb-3 block"></i>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">No announcements found</h3>
                  <p className="mt-1 text-sm text-gray-500">No announcements match your search criteria</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-sm font-medium text-gray-600 hover:text-blue-600 underline decoration-gray-600 hover:decoration-blue-600 underline-offset-2 transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <i className="bi bi-megaphone text-5xl text-gray-300 mb-3 block"></i>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">No announcements</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first announcement</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('any')
                    }}
                    className="mt-4 text-sm font-medium text-gray-600 hover:text-blue-600 underline decoration-gray-600 hover:decoration-blue-600 underline-offset-2 transition-colors cursor-pointer"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="group"
                >
                  <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200">
                    {/* Date Column */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="text-xs text-gray-500 font-medium">
                        {formatDate(announcement.created_at)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(announcement.created_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>

                    {/* Content - Clickable */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onView?.(announcement)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors leading-tight">
                              {announcement.title}
                            </h3>
                            {announcement.is_urgent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex-shrink-0">
                                Urgent
                              </span>
                            )}
                            {getStatusBadge(announcement.status)}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {announcement.content}
                          </p>
                          
                          {/* Target groups indicator */}
                          {announcement.target_groups && announcement.target_groups.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <i className="bi bi-people text-xs text-gray-400"></i>
                              <span className="text-xs text-gray-500">
                                {announcement.target_groups.includes('all') 
                                  ? 'All Residents' 
                                  : `${announcement.target_groups.length} target group${announcement.target_groups.length > 1 ? 's' : ''}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onView?.(announcement)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View details"
                      >
                        <i className="bi bi-eye text-sm"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(announcement)
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <i className="bi bi-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="text-center py-4 text-xs text-gray-500">
                  Scroll to load more...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
