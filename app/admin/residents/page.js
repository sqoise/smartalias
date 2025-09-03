import React from 'react'
import AdminLayout from '../../../components/AdminLayout'
import ResidentsList from '../../../components/ResidentsList'

export default function ResidentsPage() {
  return (
    <AdminLayout title="Residents">
      <ResidentsList />
    </AdminLayout>
  )
}
