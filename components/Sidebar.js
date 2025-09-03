// General Sidebar Component
import React from 'react'

export default function Sidebar() {
  return (
    <div className="bg-gray-800 text-white w-full">
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <nav className="space-y-2">
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            🏠 Dashboard
          </a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            👥 Residents
          </a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            📄 Certificates
          </a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            🏢 Business Permits
          </a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            📊 Reports
          </a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            ⚙️ Settings
          </a>
        </nav>
      </div>
      
      {/* User Section */}
      <div className="border-t border-gray-700 px-4 py-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Juan Dela Cruz</p>
            <p className="text-xs text-gray-400">Resident</p>
          </div>
        </div>
        <button className="mt-3 w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
}
