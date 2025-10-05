'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicLayout from '../../components/public/PublicLayout'
import ApiClient from '../../lib/apiClient'
import { USER_ROLES } from '../../lib/constants'

// Sample announcements data (same as resident announcements)
const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'New Online Document Request System',
    content: 'We are pleased to announce the launch of our new online document request system. Residents can now apply for barangay clearances, certificates, and permits online. Visit our website to get started.',
    fullDescription: 'We are excited to announce the launch of our comprehensive online document request system, designed to make your interactions with the barangay more convenient and efficient. This new digital platform allows residents to apply for various documents including barangay clearances, certificates of residency, business permits, and indigency certificates from the comfort of their homes. The system features a user-friendly interface, secure document upload capabilities, and real-time status tracking. To get started, simply visit our website and create your account using your valid identification. Processing times remain the same, but you can now track your applications 24/7 and receive notifications when your documents are ready for pickup.',
    category: 'news',
    date: '2024-09-17',
    time: '09:00',
    isNew: true,
    image: '/images/barangay_logo.png'
  },
  {
    id: 2,
    title: 'Community Clean-Up Drive',
    content: 'Join us for our monthly community clean-up drive this Saturday, September 21st at 7:00 AM. Meeting point is at the barangay hall. Bring your own cleaning materials.',
    fullDescription: 'Our monthly community clean-up drive is a vital initiative that brings our neighborhood together while keeping our environment clean and healthy. This Saturday, September 21st, we invite all residents to participate in this meaningful activity starting at 7:00 AM. The meeting point will be at the barangay hall where we will distribute cleaning supplies and assign areas to different groups. Please bring your own gloves, face masks, and water bottles. We will provide garbage bags, brooms, and other cleaning equipment. The clean-up will cover all major streets, parks, and common areas within our barangay. Light refreshments will be served to all volunteers after the activity. Together, we can make our community a cleaner and more beautiful place to live.',
    category: 'activities',
    date: '2024-09-15',
    time: '14:30',
    isNew: true,
    image: '/images/bg.jpg'
  },
  {
    id: 3,
    title: 'Health and Wellness Program',
    content: 'Free medical check-up and consultation will be available every Wednesday from 9:00 AM to 3:00 PM at the barangay health center. Senior citizens and PWDs are prioritized.',
    fullDescription: 'The barangay is proud to announce our ongoing Health and Wellness Program, providing free medical services to all residents. Every Wednesday, our qualified medical professionals will be available at the barangay health center from 9:00 AM to 3:00 PM for free check-ups and consultations. This program covers basic health screenings, blood pressure monitoring, blood sugar testing, and general health consultations. Senior citizens aged 60 and above, as well as Persons with Disabilities (PWDs), will be given priority in our service queue. We also offer health education sessions covering topics such as nutrition, exercise, and disease prevention. Please bring a valid ID and your health records if available. Our goal is to ensure that every resident has access to basic healthcare services regardless of their financial situation.',
    category: 'news',
    date: '2024-09-14',
    time: '11:15',
    isNew: false,
    image: '/images/barangay_logo.png'
  },
  {
    id: 4,
    title: 'Basketball Tournament Registration',
    content: 'Registration for the annual inter-purok basketball tournament is now open. Registration fee is ₱500 per team. Deadline for registration is September 30, 2024.',
    fullDescription: 'Get ready for the most exciting sporting event of the year! The annual inter-purok basketball tournament is back, and registration is now officially open. This tournament brings together teams from all puroks within our barangay for friendly competition and community bonding. The registration fee is ₱500 per team, which covers tournament supplies, referees, and prizes for the winners. Teams must have a minimum of 8 players and a maximum of 12 players, with all players being verified residents of the barangay. The tournament will be held at the barangay basketball court starting October 15, 2024, with games scheduled on weekends. Prizes will be awarded for 1st, 2nd, and 3rd place teams, along with individual awards for MVP and Best Player. Registration deadline is September 30, 2024. Contact the barangay office for registration forms and more details.',
    category: 'activities',
    date: '2024-09-12',
    time: '16:45',
    isNew: false,
    image: '/images/bg.jpg'
  },
  {
    id: 5,
    title: 'Scholarship Program Applications',
    content: 'Applications for the barangay scholarship program are now being accepted. This program supports deserving students from low-income families. Application deadline is October 15, 2024.',
    fullDescription: 'The barangay scholarship program is designed to support the educational aspirations of deserving students from low-income families within our community. This program provides financial assistance for tuition fees, school supplies, and other educational expenses. We are now accepting applications for the upcoming school year. Eligible applicants must be residents of the barangay for at least 2 years, have a general weighted average of 85% or higher, and come from families with a combined monthly income of less than ₱15,000. Required documents include academic records, certificate of indigency, barangay clearance, and a written essay about educational goals. A total of 20 scholarships will be awarded, with amounts ranging from ₱5,000 to ₱15,000 per semester depending on the level of education. Application forms are available at the barangay office. The deadline for submission is October 15, 2024.',
    category: 'news',
    date: '2024-09-10',
    time: '08:30',
    isNew: false,
    image: '/images/barangay_logo.png'
  }
]

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
          setUserRole(sessionResponse.user.role)
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
    if (userRole === USER_ROLES.ADMIN) {
      router.push('/admin')
    } else {
      router.push('/resident')
    }
  }

  if (isLoading) {
    return (
      <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
        <nav className="flex justify-end items-center">
          <div className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700">
            Loading...
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        {isAuthenticated ? (
          <button
            onClick={handleDashboardClick}
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200"
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
function AnnouncementCard({ announcement, onClick }) {
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
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
            announcement.category === 'news' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {announcement.category === 'news' ? 'News' : 'Activity'}
          </span>
          {announcement.isNew && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
              New
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

  // Show only the first 3 announcements
  const latestAnnouncements = ANNOUNCEMENTS.slice(0, 3)

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementModal(true)
  }

  return (
    <div className={`w-full max-w-sm lg:max-w-md ${className}`}>
      {/* Header Section - More compact */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Announcements
        </h2>
        <p className="text-xs text-gray-600">
          Stay updated with the latest barangay news and events
        </p>
      </div>

      {/* Announcements List - More compact spacing */}
      <div className="space-y-3">
        {latestAnnouncements.map((announcement) => (
          <AnnouncementCard 
            key={announcement.id} 
            announcement={announcement}
            onClick={handleAnnouncementClick}
          />
        ))}
      </div>

      {/* Announcement Detail Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
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
              {selectedAnnouncement.isNew && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                    New
                  </span>
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-6rem)] sm:max-h-[calc(85vh-8rem)]">
              {/* Date and Time */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs text-gray-500 mb-3">
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

              {/* Title */}
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">
                {selectedAnnouncement.title}
              </h2>

              {/* Full Description */}
              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
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
      
      {/* Navigation overlay */}
      <NavigationHeader />
    </>
  )
}
