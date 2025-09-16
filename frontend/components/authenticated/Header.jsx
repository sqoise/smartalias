 'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ApiClient from '../../lib/apiClient'
import Modal from '../common/Modal'

export default function Header({ title, role = 'user', userName = 'Juan Dela Cruz', mobileMenuOpen, setMobileMenuOpen }) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const computedTitle = title ?? (role === 'admin' ? 'Admin Dashboard' : 'Resident Dashboard')

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const handleLogout = async () => {
    try {
      await ApiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Clear local storage and redirect regardless of API response
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return (
    <>
      <header className="bg-green-800 border-b border-green-700 relative z-30 h-12">
        <div className="flex items-center justify-between px-6 py-2 h-full">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 rounded-md text-green-200 hover:text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-medium text-white">{computedTitle}</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* User Menu */}
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-green-700 cursor-pointer transition-colors duration-150"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-green-800 text-xs font-medium">
                  {userName?.[0] ?? 'U'}
                </div>
                <span className="text-sm text-green-100 hidden sm:block">{userName}</span>
                <i className="bi bi-chevron-down text-xs text-green-200"></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded shadow-lg z-50 py-1">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="bi bi-person text-sm mr-2"></i>Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="bi bi-gear text-sm mr-2"></i>Settings
                  </a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={() => { setShowLogoutModal(true); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <i className="bi bi-box-arrow-right text-sm mr-2"></i>Logout
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
