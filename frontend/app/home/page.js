'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicLayout from '../../components/public/PublicLayout'
import SlidePanel from '../../components/common/SlidePanel'
import ApiClient from '../../lib/apiClient'
import { USER_ROLES, ANNOUNCEMENT_TYPE_NAMES } from '../../lib/constants'

// Global flag to prevent duplicate fetches across component remounts
let globalFetchLock = false
let globalFetchPromise = null

// Navigation Header Component
function NavigationHeader({ hide = false }) {
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

  // Hide header when slide panel is open
  if (hide) return null

  if (isLoading) {
    return (
      <header className="absolute top-0 left-0 right-0 z-40 p-4 lg:p-6">
        <nav className="flex justify-end items-center">
          <div className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700">
            Loading...
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-4 lg:p-6">
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
function HomepageContent({ className = '', onPanelOpenChange }) {
  const [showAnnouncementPanel, setShowAnnouncementPanel] = useState(false)
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
    setShowAnnouncementPanel(true)
    onPanelOpenChange?.(true)
  }

  const handleClosePanel = () => {
    setShowAnnouncementPanel(false)
    onPanelOpenChange?.(false)
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

      {/* Announcement Detail Slide Panel */}
      <SlidePanel
        open={showAnnouncementPanel}
        onClose={handleClosePanel}
        title='Announcement Details'
        headerIcon="bi bi-megaphone"
        size="lg"
        closeOnEscape={true}
      >
        {selectedAnnouncement && (
          <div className="space-y-0">
            {/* Blog Article Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Article Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                {/* Title */}
                <div className="mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedAnnouncement.title}
                  </h1>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  {/* First Row - Published Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-send-check text-gray-400" />
                      <span className="text-xs">Published: {new Date(selectedAnnouncement.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: '2-digit',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>

                  {/* Second Row - Type and Urgent */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {/* Announcement Type */}
                    <div className="flex items-center gap-1.5 text-left">
                      <i className="bi bi-tag text-gray-400" />
                      <span className="text-xs">Type:</span>
                      <span className="text-xs text-blue-700 font-medium">{getTypeName(selectedAnnouncement.type)}</span>
                      {selectedAnnouncement.is_urgent && (
                        <>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-red-700 font-medium">
                            <i className="bi bi-exclamation-triangle-fill mr-1" />
                            Urgent
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Content - Paper Style */}
              <div className="px-6 py-5">
                {/* Paper Container */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                  {/* Paper Header */}
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-gray-400 font-mono">
                        {selectedAnnouncement.content?.length || 0} chars
                      </span>
                    </div>
                  </div>
                  
                  {/* Paper Content */}
                  <div className="p-6 bg-white">
                    <div className="prose prose-base max-w-none">
                      <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-normal">
                        {selectedAnnouncement.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  )
}

export default function HomePage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <>
      <PublicLayout
        showCard={true}
        title="Barangay LIAS"
        subtitle="Digital services and document requests for residents and visitors. Access barangay services conveniently online."
        allowAuthenticated={true}
      >
        <HomepageContent onPanelOpenChange={setIsPanelOpen} />
      </PublicLayout>
      
      {/* Navigation overlay - no wrapper to avoid stacking context issues */}
      <NavigationHeader hide={isPanelOpen} />
    </>
  )
}
