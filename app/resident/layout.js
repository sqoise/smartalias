'use client'

import BaseLayout from '../../components/BaseLayout.jsx'
import Header from '../../components/Header.jsx'
import Sidebar from '../../components/Sidebar.jsx'

export default function ResidentLayout({ children }) {
  return (
    <BaseLayout header={<Header role="resident" userName="Juan Dela Cruz" />} sidebar={<Sidebar role="resident" />}>
      {children}
    </BaseLayout>
  )
}
