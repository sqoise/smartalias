'use client'

import BaseLayout from '../../components/BaseLayout.jsx'
import Header from '../../components/Header.jsx'
import Sidebar from '../../components/Sidebar.jsx'

export default function UserLayout({ children }) {
  return (
    <BaseLayout header={<Header role="user" userName="Juan Dela Cruz" />} sidebar={<Sidebar role="user" />}>
      {children}
    </BaseLayout>
  )
}
