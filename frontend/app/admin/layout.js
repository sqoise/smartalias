'use client'

import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'

export default function AdminLayout({ children }) {
  return (
    <DashboardLayout header={<Header role="admin" userName="Admin" />} sidebar={<Sidebar role="admin" />}>
      {children}
    </DashboardLayout>
  )
}
