'use client'

import { useState } from 'react'

export default function ResidentDashboard() {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState('')

  return (
    <>
      {/* Dashboard Content - No sidebar/header since layout.js provides them */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <i className="bi bi-hourglass-split text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Documents</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <i className="bi bi-check2-square text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <i className="bi bi-calendar-month text-2xl text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Requests */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Request Documents</h3>
              <i className="bi bi-file-earmark-text text-xl text-gray-400"></i>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setSelectedDocument('Barangay Clearance')
                  setShowRequestModal(true)
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <i className="bi bi-file-earmark-check text-blue-600"></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Barangay Clearance</p>
                  <p className="text-sm text-gray-500">For employment, business, or other purposes</p>
                </div>
                <i className="bi bi-arrow-right text-gray-400 group-hover:text-blue-600"></i>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedDocument('Certificate of Residency')
                  setShowRequestModal(true)
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                  <i className="bi bi-house-check text-green-600"></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Certificate of Residency</p>
                  <p className="text-sm text-gray-500">Proof of address and residency</p>
                </div>
                <i className="bi bi-arrow-right text-gray-400 group-hover:text-green-600"></i>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedDocument('Business Permit')
                  setShowRequestModal(true)
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                  <i className="bi bi-shop text-purple-600"></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Business Permit</p>
                  <p className="text-sm text-gray-500">For small business operations</p>
                </div>
                <i className="bi bi-arrow-right text-gray-400 group-hover:text-purple-600"></i>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedDocument('Indigency Certificate')
                  setShowRequestModal(true)
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
                  <i className="bi bi-heart text-orange-600"></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Indigency Certificate</p>
                  <p className="text-sm text-gray-500">For financial assistance</p>
                </div>
                <i className="bi bi-arrow-right text-gray-400 group-hover:text-orange-600"></i>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-check2 text-green-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Barangay Clearance approved</p>
                  <p className="text-xs text-gray-500">Ready for pickup - 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-clock text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Certificate of Residency submitted</p>
                  <p className="text-xs text-gray-500">Under review - 1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-megaphone text-purple-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New announcement posted</p>
                  <p className="text-xs text-gray-500">Community meeting - 2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request {selectedDocument}</h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="bi bi-x text-xl"></i>
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Select purpose</option>
                  <option>Employment</option>
                  <option>Business Registration</option>
                  <option>School Enrollment</option>
                  <option>Medical Assistance</option>
                  <option>Others</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea 
                  rows="3" 
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  placeholder="Any additional information..."
                ></textarea>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <i className="bi bi-info-circle text-blue-600 mt-0.5"></i>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">Processing Time: 2-3 business days</p>
                    <p>You will receive a notification when your document is ready for pickup.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
