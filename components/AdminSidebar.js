// Admin Sidebar Component
import React from 'react'
import Link from 'next/link'

export default function AdminSidebar() {
  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Residents', href: '/admin/residents', icon: '👥' },
    { name: 'Certificates', href: '/admin/certificates', icon: '📋' },
    { name: 'Reports', href: '/admin/reports', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}
