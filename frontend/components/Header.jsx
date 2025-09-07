 'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '../lib/auth'
import Modal from './Modal'

export default function Header({ title, role = 'user', userName = 'Juan Dela Cruz' }) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const computedTitle = title ?? (role === 'admin' ? 'Admin Dashboard' : 'Resident Dashboard')

  const handleLogout = () => {
    auth.logout()
    router.push('/login')
  }

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

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        type="confirm"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        confirmButtonClass="text-white bg-red-600 hover:bg-red-700"
      >
        <p className="text-gray-600">
          Are you sure you want to logout?
        </p>
      </Modal>
    </>
  )
}
