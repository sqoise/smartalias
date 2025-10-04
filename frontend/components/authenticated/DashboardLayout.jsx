'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ApiClient from '../../lib/apiClient'
import Modal from '../common/Modal'

export default function DashboardLayout({ 
  children, 
  header, 
  sidebar, 
  title = "smartlias",
  className = "" 
}) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    try {
      await ApiClient.logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex">
      {/* Sidebar */}
      {React.cloneElement(sidebar, { 
        collapsed, 
        setCollapsed, 
        mobileMenuOpen, 
        setMobileMenuOpen 
      })}

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className={`flex flex-col flex-1 h-full transition-all duration-200 ease-in-out ${
        collapsed ? 'lg:ml-18' : 'lg:ml-64'
      } ml-0`}>
        
        {/* Header */}
        <header className="flex-shrink-0 border-b border-gray-200 bg-white z-20">
          {React.cloneElement(header, { 
            mobileMenuOpen, 
            setMobileMenuOpen,
            collapsed,
            setCollapsed,
            showLogoutModal,
            setShowLogoutModal,
            onLogout: handleLogout
          })}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal - Rendered at root level */}
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
    </div>
  )
}
