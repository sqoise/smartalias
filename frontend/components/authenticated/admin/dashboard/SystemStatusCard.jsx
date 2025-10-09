'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

export default function SystemStatusCard() {
  // Individual service states
  const [systemStatus, setSystemStatus] = useState({
    api: { available: false, loading: true },
    sms: { available: false, loading: true, credits: 0, provider: 'Unknown', lastChecked: null }
  })

  const [aiStatus, setAiStatus] = useState({
    available: false,
    loading: true,
    model: 'Unknown'
  })

  // API Status Check
  useEffect(() => {
    const loadAPIStatus = async () => {
      try {
        setSystemStatus(prev => ({ 
          ...prev, 
          api: { ...prev.api, loading: true } 
        }))
        
        const response = await ApiClient.request('/dashboard/health')
        setSystemStatus(prev => ({ 
          ...prev, 
          api: { available: response.success, loading: false } 
        }))
      } catch (error) {
        setSystemStatus(prev => ({ 
          ...prev, 
          api: { available: false, loading: false } 
        }))
      }
    }
    loadAPIStatus()
  }, [])

  // SMS Status Check
  useEffect(() => {
    const loadSMSStatus = async () => {
      try {
        setSystemStatus(prev => ({ 
          ...prev, 
          sms: { ...prev.sms, loading: true } 
        }))
        
        const response = await ApiClient.request('/dashboard/sms')
        
        // Check both API success and service availability
        const isAvailable = response.success && response.data?.serviceStatus?.available
        
        setSystemStatus(prev => ({ 
          ...prev, 
          sms: { 
            available: isAvailable, 
            loading: false,
            credits: response.data?.serviceStatus?.credits || 0,
            provider: response.data?.serviceStatus?.provider || 'Unknown',
            lastChecked: response.data?.serviceStatus?.lastChecked || null
          } 
        }))
      } catch (error) {
        setSystemStatus(prev => ({ 
          ...prev, 
          sms: { available: false, loading: false, credits: 0, provider: 'Unknown', lastChecked: null } 
        }))
      }
    }
    loadSMSStatus()
  }, [])

  // AI Status Check
  useEffect(() => {
    const loadAI = async () => {
      try {
        setAiStatus(prev => ({ ...prev, loading: true }))
        const response = await ApiClient.get('/chatbot/ai-status')
        
        if (response.success) {
          setAiStatus({
            available: response.data.available,
            loading: false,
            model: response.data.primaryProvider || 'Unknown'
          })
        } else {
          setAiStatus({
            available: false,
            loading: false,
            model: 'Unknown'
          })
        }
      } catch (error) {
        console.error('Error loading AI status:', error)
        setAiStatus({
          available: false,
          loading: false,
          model: 'Unknown'
        })
      }
    }
    loadAI()
  }, [])

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">System Status</p>
          {(() => {
            // Simple status without complex state dependencies
            const hasLoadingServices = systemStatus.api.loading || 
                                     systemStatus.sms.loading || 
                                     aiStatus.loading
            
            if (hasLoadingServices) {
              return (
                <div className="w-20 h-8 bg-gray-300 rounded animate-pulse"></div>
              )
            }
            
            // All services loaded, calculate final status
            const onlineCount = [
              systemStatus.api.available,
              systemStatus.sms.available,
              aiStatus.available
            ].filter(Boolean).length
            
            const statusText = onlineCount === 3 ? "Online" : 
                              onlineCount === 0 ? "Offline" : "Degraded"
            
            const statusColor = onlineCount === 3 ? "text-gray-900" :
                               onlineCount === 0 ? "text-red-600" : "text-gray-800"
            
            return (
              <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            )
          })()}
          <div className="flex items-center gap-3 mt-1">
            {/* API Status */}
            <div className="flex items-center">
              {systemStatus.api.loading ? (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-1 animate-pulse"></div>
                  <div className="w-6 h-3 bg-gray-300 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    systemStatus.api.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">API</span>
                </>
              )}
            </div>

            {/* SMS Status */}
            <div className="flex items-center">
              {systemStatus.sms.loading ? (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-1 animate-pulse"></div>
                  <div className="w-6 h-3 bg-gray-300 rounded animate-pulse"></div>
                </>
              ) : (
                <div className="relative group flex items-center px-2 py-1 rounded-md hover:bg-gray-50 transition-colors duration-150 cursor-help">
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    systemStatus.sms.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    SMS
                  </span>
                  
                  {/* Custom Tailwind Tooltip - Credits Only */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                    <div className="text-center">
                      <span className="text-white">Credits: </span>
                      <span className="text-yellow-400 font-medium">{systemStatus.sms.credits}</span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Model Status */}
            <div className="flex items-center">
              {aiStatus.loading ? (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-1 animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-300 rounded animate-pulse"></div>
                </>
              ) : (
                <div className="relative group flex items-center px-2 py-1 rounded-md hover:bg-gray-50 transition-colors duration-150 cursor-help">
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    aiStatus.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">AI Model</span>
                  
                  {/* Custom Tailwind Tooltip - Model Name */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                    <div className="text-center">
                      <span className="text-white">Model: </span>
                      <span className="text-blue-400 font-medium">{aiStatus.model}</span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          (() => {
            const hasLoadingServices = systemStatus.api.loading || 
                                     systemStatus.sms.loading || 
                                     aiStatus.loading
            
            if (hasLoadingServices) {
              return "bg-gray-100"
            }
            
            const onlineCount = [
              systemStatus.api.available,
              systemStatus.sms.available,
              aiStatus.available
            ].filter(Boolean).length
            
            return onlineCount === 3 ? "bg-green-50" :
                   onlineCount === 0 ? "bg-red-50" : "bg-amber-50"
          })()
        }`}>
          <i className={`bi bi-shield-check text-xl ${
            (() => {
              const hasLoadingServices = systemStatus.api.loading || 
                                       systemStatus.sms.loading || 
                                       aiStatus.loading
              
              if (hasLoadingServices) {
                return "text-gray-400"
              }
              
              const onlineCount = [
                systemStatus.api.available,
                systemStatus.sms.available,
                aiStatus.available
              ].filter(Boolean).length
              
              return onlineCount === 3 ? "text-green-600" :
                     onlineCount === 0 ? "text-red-600" : "text-amber-600"
            })()
          }`}></i>
        </div>
      </div>
    </div>
  )
}
