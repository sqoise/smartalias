'use client'

import { useState } from 'react'

// Import all dashboard components
import ResidentsCard from '../../components/authenticated/admin/dashboard/ResidentsCard'
import AnnouncementsCard from '../../components/authenticated/admin/dashboard/AnnouncementsCard'
import ApplicationsCard from '../../components/authenticated/admin/dashboard/ApplicationsCard'
import SystemStatusCard from '../../components/authenticated/admin/dashboard/SystemStatusCard'
import CategoriesChart from '../../components/authenticated/admin/dashboard/CategoriesChart'
import ActivityCard from '../../components/authenticated/admin/dashboard/ActivityCard'

export default function AdminDashboard() {
  // Simple state for overall dashboard - no complex data management
  const [dashboardTitle] = useState('Admin Dashboard')

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards - Each independent component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResidentsCard />
        <AnnouncementsCard />
        <ApplicationsCard />
        <SystemStatusCard />
      </div>

      {/* Charts and Analytics - Independent components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoriesChart />
        <ActivityCard />
      </div>

      {/* Quick Actions - Static content, no loading needed */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/admin/residents" 
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="bi bi-people text-blue-600"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Residents</p>
                <p className="text-sm text-gray-500">View and edit records</p>
              </div>
            </div>
            <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600"></i>
          </a>

          <a 
            href="/admin/announcements" 
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="bi bi-megaphone text-green-600"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">Announcements</p>
                <p className="text-sm text-gray-500">Create and manage</p>
              </div>
            </div>
            <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600"></i>
          </a>

          <a 
            href="/admin/documents" 
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="bi bi-file-earmark-text text-purple-600"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">Document Requests</p>
                <p className="text-sm text-gray-500">Process applications</p>
              </div>
            </div>
            <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600"></i>
          </a>
        </div>
      </div>
    </div>
  )
}
