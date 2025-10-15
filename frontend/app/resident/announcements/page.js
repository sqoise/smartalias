'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ApiClient from '../../../lib/apiClient'
import ToastNotification from '../../../components/common/ToastNotification'
import SlidePanel from '../../../components/common/SlidePanel'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'

export default function Announcements() {
  const [showAnnouncementPanel, setShowAnnouncementPanel] = useState(false)
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
          time: announcement.published_at ? new Date(announcement.published_at).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }) : '12:00 AM',
          isNew: announcement.published_at ? (new Date() - new Date(announcement.published_at)) < 7 * 24 * 60 * 60 * 1000 : false, // New if published within 7 days (1 week)
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

  const openAnnouncementPanel = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementPanel(true)
  }

  const closeAnnouncementPanel = () => {
    setShowAnnouncementPanel(false)
    setSelectedAnnouncement(null)
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
        {/* Breadcrumbs */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1 text-sm text-gray-500">
            <li>
              <Link href="/resident" className="hover:text-gray-700">
                Dashboard
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">Announcements</span>
            </li>
          </ol>
        </nav>

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
                      onClick={() => openAnnouncementPanel(announcement)}
                    >
                      <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 shadow-sm hover:shadow-md">
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
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
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

                {/* Load more Skeleton Placeholders */}
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

                {/* Load more Button */}
                {hasMore && !isLoadingMore && (
                  <div className="text-center pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={loadMoreAnnouncements}
                      className="text-sm text-gray-800 hover:text-blue-800 underline underline-offset-2 transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Details SlidePanel */}
      <SlidePanel
        open={showAnnouncementPanel}
        onClose={closeAnnouncementPanel}
        title="Announcement Details"
        subtitle=""
      >
        {selectedAnnouncement && <AnnouncementContent announcement={selectedAnnouncement} />}
      </SlidePanel>

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </>
  )

  // Announcement content component for SlidePanel
  function AnnouncementContent({ announcement }) {
    if (!announcement) return null

    return (
      <div className="space-y-4">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold text-gray-900 leading-tight flex-1">
                {announcement.title}
              </h1>
              {/* Status Badges */}
              <div className="flex gap-2 flex-shrink-0">
                {announcement.isNew && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    New
                  </span>
                )}
                {announcement.is_urgent && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <i className="bi bi-exclamation-triangle-fill mr-1"></i>
                    Urgent
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Section */}
            <div className="space-y-4">
              {/* Published Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <i className="bi bi-calendar3 text-gray-400"></i>
                <span>Published:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(announcement.date)} at {announcement.time}
                </span>
              </div>

              {/* Announcement Type */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <i className="bi bi-tag text-gray-400"></i>
                <span>Type:</span>
                <span className="font-medium text-gray-900">
                  {getTypeName(announcement.type)}
                </span>
              </div>
            </div>

            {/* Announcement Content */}
            <div className="border-t border-gray-100 pt-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <div className="relative">
                  {/* Paper-style content */}
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {announcement.fullDescription || announcement.content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
