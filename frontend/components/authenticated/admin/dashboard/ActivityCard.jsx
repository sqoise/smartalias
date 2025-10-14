'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

// Helper functions to map activity types to icons and colors
const getIconForActivityType = (type, activity) => {
  switch (type) {
    case 'document_request_new':
      return 'bi-file-earmark-text'
    case 'document_request_processing':
      return 'bi-hourglass-split'
    case 'document_request_rejected':
      return 'bi-x-circle'
    case 'document_request_ready':
      return 'bi-clock'
    case 'document_request_completed':
      return 'bi-check-circle'
    case 'document_request_other':
      return 'bi-file-earmark'
    case 'user_activation':
      return 'bi-person-check'
    case 'announcement':
      return 'bi-megaphone'
    case 'resident':
      return 'bi-person-plus'
    default:
      return 'bi-circle'
  }
}

const getColorForActivityType = (type, activity) => {
  switch (type) {
    case 'document_request_new':
      return 'text-blue-600'
    case 'document_request_processing':
      return 'text-blue-500'
    case 'document_request_rejected':
      return 'text-red-600'
    case 'document_request_ready':
      return 'text-purple-600'
    case 'document_request_completed':
      return 'text-green-600'
    case 'document_request_other':
      return 'text-gray-600'
    case 'user_activation':
      return 'text-green-600'
    case 'announcement':
      return 'text-orange-600'
    case 'resident':
      return 'text-green-600'
    default:
      return 'text-gray-500'
  }
}

export default function ActivityCard() {
  const [activityData, setActivityData] = useState({
    loading: true,
    recent: [],
    error: null
  })

  // Extract loadActivity function to reuse
  const loadActivity = async () => {
    try {
      setActivityData(prev => ({ ...prev, loading: true, error: null }))
      
      // Fetch real activity data from backend
      const response = await ApiClient.get('/dashboard/activity')
      
      if (response.success) {
        // Transform backend data to match frontend format and ensure unique keys
        const transformedActivity = response.data.map((item, index) => ({
          id: `${item.type}-${item.referenceId}-${index}`, // Create unique composite key
          type: item.type,
          description: item.activity,
          user: item.details,
          timestamp: item.timestamp, // Keep as string, let formatTimeAgo handle conversion
          icon: getIconForActivityType(item.type, item.activity),
          color: getColorForActivityType(item.type, item.activity)
        }))
        
        setActivityData({
          loading: false,
          recent: transformedActivity.slice(0, 4), // Limit to 4 most recent activities
          error: null
        })
      } else {
        setActivityData({
          loading: false,
          recent: [],
          error: response.message || 'Failed to load recent activity'
        })
      }
    } catch (error) {
      console.error('Error loading activity:', error)
      setActivityData({
        loading: false,
        recent: [],
        error: 'Failed to load recent activity'
      })
    }
  }

  useEffect(() => {
    loadActivity()
    // Removed auto-refresh interval - users can manually refresh using the button
  }, [])

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    // PostgreSQL returns timestamps in UTC, convert properly
    const then = new Date(timestamp)
    
    // Ensure we're working with valid dates
    if (isNaN(then.getTime())) return 'Unknown time'
    
    // Calculate difference using UTC time to avoid timezone issues
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    // Handle negative differences (future dates due to clock skew)
    if (diff < 0) return 'Just now'
    
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
        <div className="flex items-center space-x-2">
          <button
            onClick={loadActivity}
            disabled={activityData.loading}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            title="Refresh activity"
          >
            <i className={`bi bi-arrow-clockwise ${activityData.loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
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
