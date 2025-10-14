'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicLayout from '../../components/public/PublicLayout'
import ApiClient from '../../lib/apiClient'
import { USER_ROLES, ANNOUNCEMENT_TYPE_NAMES } from '../../lib/constants'

// Global flag to prevent duplicate fetches across component remounts
let globalFetchLock = false
let globalFetchPromise = null

// Navigation Header Component
function NavigationHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const sessionResponse = await ApiClient.getSession()
        if (sessionResponse.success) {
          setIsAuthenticated(true)
          setUserRole(sessionResponse.data.role) // Fixed: Use .data instead of .user
        }
      } catch (error) {
        // User is not authenticated, which is fine for home page
        console.log('User not authenticated')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  const handleDashboardClick = () => {
    // Redirect based on user role
    if (userRole === USER_ROLES.RESIDENT) {
      router.push('/resident')
    } else {
      router.push('/admin')
    }
  }

  if (isLoading) {
    return (
      <header className="absolute top-0 left-0 right-0 z-[50] p-4 lg:p-6">
        <nav className="flex justify-end items-center">
          <div className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700">
            Loading...
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-[50] p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        {isAuthenticated ? (
          <button
            onClick={handleDashboardClick}
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200 cursor-pointer"
          >
            Go to Dashboard
          </button>
        ) : (
          <Link 
            href="/login"
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  )
}

// Announcement Card Component
function AnnouncementCard({ announcement, onClick, getTypeName, getTypeIcon, getTypeBadgeColor }) {
  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`)
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const { date, time } = formatDateTime(announcement.date, announcement.time)

  return (
    <div 
      onClick={() => onClick(announcement)}
      className="bg-white border border-gray-200 rounded-md p-2.5 hover:shadow-sm hover:border-gray-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center space-x-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border ${getTypeBadgeColor(announcement.type)}`}>
            <i className={`${getTypeIcon(announcement.type)} mr-1 text-xs`}></i>
            {getTypeName(announcement.type)}
          </span>
          {announcement.isNew && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
              New
            </span>
          )}
          {announcement.is_urgent && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
              <i className="bi bi-exclamation-triangle-fill mr-1 text-xs"></i>
              Urgent
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 text-right flex-shrink-0 ml-2">
          <div className="font-medium">{date}</div>
          <div>{time}</div>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-1 text-sm leading-tight">
        {announcement.title}
      </h3>
      
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-1 mb-1.5">
        {announcement.content}
      </p>

      {/* Read more indicator */}
      <div className="flex items-center justify-end text-blue-600 text-xs">
        <span className="hover:underline">Read more</span>
        <i className="bi bi-arrow-right ml-1 text-xs"></i>
      </div>
    </div>
  )
}

// Homepage Content Component
function HomepageContent({ className = '' }) {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper functions for announcement types
  const getTypeName = (typeId) => {
    return ANNOUNCEMENT_TYPE_NAMES[typeId] || 'General'
  }

  const getTypeIcon = (typeId) => {
    // All announcement types use the same gray megaphone icon
    return 'bi bi-megaphone text-gray-500'
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

  // Fetch announcements on mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      // If already fetching, wait for that promise
      if (globalFetchLock) {
        if (globalFetchPromise) {
          const cachedData = await globalFetchPromise
          if (cachedData) {
            setAnnouncements(cachedData)
            setIsLoading(false)
          }
        }
        return
      }
      
      // Lock and start fetching
      globalFetchLock = true
      
      try {
        setIsLoading(true)
        
        globalFetchPromise = (async () => {
          const response = await ApiClient.getPublishedAnnouncements(3, 0)
          
          if (response.success && response.data && response.data.announcements) {
            const transformedData = response.data.announcements.map(announcement => ({
              id: announcement.id,
              title: announcement.title,
              content: announcement.content,
              fullDescription: announcement.content,
              type: announcement.type,
              is_urgent: announcement.is_urgent,
              created_at: announcement.created_at,
              published_at: announcement.published_at,
              date: announcement.published_at ? new Date(announcement.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              time: announcement.published_at ? new Date(announcement.published_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '00:00',
              isNew: announcement.published_at ? (new Date() - new Date(announcement.published_at)) < 3 * 24 * 60 * 60 * 1000 : false,
              image: '/images/barangay_logo.png'
            }))
            return transformedData
          }
          return []
        })()
        
        const data = await globalFetchPromise
        setAnnouncements(data)
      } catch (error) {
        setAnnouncements([])
      } finally {
        setIsLoading(false)
        // Short lock (100ms) just to prevent duplicate mount calls
        setTimeout(() => {
          globalFetchLock = false
          globalFetchPromise = null
        }, 100)
      }
    }
    
    fetchAnnouncements()
    
    // Clear cache when component unmounts (user navigates away)
    return () => {
      globalFetchLock = false
      globalFetchPromise = null
    }
  }, [])

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementModal(true)
  }

  return (
    <div className={`w-full max-w-sm lg:max-w-md ${className}`}>
      {/* Remove ToastNotification - no error messages needed */}
      
      {/* Header Section - More compact */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Announcements
        </h2>
        <p className="text-xs text-gray-600">
          Stay updated with the latest barangay news and events
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-2.5 animate-pulse">
              {/* Top row: badge and date/time */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-1">
                  <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
              
              {/* Title */}
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              
              {/* Content preview */}
              <div className="h-3 bg-gray-200 rounded w-full mb-1.5"></div>
              
              {/* Read more indicator */}
              <div className="flex justify-end">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcements List - More compact spacing */}
      {!isLoading && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement}
              onClick={handleAnnouncementClick}
              getTypeName={getTypeName}
              getTypeIcon={getTypeIcon}
              getTypeBadgeColor={getTypeBadgeColor}
            />
          ))}
        </div>
      )}

      {/* No Announcements / Database Error State - Show Announcement Icon */}
      {!isLoading && announcements.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <i className="bi bi-megaphone text-gray-300 text-6xl"></i>
          </div>
          <p className="text-sm text-gray-500">No announcements at this time</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[9000]">
          <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] sm:max-h-[85vh] overflow-hidden shadow-xl mx-2 sm:mx-0">
            {/* Modal Header with Image */}
            <div className="relative">
              <img 
                src={selectedAnnouncement.image} 
                alt={selectedAnnouncement.title}
                className="w-full h-24 sm:h-32 object-cover"
                onError={(e) => {
                  e.target.src = '/images/barangay_logo.png'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5">
                {selectedAnnouncement.isNew && (
                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                    New
                  </span>
                )}
                {selectedAnnouncement.is_urgent && (
                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm">
                    <i className="bi bi-exclamation-triangle-fill mr-1"></i>
                    Urgent
                  </span>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-6rem)] sm:max-h-[calc(85vh-8rem)]">
              {/* Type Badge, Date and Time */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${getTypeBadgeColor(selectedAnnouncement.type)}`}>
                  <i className={`${getTypeIcon(selectedAnnouncement.type)} mr-1`}></i>
                  {getTypeName(selectedAnnouncement.type)}
                </span>
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <i className="bi bi-calendar3"></i>
                    <span>{new Date(selectedAnnouncement.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: '2-digit',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="bi bi-clock"></i>
                    <span>{selectedAnnouncement.time}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">
                {selectedAnnouncement.title}
              </h2>

              {/* Full Description */}
              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.fullDescription}
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-center sm:justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 sm:px-4 sm:py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicLayout
        showCard={true}
        title="Barangay LIAS"
        subtitle="Digital services and document requests for residents and visitors. Access barangay services conveniently online."
        allowAuthenticated={true}
      >
        <HomepageContent />
      </PublicLayout>
      
      {/* Navigation overlay - no wrapper to avoid stacking context issues */}
      <NavigationHeader />
    </>
  )
}
