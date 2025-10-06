'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'

export default function ResidentLayout({ children }) {
  const pathname = usePathname()
  
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
      header={<Header role="resident" userName="Juan Dela Cruz" title={getPageTitle()} />} 
      sidebar={<Sidebar role="resident" />}
    >
      {children}
    </DashboardLayout>
  )
}
