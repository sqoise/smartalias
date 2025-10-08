'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../../lib/apiClient'

export default function SystemStatusCard() {
  // Individual service states
  const [systemStatus, setSystemStatus] = useState({
    api: { available: false, loading: true },
    db: { available: false, loading: true },
    sms: { available: false, loading: true }
  })

  const [aiStatus, setAiStatus] = useState({
    available: false,
    loading: true
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

  // DB Status Check
  useEffect(() => {
    const loadDBStatus = async () => {
      try {
        setSystemStatus(prev => ({ 
          ...prev, 
          db: { ...prev.db, loading: true } 
        }))
        
        const response = await ApiClient.request('/dashboard/health')
        const dbHealthy = response.success && response.data?.database !== false
        setSystemStatus(prev => ({ 
          ...prev, 
          db: { available: dbHealthy, loading: false } 
        }))
      } catch (error) {
        setSystemStatus(prev => ({ 
          ...prev, 
          db: { available: false, loading: false } 
        }))
      }
    }
    loadDBStatus()
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
        setSystemStatus(prev => ({ 
          ...prev, 
          sms: { available: response.success, loading: false } 
        }))
      } catch (error) {
        setSystemStatus(prev => ({ 
          ...prev, 
          sms: { available: false, loading: false } 
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
            loading: false
          })
        } else {
          setAiStatus({
            available: false,
            loading: false
          })
        }
      } catch (error) {
        console.error('Error loading AI status:', error)
        setAiStatus({
          available: false,
          loading: false
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
                                     systemStatus.db.loading || 
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
              systemStatus.db.available,
              systemStatus.sms.available,
              aiStatus.available
            ].filter(Boolean).length
            
            const statusText = onlineCount === 4 ? "Online" : 
                              onlineCount === 0 ? "Offline" : "Degraded"
            
            return (
              <p className="text-2xl font-bold text-gray-900">{statusText}</p>
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

            {/* DB Status */}
            <div className="flex items-center">
              {systemStatus.db.loading ? (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-1 animate-pulse"></div>
                  <div className="w-4 h-3 bg-gray-300 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    systemStatus.db.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">DB</span>
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
                <>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    systemStatus.sms.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">SMS</span>
                </>
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
                <>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    aiStatus.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">AI Model</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
          <i className="bi bi-shield-check text-xl text-green-600"></i>
        </div>
      </div>
    </div>
  )
}
