'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
  </div>
)

export default function AnnouncementsCard() {
  const [loading, setLoading] = useState(true)
  const [announcementsData, setAnnouncementsData] = useState({
    total: 0,
    pending: 0,
    recentPublished: 0
  })

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true)
        const response = await ApiClient.request('/dashboard/lightweight')
        
        if (response.success) {
          setAnnouncementsData({
            total: response.data.announcements.total || 0,
            pending: response.data.announcements.pending,
            recentPublished: response.data.announcements.recentPublished || 0
          })
        }
      } catch (error) {
        console.error('Error loading announcements:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnnouncements()
  }, [])

  if (loading) {
    return <StatCardSkeleton />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Pending Announcements</p>
          <p className="text-2xl font-bold text-gray-900">
            {announcementsData.pending}
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            <i className="bi bi-clock mr-1"></i>
            Awaiting publish
          </p>
        </div>
        <div className="w-14 h-14 bg-yellow-50 rounded-xl flex items-center justify-center">
          <i className="bi bi-megaphone text-xl text-yellow-600"></i>
        </div>
      </div>
    </div>
  )
}
