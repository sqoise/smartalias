'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'
import PageLoading from '../../components/common/PageLoading.jsx'
import ApiClient from '../../lib/apiClient'

export default function ResidentLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await ApiClient.getSession()
        
        if (!session.success) {
          // No valid session - redirect to login
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
    return <PageLoading />
  }

  // Don't render content if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null
  }
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (pathname === '/resident') {
      return 'Document Requests'
    }
    if (pathname.includes('/requests')) {
      return 'Request History'
    }
    if (pathname.includes('/announcements')) {
      return 'Announcements'
    }
    if (pathname.includes('/profile')) {
      return 'Profile'
    }
    return 'Resident Dashboard'
  }

  return (
    <DashboardLayout 
      header={<Header role="resident" userName={userName} title={getPageTitle()} />} 
      sidebar={<Sidebar role="resident" />}
    >
      {children}
    </DashboardLayout>
  )
}
