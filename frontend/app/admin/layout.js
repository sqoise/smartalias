'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthProvider from '../../components/authenticated/AuthProvider.jsx'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'
import PageLoadingV2 from '../../components/common/PageLoadingV2.jsx'
import ApiClient from '../../lib/apiClient.js'
import { isAdmin, isStaff } from '../../lib/constants.js'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [showSessionExpired, setShowSessionExpired] = useState(false)

  // Check authentication and admin/staff role on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResponse = await ApiClient.getSession()
        
        if (!sessionResponse.success) {
          // Check if it's a session expiration (401 or 403)
          if (sessionResponse.status === 401 || sessionResponse.status === 403 || sessionResponse.sessionExpired) {
            // Don't redirect - show modal via AuthProvider
            setShowSessionExpired(true)
            setIsLoading(false)
            return
          }
          
          // Other auth errors - redirect to login
          router.replace('/login')
          return
        }

        const user = sessionResponse.data // Fixed: Use .data instead of .user
        
        // Check if user has admin or staff role
        if (!isStaff(user.role)) {
          router.push('/not-found')
          return
        }

        // User is authenticated and is admin or staff
        setIsAuthenticated(true)
        setUserInfo(user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading screen while checking authentication
  if (isLoading) {
    return <PageLoadingV2 isLoading={true} />
  }

  // If session expired, render AuthProvider so modal can show
  if (showSessionExpired) {
    return (
      <AuthProvider>
        <div></div>
      </AuthProvider>
    )
  }

  // Don't render anything if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null
  }
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (pathname.includes('/residents')) {
      return 'Residents Management'
    }
    if (pathname.includes('/announcements')) {
      return 'Announcements Management'
    }
    if (pathname.includes('/documents')) {
      return 'Document Services Management'
    }
    return 'Admin Dashboard'
  }

  return (
    <AuthProvider>
      <DashboardLayout 
        header={<Header role="admin" userName={userInfo?.username || 'Admin'} title={getPageTitle()} />} 
        sidebar={<Sidebar role="admin" />}
      >
        {children}
      </DashboardLayout>
    </AuthProvider>
  )
}
