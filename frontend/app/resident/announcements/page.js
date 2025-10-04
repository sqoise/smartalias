'use client'

import { useState } from 'react'

export default function Announcements() {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  // Demo: Sample announcements data
  const announcements = [
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
      title: 'Updated Office Hours',
      content: 'Please be informed that barangay office hours have been updated. We are now open Monday to Friday, 8:00 AM to 5:00 PM, and Saturday 8:00 AM to 12:00 PM.',
      fullDescription: 'We would like to inform all residents about the updated barangay office hours to better serve our community. Effective immediately, our office will be open Monday through Friday from 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 PM. We will be closed on Sundays and national holidays. These extended hours are designed to accommodate residents who work during regular business hours and need access to barangay services. All document processing, certificate issuance, and other administrative services will be available during these times. For urgent matters outside of office hours, please contact our emergency hotline. We appreciate your understanding and look forward to serving you better with these improved operating hours.',
      category: 'news',
      date: '2024-09-10',
      time: '13:20',
      isNew: false,
      image: '/images/barangay_logo.png'
    },
    {
      id: 6,
      title: 'Disaster Preparedness Seminar',
      content: 'All residents are invited to attend the disaster preparedness seminar on September 25th at 2:00 PM at the barangay hall. Learn about emergency procedures and safety measures.',
      fullDescription: 'In line with our commitment to community safety and preparedness, we are organizing a comprehensive disaster preparedness seminar for all residents. This important event will be held on September 25th at 2:00 PM at the barangay hall. The seminar will cover essential topics including earthquake safety, flood preparedness, fire prevention, basic first aid, and emergency evacuation procedures. Expert speakers from the local disaster risk reduction office will conduct the training sessions. Participants will receive emergency preparedness kits and informational materials to take home. We will also demonstrate proper use of emergency equipment and conduct evacuation drills. This seminar is crucial for ensuring our community is well-prepared for any emergency situation. Light refreshments will be provided. Space is limited, so please register at the barangay office in advance.',
      category: 'activities',
      date: '2024-09-08',
      time: '10:30',
      isNew: false,
      image: '/images/bg.jpg'
    }
  ]

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
              <p className="text-sm text-gray-600 mt-0.5">Stay updated with barangay news and activities</p>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
            <p className="text-sm text-gray-500 mt-0.5">Latest updates and information</p>
          </div>
          
          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-8">
                <i className="bi bi-megaphone text-3xl text-gray-300 mb-3 block"></i>
                <p className="text-gray-500 text-sm">No announcements found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="group cursor-pointer"
                    onClick={() => openAnnouncementModal(announcement)}
                  >
                    <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200">
                      {/* Date Column */}
                      <div className="flex-shrink-0 w-14 text-center">
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
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors leading-tight">
                                {announcement.title}
                              </h3>
                              {announcement.isNew && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                              {announcement.content}
                            </p>
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
                src={selectedAnnouncement.image} 
                alt={selectedAnnouncement.title}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.target.src = '/images/barangay_logo.png'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              {selectedAnnouncement.isNew && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                    New
                  </span>
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
              {/* Date and Time */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <i className="bi bi-calendar3"></i>
                  <span>{formatDate(selectedAnnouncement.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="bi bi-clock"></i>
                  <span>{selectedAnnouncement.time}</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                {selectedAnnouncement.title}
              </h2>

              {/* Full Description */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedAnnouncement.fullDescription}
                </p>
              </div>

              {/* Close Button */}
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
    </>
  )
}