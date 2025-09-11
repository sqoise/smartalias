'use client'

import DashboardLayout from '../../components/authenticated/DashboardLayout.jsx'
import Header from '../../components/authenticated/Header.jsx'
import Sidebar from '../../components/authenticated/Sidebar.jsx'

export default function ResidentLayout({ children }) {
  return (
    <DashboardLayout header={<Header role="resident" userName="Juan Dela Cruz" />} sidebar={<Sidebar role="resident" />}>
      {children}
    </DashboardLayout>
  )
}
