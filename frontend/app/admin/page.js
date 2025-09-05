'use client'

import { useState } from 'react'

export default function AdminDashboard() {
  const [showResidentModal, setShowResidentModal] = useState(false)

  return (
    <>
      {/* Dashboard Content - No sidebar/header since layout.js provides them */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <i className="bi bi-people text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <i className="bi bi-hourglass-split text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <i className="bi bi-check2-square text-2xl text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-person-plus text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New resident registered</p>
                  <p className="text-xs text-gray-500">John Doe - 2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-file-earmark-check text-green-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Certificate issued</p>
                  <p className="text-xs text-gray-500">Barangay Clearance - 15 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-pencil-square text-yellow-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Information updated</p>
                  <p className="text-xs text-gray-500">Maria Santos - 1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-journal-check text-purple-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Report submitted</p>
                  <p className="text-xs text-gray-500">Monthly report - 2 hours ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowResidentModal(true)}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group cursor-pointer"
              >
                <i className="bi bi-person-plus text-xl text-gray-400 group-hover:text-green-600"></i>
                <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">Add Resident</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group cursor-pointer">
                <i className="bi bi-file-earmark-plus text-xl text-gray-400 group-hover:text-blue-600"></i>
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">New Document</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group cursor-pointer">
                <i className="bi bi-megaphone text-xl text-gray-400 group-hover:text-purple-600"></i>
                <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">Announcement</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group cursor-pointer">
                <i className="bi bi-bar-chart text-xl text-gray-400 group-hover:text-orange-600"></i>
                <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Resident Modal */}
      {showResidentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Resident</h3>
              <button 
                onClick={() => setShowResidentModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="bi bi-x text-xl"></i>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="tel" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowResidentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                >
                  Add Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
