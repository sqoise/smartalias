'use client'

import { useState, useEffect } from 'react'

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

export default function ApplicationsCard() {
  const [loading, setLoading] = useState(true)
  const [applicationsData, setApplicationsData] = useState({
    pending: 0
  })

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true)
        // Mock data for now since no real endpoint
        setTimeout(() => {
          setApplicationsData({ pending: 12 })
          setLoading(false)
        }, 300)
      } catch (error) {
        console.error('Error loading applications:', error)
        setLoading(false)
      }
    }
    loadApplications()
  }, [])

  if (loading) {
    return <StatCardSkeleton />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Pending Applications</p>
          <p className="text-2xl font-bold text-gray-900">
            {applicationsData.pending}
          </p>
          <p className="text-sm text-purple-600 mt-1">
            <i className="bi bi-file-earmark-text mr-1"></i>
            Certificates & documents
          </p>
        </div>
        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
          <i className="bi bi-file-earmark-check text-xl text-purple-600"></i>
        </div>
      </div>
    </div>
  )
}
