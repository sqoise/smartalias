 'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header({ title, role = 'user', userName = 'Juan Dela Cruz' }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const computedTitle = title ?? (role === 'admin' ? 'Admin Dashboard' : 'Resident Dashboard')

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">{computedTitle}</h1>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
              <i className="bi bi-bell text-xl"></i>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userName?.[0] ?? 'U'}
                </div>
                <span className="text-gray-700">{userName}</span>
                <i className="bi bi-chevron-down text-gray-500"></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <i className="bi bi-person mr-2"></i>Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <i className="bi bi-gear mr-2"></i>Settings
                  </a>
                  <button 
                    onClick={() => { setShowLogoutModal(true); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-200 cursor-pointer"
                  >
                    <i className="bi bi-box-arrow-right mr-2"></i>Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <Link 
                href="/"
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 text-center cursor-pointer"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
