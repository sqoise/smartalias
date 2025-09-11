'use client'

import { useState } from 'react'
import ApiClient from '../../lib/api'

export default function AdminDashboard() {
  const [showResidentModal, setShowResidentModal] = useState(false)
  const [accountStatusData, setAccountStatusData] = useState(null)
  const [statusUsername, setStatusUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Account security management
  const handleCheckAccountStatus = async () => {
    if (!statusUsername.trim()) return
    
    setIsLoading(true)
    try {
      const result = await ApiClient.getAccountStatus(statusUsername.trim())
      setAccountStatusData(result)
    } catch (error) {
      console.error('Error checking account status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockAccount = async (username) => {
    setIsLoading(true)
    try {
      const result = await ApiClient.unlockAccount(username)
      if (result.success) {
        // Refresh account status
        await handleCheckAccountStatus()
      }
    } catch (error) {
      console.error('Error unlocking account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Demo: Dashboard Content - No sidebar/header since layout.js provides them */}
      <div className="space-y-6">
        {/* Demo: Stats Cards with hardcoded data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p> {/* Demo: Static data */}
              </div>
              <i className="bi bi-people text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">45</p> {/* Demo: Static data */}
              </div>
              <i className="bi bi-hourglass-split text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">12</p> {/* Demo: Static data */}
              </div>
              <i className="bi bi-check2-square text-2xl text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Demo: Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demo: Recent Activities with static data */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-person-plus text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New resident registered</p>
                  <p className="text-xs text-gray-500">John Doe - 2 minutes ago</p> {/* Demo: Static data */}
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-file-earmark-check text-green-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Certificate issued</p>
                  <p className="text-xs text-gray-500">Barangay Clearance - 15 minutes ago</p> {/* Demo: Static data */}
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-pencil-square text-yellow-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Information updated</p>
                  <p className="text-xs text-gray-500">Maria Santos - 1 hour ago</p> {/* Demo: Static data */}
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

        {/* Security Management Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="bi bi-shield-check text-red-600"></i>
            Account Security Management
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter username to check status"
                value={statusUsername}
                onChange={(e) => setStatusUsername(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCheckAccountStatus}
                disabled={isLoading || !statusUsername.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            {accountStatusData && (
              <div className="mt-4 p-4 border rounded-md">
                {accountStatusData.success ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Account Status for {accountStatusData.accountStatus.username}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          accountStatusData.accountStatus.isLocked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {accountStatusData.accountStatus.isLocked ? 'LOCKED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed Attempts:</span>
                        <span className="ml-2 font-medium">{accountStatusData.accountStatus.failedAttempts}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Password Changed:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          accountStatusData.accountStatus.passwordChanged 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {accountStatusData.accountStatus.passwordChanged ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {accountStatusData.accountStatus.remainingLockoutMinutes > 0 && (
                        <div>
                          <span className="text-gray-500">Unlocks in:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {accountStatusData.accountStatus.remainingLockoutMinutes} minutes
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {accountStatusData.accountStatus.isLocked && (
                      <button
                        onClick={() => handleUnlockAccount(accountStatusData.accountStatus.username)}
                        disabled={isLoading}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300"
                      >
                        {isLoading ? 'Unlocking...' : 'Unlock Account'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <i className="bi bi-exclamation-circle mr-2"></i>
                    {accountStatusData.error}
                  </div>
                )}
              </div>
            )}
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
