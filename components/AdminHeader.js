// Admin Header Component
import React from 'react'

export default function AdminHeader({ title }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              smartlias - {title}
            </h1>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Welcome, Admin</span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
