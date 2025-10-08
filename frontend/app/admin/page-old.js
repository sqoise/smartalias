'use client'

import { useState } from 'react'

// Import all dashboard components
import ResidentsCard from '../../components/authenticated/admin/dashboard/ResidentsCard'
import AnnouncementsCard from '../../components/authenticated/admin/dashboard/AnnouncementsCard'
import ApplicationsCard from '../../components/authenticated/admin/dashboard/ApplicationsCard'
import SystemStatusCard from '../../components/authenticated/admin/dashboard/SystemStatusCard'
import CategoriesChart from '../../components/authenticated/admin/dashboard/CategoriesChart'
import ActivityCard from '../../components/authenticated/admin/dashboard/ActivityCard'

export default function AdminDashboard() {
  // Simple state for overall dashboard - no complex data management
  const [dashboardTitle] = useState('Admin Dashboard')

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards - Each independent component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResidentsCard />
        <AnnouncementsCard />
        <ApplicationsCard />
        <SystemStatusCard />
      </div>

      {/* Charts and Analytics - Independent components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoriesChart />
        <ActivityCard />
      </div>

      {/* Quick Actions - Static content, no loading needed */}
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
  )
}

  // System Status states
  const [systemStatus, setSystemStatus] = useState({
    api: { available: false, loading: true },
    db: { available: false, loading: true },
    sms: { available: false, loading: true }
  })

  // AI Status state
  const [aiStatus, setAiStatus] = useState({
    available: false,
    loading: true
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

  // Independent useEffects for each card
  
  // Residents Card
  useEffect(() => {
    const loadResidents = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, residents: true }))
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
        setLoadingStates(prev => ({ ...prev, residents: false }))
      }
    }
    loadResidents()
  }, [])

  // Announcements Card
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, announcements: true }))
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
        setLoadingStates(prev => ({ ...prev, announcements: false }))
      }
    }
    loadAnnouncements()
  }, [])

  // Applications Card
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, applications: true }))
        // Mock data for now since no real endpoint
        setTimeout(() => {
          setApplicationsData({ pending: 12 })
          setLoadingStates(prev => ({ ...prev, applications: false }))
        }, 300)
      } catch (error) {
        console.error('Error loading applications:', error)
        setLoadingStates(prev => ({ ...prev, applications: false }))
      }
    }
    loadApplications()
  }, [])

  // System Status Card - API Check
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

  // System Status Card - DB Check
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

  // System Status Card - SMS Check
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

  // System Status Card - AI Check
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

  // Categories Chart
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, categories: true }))
        const response = await ApiClient.request('/dashboard/categories')
        
        if (response.success) {
          setCategoriesData(response.data)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoadingStates(prev => ({ ...prev, categories: false }))
      }
    }
    loadCategories()
  }, [])

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

  // Activity Card
  useEffect(() => {
    const loadActivity = async () => {
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
    }
    loadActivity()
  }, [])

  // Health Card
  useEffect(() => {
    const loadHealth = async () => {
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
    }
    loadHealth()
  }, [])

  // Trends Card
  useEffect(() => {
    const loadTrends = async () => {
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
    }
    loadTrends()
  }, [])

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
      {/* Key Metrics Cards - Each independent component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResidentsCard />
        <AnnouncementsCard />
        <ApplicationsCard />
        <SystemStatusCard />
      </div>

      {/* Charts and Analytics - Independent components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoriesChart />
        <ActivityCard />
      </div>

      {/* Quick Actions - Static content, no loading needed */}
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
  )
}
