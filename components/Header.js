// Admin Header Component
import React from 'react'

export default function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">SmartLias</h1>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
              <a href="#" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Residents</a>
              <a href="#" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Certificates</a>
              <a href="#" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Reports</a>
            </div>
          </nav>

          {/* User Profile */}
          <div className="flex items-center">
            <div className="relative">
              <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium">AD</span>
                </div>
                <span className="ml-2 text-sm font-medium">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
