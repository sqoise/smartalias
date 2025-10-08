'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

export default function ActivityCard() {
  const [activityData, setActivityData] = useState({
    loading: true,
    recent: [],
    error: null
  })

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setActivityData(prev => ({ ...prev, loading: true, error: null }))
        
        // Mock recent activity data - can be replaced with real API call
        const mockActivity = [
          {
            id: 1,
            type: 'registration',
            description: 'New resident registered',
            user: 'Maria Santos',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            icon: 'bi-person-plus',
            color: 'text-green-600'
          },
          {
            id: 2,
            type: 'request',
            description: 'Barangay clearance requested',
            user: 'Juan Dela Cruz',
            timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            icon: 'bi-file-earmark-text',
            color: 'text-blue-600'
          },
          {
            id: 3,
            type: 'document',
            description: 'Cedula document issued',
            user: 'Admin User',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            icon: 'bi-check-circle',
            color: 'text-purple-600'
          },
          {
            id: 4,
            type: 'announcement',
            description: 'New announcement posted',
            user: 'Admin User',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            icon: 'bi-megaphone',
            color: 'text-orange-600'
          }
        ]
        
        setActivityData({
          loading: false,
          recent: mockActivity,
          error: null
        })
      } catch (error) {
        console.error('Error loading activity:', error)
        setActivityData({
          loading: false,
          recent: [],
          error: 'Failed to load recent activity'
        })
      }
    }
    
    loadActivity()
  }, [])

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  if (activityData.loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-6 bg-gray-300 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-green-600 hover:text-green-700 font-medium">
          View All
        </button>
      </div>
      
      {activityData.error ? (
        <div className="text-center py-8 text-gray-500">
          <i className="bi bi-exclamation-triangle text-2xl mb-2 block"></i>
          <p className="text-sm">{activityData.error}</p>
        </div>
      ) : activityData.recent.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="bi bi-clock-history text-2xl mb-2 block"></i>
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activityData.recent.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className={`${activity.icon} ${activity.color} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span className="truncate">{activity.user}</span>
                  <span className="mx-2">•</span>
                  <span className="whitespace-nowrap">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
