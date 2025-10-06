'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ApiClient from '../../lib/apiClient'

export default function AdminDashboard() {
  // Progressive loading states
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    activity: true,
    health: true,
    trends: true
  })

  // Add CSS animation for bar chart
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes growWidth {
        from {
          width: 0%;
        }
        to {
          width: var(--target-width);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Counter animation hook
  const useCounterAnimation = (end, duration = 600, delay = 0) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        let start = 0;
        const increment = end / (duration / 16); // 60fps
        const counter = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(counter);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
        return () => clearInterval(counter);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [end, duration, delay]);

    return count;
  };

  const [dashboardData, setDashboardData] = useState({
    residents: {
      total: 0,
      recent: 0,
      weekly: 0,
      categories: {
        pwd: 0,
        senior: 0,
        solo_parent: 0,
        regular: 0
      }
    },
    announcements: {
      total: 0,
      pending: 0,
      recentPublished: 0
    },
    sms: {
      totalSent: 0,
      today: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0
    },
    system: {
      lastUpdated: null,
      dbStatus: 'unknown'
    }
  })
  
  const [recentActivity, setRecentActivity] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [trends, setTrends] = useState(null)
  
  // Intersection Observer for lazy loading
  const observerRef = useRef(null)
  const [visibleSections, setVisibleSections] = useState(new Set(['stats'])) // Always load stats first

  // Progressive data loading functions
  const loadLightweightStats = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, stats: true }))
      const response = await ApiClient.request('/dashboard/lightweight')
      
      if (response.success) {
        // Update only basic stats, keep other data structure intact
        setDashboardData(prev => ({
          ...prev,
          residents: {
            ...prev.residents,
            total: response.data.residents.total,
            recent: response.data.residents.recent
          },
          announcements: {
            ...prev.announcements,
            pending: response.data.announcements.pending
          },
          system: response.data.system
        }))
      }
    } catch (error) {
      console.error('Error loading lightweight stats:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, stats: false }))
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const response = await ApiClient.request('/dashboard/categories')
      
      if (response.success) {
        setDashboardData(prev => ({
          ...prev,
          residents: {
            ...prev.residents,
            categories: response.data
          }
        }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  const loadSMSStats = useCallback(async () => {
    try {
      const response = await ApiClient.request('/dashboard/sms')
      
      if (response.success) {
        setDashboardData(prev => ({
          ...prev,
          sms: response.data
        }))
      }
    } catch (error) {
      console.error('Error loading SMS stats:', error)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, activity: true }))
      const response = await ApiClient.request('/dashboard/activity')
      
      if (response.success) {
        setRecentActivity(response.data)
      }
    } catch (error) {
      console.error('Error loading activity:', error)
      setRecentActivity([])
    } finally {
      setLoadingStates(prev => ({ ...prev, activity: false }))
    }
  }, [])

  const loadHealth = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, health: true }))
      const response = await ApiClient.request('/dashboard/health')
      
      if (response.success) {
        setSystemHealth(response.data)
      }
    } catch (error) {
      console.error('Error loading health:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, health: false }))
    }
  }, [])

  const loadTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, trends: true }))
      const response = await ApiClient.request('/dashboard/trends')
      
      if (response.success) {
        setTrends(response.data)
      }
    } catch (error) {
      console.error('Error loading trends:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false }))
    }
  }, [])

  // Intersection Observer setup for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.dataset.section
            setVisibleSections(prev => new Set([...prev, section]))
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '100px 0px 100px 0px' // Start loading 100px before element is visible
      }
    )

    observerRef.current = observer
    return () => observer.disconnect()
  }, [])

  // Progressive loading based on visible sections
  useEffect(() => {
    if (visibleSections.has('stats')) {
      loadLightweightStats()
      // Load additional data progressively
      setTimeout(() => {
        loadCategories()
        loadSMSStats()
      }, 100) // Small delay to prioritize critical stats
    }
  }, [visibleSections, loadLightweightStats, loadCategories, loadSMSStats])

  useEffect(() => {
    if (visibleSections.has('activity')) {
      loadActivity()
    }
  }, [visibleSections, loadActivity])

  useEffect(() => {
    if (visibleSections.has('health')) {
      loadHealth()
    }
  }, [visibleSections, loadHealth])

  useEffect(() => {
    if (visibleSections.has('trends')) {
      loadTrends()
    }
  }, [visibleSections, loadTrends])

  // Auto-refresh for critical data only
  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleSections.has('stats')) {
        loadLightweightStats()
      }
    }, 5 * 60 * 1000) // Refresh lightweight stats every 5 minutes
    
    return () => clearInterval(interval)
  }, [visibleSections, loadLightweightStats])

  // Ref callback for intersection observer
  const observeElement = useCallback((element, section) => {
    if (element && observerRef.current) {
      element.dataset.section = section
      observerRef.current.observe(element)
    }
  }, [])

  // Skeleton loading components
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

  const ChartSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
      <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse flex-shrink-0"></div>
      <div className="flex-1 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1">
            {/* Category label skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-8 animate-pulse"></div>
            </div>
            {/* Bar skeleton */}
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div className="h-4 bg-gray-300 rounded-full animate-pulse" style={{width: `${20 + i * 15}%`}}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ActivitySkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
      <div className="h-6 bg-gray-200 rounded w-28 mb-6 animate-pulse flex-shrink-0"></div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  // Counter component for animated numbers
  const AnimatedCounter = ({ value, delay = 0 }) => {
    const animatedValue = useCounterAnimation(value, 600, delay);
    return <span>{animatedValue}</span>;
  };

  const BarChart = ({ data, colors, title }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)
    if (total === 0) return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="bi bi-bar-chart text-gray-400"></i>
          </div>
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )

    const maxValue = Math.max(...Object.values(data))
    const segments = Object.entries(data).map(([key, value], index) => ({
      key,
      value,
      percentage: Math.round((value / total) * 100),
      barWidth: (value / maxValue) * 100,
      color: colors[index % colors.length]
    }))

    return (
      <div className="h-full flex flex-col">
        {/* Bar chart */}
        <div className="flex-1 space-y-3">
          {segments.map((segment, index) => (
            <div key={segment.key} className="space-y-1">
              {/* Category label and value */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {(() => {
                      const key = segment.key.toLowerCase();
                      if (key.includes('pwd') || key.includes('disability')) return 'PWD';
                      if (key.includes('senior')) return 'Senior Citizen';
                      if (key.includes('solo') || key.includes('parent')) return 'Solo Parent';
                      if (key.includes('regular') || key.includes('normal')) return 'Regular';
                      // Fallback to formatted version
                      return segment.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    })()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {segment.value} <span className="text-xs text-gray-500">(<AnimatedCounter value={segment.percentage} delay={index * 100} />%)</span>
                </span>
              </div>
              
              {/* Bar */}
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    backgroundColor: segment.color,
                    '--target-width': `${segment.barWidth}%`,
                    animation: `growWidth 0.6s ease-out ${index * 0.1}s forwards`,
                    width: '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards - Always loaded first */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" ref={(el) => observeElement(el, 'stats')}>
        {/* Total Residents */}
        {loadingStates.stats ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.residents.total.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <i className="bi bi-arrow-up mr-1"></i>
                  +{dashboardData.residents.recent} this month
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <i className="bi bi-people text-xl text-blue-600"></i>
              </div>
            </div>
          </div>
        )}

        {/* Pending Announcements */}
        {loadingStates.stats ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Announcements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.announcements.pending}
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
        )}

        {/* Pending Applications */}
        {loadingStates.stats ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.pendingApplications || 12}
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
        )}

        {/* System Status */}
        {loadingStates.stats ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">System Status</p>
                {/* Status logic: Online (all green), Degraded (some red), Offline (all red) */}
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const apiStatus = true; // Replace with actual API status
                    const dbStatus = true;  // Replace with actual DB status  
                    const smsStatus = true; // Replace with actual SMS status
                    const onlineCount = [apiStatus, dbStatus, smsStatus].filter(Boolean).length;
                    
                    if (onlineCount === 3) return "Online";
                    if (onlineCount === 0) return "Offline"; 
                    return "Degraded";
                  })()}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-600">API</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-600">DB</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-600">SMS</span>
                  </div>
                </div>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <i className="bi bi-shield-check text-xl text-green-600"></i>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts and Analytics - Lazy loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Special Categories Breakdown */}
        <div ref={(el) => observeElement(el, 'activity')}>
          {loadingStates.stats ? (
            <ChartSkeleton />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
              <h3 className="text-base font-semibold text-gray-900 mb-6 flex-shrink-0">Resident Categories</h3>
              <div className="flex-1">
                <BarChart 
                  data={dashboardData.residents.categories}
                  colors={['#707680ff', '#3b82f6', '#10b981', '#ec4899']}
                  title="Categories"
                />
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity - Lazy loaded */}
        <div ref={(el) => observeElement(el, 'activity')}>
          {loadingStates.activity ? (
            <ActivitySkeleton />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h3 className="text-base font-semibold text-gray-900">Recent Activities</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Last 5 activities
                </span>
              </div>
              {recentActivity.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="bi bi-clock-history text-2xl mb-2"></i>
                    <p className="text-sm">No recent activity</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => {
                      const isResident = activity.type === 'resident'
                      const isAnnouncement = activity.type === 'announcement'
                      const isDocument = activity.type === 'document' || activity.type === 'service_request'
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                          {/* Activity Icon - Using page-old.js color scheme */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isResident ? 'bg-blue-100 text-blue-600' : 
                            isAnnouncement ? 'bg-yellow-100 text-yellow-600' : 
                            isDocument ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <i className={`bi ${
                              isResident ? 'bi-person-plus' : 
                              isAnnouncement ? 'bi-megaphone' : 
                              isDocument ? 'bi-file-earmark-text' :
                              'bi-activity'
                            } text-sm`}></i>
                          </div>
                          
                          {/* Activity Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {activity.activity}
                            </p>
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {activity.details}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(activity.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          
                          {/* Activity Type Badge - Matching icon colors */}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            isResident ? 'bg-blue-50 text-blue-700' : 
                            isAnnouncement ? 'bg-yellow-50 text-yellow-700' : 
                            isDocument ? 'bg-purple-50 text-purple-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Lazy loaded */}
      <div ref={(el) => observeElement(el, 'health')}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/admin/residents" 
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <i className="bi bi-people text-blue-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Residents</p>
                  <p className="text-sm text-gray-500">View and edit records</p>
                </div>
              </div>
              <i className="bi bi-arrow-right text-gray-400 group-hover:text-blue-600"></i>
            </a>

            <a 
              href="/admin/announcements" 
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                  <i className="bi bi-megaphone text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Announcements</p>
                  <p className="text-sm text-gray-500">Create and manage</p>
                </div>
              </div>
              <i className="bi bi-arrow-right text-gray-400 group-hover:text-green-600"></i>
            </a>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-file-earmark-text text-gray-500"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Applications</p>
                  <p className="text-sm text-gray-500">Coming soon...</p>
                </div>
              </div>
              <i className="bi bi-lock text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
