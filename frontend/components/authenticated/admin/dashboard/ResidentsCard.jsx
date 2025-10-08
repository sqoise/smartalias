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

export default function ResidentsCard() {
  const [loading, setLoading] = useState(true)
  const [residentsData, setResidentsData] = useState({
    total: 0,
    recent: 0,
    weekly: 0
  })

  useEffect(() => {
    const loadResidents = async () => {
      try {
        setLoading(true)
        const response = await ApiClient.request('/dashboard/lightweight')
        
        if (response.success) {
          setResidentsData({
            total: response.data.residents.total,
            recent: response.data.residents.recent,
            weekly: response.data.residents.weekly || 0
          })
        }
      } catch (error) {
        console.error('Error loading residents:', error)
      } finally {
        setLoading(false)
      }
    }
    loadResidents()
  }, [])

  if (loading) {
    return <StatCardSkeleton />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Residents</p>
          <p className="text-2xl font-bold text-gray-900">
            {residentsData.total.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-1">
            <i className="bi bi-arrow-up mr-1"></i>
            +{residentsData.recent} this month
          </p>
        </div>
        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
          <i className="bi bi-people text-xl text-blue-600"></i>
        </div>
      </div>
    </div>
  )
}
