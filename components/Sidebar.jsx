 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Sidebar({ role = 'user', collapsed, setCollapsed }) {
  const pathname = usePathname() || ''
  // Use local state if not provided from parent
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed
  const toggleCollapsed = setCollapsed || setLocalCollapsed

  const menus = {
    user: [
      { name: 'Dashboard', href: '/resident', icon: 'bi-speedometer2' },
      { name: 'My Documents', href: '/resident/documents', icon: 'bi-file-earmark-text' },
      { name: 'Request History', href: '/resident/requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/resident/announcements', icon: 'bi-megaphone' },
      { name: 'Profile', href: '/resident/profile', icon: 'bi-person' },
    ],
    resident: [
      { name: 'Dashboard', href: '/resident', icon: 'bi-speedometer2' },
      { name: 'My Documents', href: '/resident/documents', icon: 'bi-file-earmark-text' },
      { name: 'Request History', href: '/resident/requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/resident/announcements', icon: 'bi-megaphone' },
      { name: 'Profile', href: '/resident/profile', icon: 'bi-person' },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'bi-speedometer2' },
      { name: 'Residents', href: '/admin/residents', icon: 'bi-people' },
      { name: 'Documents', href: '/admin/documents', icon: 'bi-file-earmark-text' },
      { name: 'Reports', href: '/admin/reports', icon: 'bi-graph-up' },
      { name: 'Settings', href: '/admin/settings', icon: 'bi-gear' },
    ],
  }

  const items = menus[role] || menus.user

  return (
    <div className={`fixed inset-y-0 left-0 bg-green-800 text-white shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`} aria-label={`${role} navigation`}>
      {/* Header */}
      <div className="p-4 border-b border-green-700/30 transition-all duration-300 ease-in-out">
        <div className="flex items-center transition-all duration-300 ease-in-out">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/10">
            <img src="/images/barangay_logo.png" alt="Barangay Logo" className="object-contain" />
          </div>
          <div className={`ml-3 transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <h2 className="text-lg font-semibold whitespace-nowrap">SMARTLIAS</h2>
            <p className="text-green-200 text-sm whitespace-nowrap">{role === 'admin' ? 'Admin Panel' : 'User Portal'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-2 space-y-2" role="navigation">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/')
          const classes = `flex items-center text-white hover:bg-green-700 cursor-pointer transition-all duration-200 ease-in-out rounded-md px-4 py-3 mx-2 ${active ? 'bg-green-700' : ''}`
          return (
            <Link key={it.href} href={it.href} className={classes} aria-current={active ? 'page' : undefined} title={isCollapsed ? it.name : ''}>
              <i className={`bi ${it.icon} flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'}`} aria-hidden></i>
              <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{it.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <button 
        onClick={() => toggleCollapsed(!isCollapsed)}
        className="absolute -right-5 bottom-6 w-12 h-12 bg-green-700 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-2xl transition-shadow duration-300 ease-in-out z-10 cursor-pointer"
      >
        <i className={`bi ${isCollapsed ? 'bi-list' : 'bi-x-lg'} text-lg font-bold transition-all duration-300 ease-in-out`}></i>
      </button>
    </div>
  )
}
