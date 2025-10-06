'use client'

import { useState, useEffect, useRef } from 'react'
import ApiClient from '../../../lib/apiClient'
import ToastNotification from '../../../components/common/ToastNotification'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'

export default function Announcements() {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const toastRef = useRef()

  const ITEMS_PER_LOAD = 5

  // Helper functions for announcement types
  const getTypeName = (typeId) => {
    return ANNOUNCEMENT_TYPE_NAMES[typeId] || 'General'
  }

  const getTypeIcon = (typeId) => {
    const icons = {
      1: 'bi bi-megaphone text-gray-500',      // General
      2: 'bi bi-heart-pulse text-red-500',    // Health
      3: 'bi bi-calendar-event text-green-500', // Activities
      4: 'bi bi-hand-thumbs-up text-blue-500', // Assistance
      5: 'bi bi-info-circle text-amber-500'   // Advisory
    }
    return icons[typeId] || icons[1]
  }

  const getTypeBadgeColor = (typeId) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700 border-gray-200',      // General
      2: 'bg-red-100 text-red-700 border-red-200',        // Health
      3: 'bg-green-100 text-green-700 border-green-200',  // Activities
      4: 'bg-blue-100 text-blue-700 border-blue-200',     // Assistance
      5: 'bg-amber-100 text-amber-700 border-amber-200'   // Advisory
    }
    return colors[typeId] || colors[1]
  }

  // Initial fetch of announcements
  useEffect(() => {
    fetchAnnouncements(0, true)
  }, [])

  const fetchAnnouncements = async (currentOffset = 0, isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const response = await ApiClient.getPublishedAnnouncements(ITEMS_PER_LOAD, currentOffset)
      
      if (response.success) {
        const data = response.data
        
        // Transform API data to match the expected format
        const transformedData = data.announcements.map(announcement => ({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          fullDescription: announcement.content, // Use content as full description for now
          type: announcement.type, // Keep original type number
          is_urgent: announcement.is_urgent,
          created_at: announcement.created_at,
          published_at: announcement.published_at,
          date: announcement.published_at ? new Date(announcement.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: announcement.published_at ? new Date(announcement.published_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '00:00',
          isNew: announcement.published_at ? (new Date() - new Date(announcement.published_at)) < 3 * 24 * 60 * 60 * 1000 : false, // New if published within 3 days
          image: '/images/barangay_logo.png' // Default image
        }))
        
        if (isInitial) {
          setAnnouncements(transformedData)
        } else {
          setAnnouncements(prev => [...prev, ...transformedData])
        }
        
        // Update pagination state
        setHasMore(data.pagination.hasMore)
        setOffset(currentOffset + ITEMS_PER_LOAD)
        
      } else {
        setError(response.error || 'Failed to fetch announcements')
        toastRef.current?.show('Failed to load announcements', 'error')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setError('Network error. Please try again.')
      toastRef.current?.show('Network error. Please try again.', 'error')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMoreAnnouncements = () => {
    if (!isLoadingMore && hasMore) {
      fetchAnnouncements(offset, false)
    }
  }

  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementModal(true)
  }

  const formatDate = (dateString) => {
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

  return (
    <>
      <div className="space-y-6">

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
            <p className="text-sm text-gray-500 mt-0.5">Latest updates and information</p>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {/* Skeleton placeholders for initial load */}
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border border-gray-100 animate-pulse">
                    {/* Date Column Skeleton */}
                    <div className="flex-shrink-0 w-16 text-center space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
                    </div>
                    
                    {/* Content Skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <i className="bi bi-megaphone text-3xl text-gray-300 mb-3 block"></i>
                <p className="text-gray-500 text-sm">No announcements found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="group cursor-pointer"
                      onClick={() => openAnnouncementModal(announcement)}
                    >
                      <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200">
                        {/* Published Date Column */}
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-xs text-gray-500 font-medium">
                            {formatDate(announcement.date)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {announcement.time}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors leading-tight">
                                  {announcement.title}
                                </h3>
                                {announcement.isNew && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
                                {announcement.content}
                              </p>

                              {/* Announcement Type */}
                              <div className="flex items-center gap-1">
                                <i className={`${getTypeIcon(announcement.type)} text-xs`}></i>
                                <span className="text-xs text-gray-500">
                                  {getTypeName(announcement.type)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="bi bi-chevron-right text-gray-300 text-sm"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Skeleton Placeholders */}
                {isLoadingMore && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                    {[...Array(5)].map((_, index) => (
                      <div key={`loading-${index}`} className="flex gap-3 p-3 rounded-lg border border-gray-100 animate-pulse">
                        {/* Date Column Skeleton */}
                        <div className="flex-shrink-0 w-16 text-center space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
                        </div>
                        
                        {/* Content Skeleton */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                              <div className="flex items-center gap-1 mt-2">
                                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {hasMore && !isLoadingMore && (
                  <div className="text-center pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={loadMoreAnnouncements}
                      className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Details Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl">
            {/* Modal Header with Image */}
            <div className="relative">
              <img 
                src={selectedAnnouncement.image || '/images/barangay_logo.png'} 
                alt={selectedAnnouncement.title}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.target.src = '/images/barangay_logo.png'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {selectedAnnouncement.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                    New
                  </span>
                )}
                {selectedAnnouncement.is_urgent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm">
                    <i className="bi bi-exclamation-triangle-fill mr-1"></i>
                    Urgent
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <i className="bi bi-x text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 mb-4 leading-tight">
                {selectedAnnouncement.title}
              </h2>

              {/* Metadata */}
              <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                {/* Published Date */}
                <div className="flex items-center gap-2 text-sm">
                  <i className="bi bi-calendar3 text-gray-400"></i>
                  <span className="text-gray-600">Published:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(selectedAnnouncement.date)} at {selectedAnnouncement.time}
                  </span>
                </div>

                {/* Type */}
                <div className="flex items-center gap-2 text-sm">
                  <i className="bi bi-tag text-gray-400"></i>
                  <span className="text-gray-600">Type:</span>
                  <div className="flex items-center gap-1">
                    <i className={`${getTypeIcon(selectedAnnouncement.type)} text-xs`}></i>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${getTypeBadgeColor(selectedAnnouncement.type)}`}>
                      {getTypeName(selectedAnnouncement.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Details</h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.fullDescription}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </>
  )
}