'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (pathname.includes('/residents')) {
      return 'Residents Management'
    }
    return 'Admin Dashboard'
  }

  return (
    <DashboardLayout header={<Header role="admin" userName="Admin" title={getPageTitle()} />} sidebar={<Sidebar role="admin" />}>
      {children}
    </DashboardLayout>
  )
}
