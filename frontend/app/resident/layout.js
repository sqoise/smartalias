'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AuthProvider from '../../components/authenticated/AuthProvider.jsx'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'
import PageLoadingV2 from '../../components/common/PageLoadingV2.jsx'
import ApiClient from '../../lib/apiClient'

export default function ResidentLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await ApiClient.getSession()
        
        if (!session.success) {
          // Check if it's a session expiration (401 or 403)
          if (session.status === 401 || session.status === 403 || session.sessionExpired) {
            // Don't redirect - show modal via AuthProvider
            setShowSessionExpired(true)
            setIsLoading(false)
            return
          }
          
          // Other auth errors - redirect to login
          router.push('/login')
          return
        }

        const user = session.data

        // If user is admin or staff, redirect to admin dashboard
        if (user.role === 1 || user.role === 2) {
          router.push('/admin')
          return
        }

        // Valid session - user is authenticated resident
        setIsAuthenticated(true)
        setUserName(user.username || 'User')
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking authentication
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

  // Don't render content if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null
  }
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (pathname.includes('/document-requests')) {
      return 'Online Services'
    }
    if (pathname.includes('/my-requests')) {
      return 'My Document Requests'
    }
    if (pathname.includes('/announcements')) {
      return 'Announcements'
    }
    if (pathname.includes('/profile')) {
      return 'My Profile'
    }
    return 'Resident Dashboard'
  }

  return (
    <AuthProvider>
      <DashboardLayout 
        header={<Header role="resident" userName={userName} title={getPageTitle()} />} 
        sidebar={<Sidebar role="resident" />}
      >
        {children}
      </DashboardLayout>
    </AuthProvider>
  )
}
