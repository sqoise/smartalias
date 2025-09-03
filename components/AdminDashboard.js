// Admin Dashboard Page Component
import React from 'react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-blue-800 truncate">Total Residents</dt>
                <dd className="text-lg font-medium text-blue-900">2,547</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">📄</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-green-800 truncate">Certificates Issued</dt>
                <dd className="text-lg font-medium text-green-900">342</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-yellow-800 truncate">Pending Requests</dt>
                <dd className="text-lg font-medium text-yellow-900">18</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-purple-800 truncate">Active Cases</dt>
                <dd className="text-lg font-medium text-purple-900">5</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Certificate of Residency issued to Juan Dela Cruz</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs">+</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">New resident registered: Maria Santos</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xs">!</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Business permit application pending review</p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-left transition-colors">
          <h4 className="font-semibold mb-2">Issue Certificate</h4>
          <p className="text-sm opacity-90">Create and issue new certificates</p>
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-left transition-colors">
          <h4 className="font-semibold mb-2">Add Resident</h4>
          <p className="text-sm opacity-90">Register new barangay resident</p>
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-left transition-colors">
          <h4 className="font-semibold mb-2">Generate Report</h4>
          <p className="text-sm opacity-90">Create monthly or annual reports</p>
        </button>
      </div>
    </div>
  )
}
