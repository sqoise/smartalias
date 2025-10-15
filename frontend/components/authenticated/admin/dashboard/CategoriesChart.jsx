'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

export default function CategoriesChart() {
  const [chartData, setChartData] = useState({
    loading: true,
    categories: []
  })
  const [animateProgress, setAnimateProgress] = useState(false)

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setChartData(prev => ({ ...prev, loading: true }))
        
        // Get resident categories from API
        const response = await ApiClient.get('/dashboard/categories')
        
        if (response.success) {
          const data = response.data
          
          // Transform API data to chart format
          const residentTypes = [
            { name: 'Regular', count: data.regular || 0, color: 'bg-blue-600' },
            { name: 'Senior Citizens', count: data.senior || 0, color: 'bg-green-600' },
            { name: 'PWD', count: data.pwd || 0, color: 'bg-purple-600' },
            { name: 'Solo Parent', count: data.solo_parent || 0, color: 'bg-orange-500' }
          ]
          
          setChartData({
            loading: false,
            categories: residentTypes
          })

          // Trigger animation after data loads
          setTimeout(() => {
            setAnimateProgress(true)
          }, 100)
        } else {
          throw new Error('Failed to fetch resident categories')
        }
        
      } catch (error) {
        console.error('Error loading resident categories:', error)
        setChartData({
          loading: false,
          categories: []
        })
      }
    }
    
    loadChartData()
  }, [])

  const totalResidents = chartData.categories.reduce((sum, cat) => sum + cat.count, 0)

  if (chartData.loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-300 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-300 rounded flex-1 animate-pulse"></div>
              <div className="w-8 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resident Types</h3>
      
      {chartData.categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="bi bi-people text-2xl mb-2 block"></i>
          <p className="text-sm">No resident data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.categories.map((category, index) => {
            const percentage = totalResidents > 0 ? (category.count / totalResidents) * 100 : 0
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <span className="text-sm text-gray-700 truncate">{category.name}</span>
                </div>
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                    {/* Racing fill animation from 0% to target % */}
                    <div 
                      className={`h-3 rounded-full ${category.color}`}
                      style={{ 
                        width: animateProgress ? `${percentage}%` : '0%',
                        transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${index * 200}ms`
                      }}
                    >
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 min-w-[35px] text-right">
                    {percentage}%
                  </span>
                  <span className="text-sm font-medium text-gray-900 min-w-[30px] text-right">
                    {category.count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
