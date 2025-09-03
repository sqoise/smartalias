// User Dashboard Page Component
import React from 'react'

export default function UserDashboard() {
  return (
    <div className="space-y-6">
      {/* Personal Information Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-800"><span className="font-medium">Name:</span> Juan Dela Cruz</p>
            <p className="text-sm text-blue-800"><span className="font-medium">Address:</span> Purok 1, Barangay Lias</p>
            <p className="text-sm text-blue-800"><span className="font-medium">Contact:</span> 09123456789</p>
          </div>
          <div>
            <p className="text-sm text-blue-800"><span className="font-medium">Age:</span> 35 years old</p>
            <p className="text-sm text-blue-800"><span className="font-medium">Civil Status:</span> Married</p>
            <p className="text-sm text-blue-800"><span className="font-medium">Occupation:</span> Teacher</p>
          </div>
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Certificates</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">Certificate of Residency</p>
                <p className="text-xs text-gray-500">Issued on March 15, 2024</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">Barangay Clearance</p>
                <p className="text-xs text-gray-500">Issued on February 28, 2024</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Services */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Available Services</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Certificate of Residency</h4>
              <p className="text-sm text-gray-600">For proof of residence in the barangay</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Barangay Clearance</h4>
              <p className="text-sm text-gray-600">For legal and business purposes</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Business Permit</h4>
              <p className="text-sm text-gray-600">For starting a business in the barangay</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Complaint Filing</h4>
              <p className="text-sm text-gray-600">Submit complaints or concerns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors">
              Request Certificate
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors">
              Update Profile
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors">
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
