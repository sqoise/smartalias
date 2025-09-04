'use client'

import BaseLayout from '../../components/BaseLayout.jsx'
import Header from '../../components/Header.jsx'
import Sidebar from '../../components/Sidebar.jsx'

export default function AdminLayout({ children }) {
  return (
    <BaseLayout header={<Header role="admin" userName="Admin" />} sidebar={<Sidebar role="admin" />}>
      {children}
    </BaseLayout>
  )
}
