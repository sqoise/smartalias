'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'
import PageLoading from '../../components/common/PageLoading.jsx'
import ApiClient from '../../lib/apiClient.js'
import { isAdmin } from '../../lib/constants.js'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Check authentication and admin role on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResponse = await ApiClient.getSession()
        
        if (!sessionResponse.success) {
          // Not authenticated - redirect to login
          router.replace('/login')
          return
        }

        const user = sessionResponse.user
        
        // Check if user has admin role
        if (!isAdmin(user.role)) {
          router.push('/forbidden')
          return
        }

        // User is authenticated and is admin
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
    return <PageLoading />
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
    <DashboardLayout 
      header={<Header role="admin" userName={userInfo?.username || 'Admin'} title={getPageTitle()} />} 
      sidebar={<Sidebar role="admin" />}
    >
      {children}
    </DashboardLayout>
  )
}
