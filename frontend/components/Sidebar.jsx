 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Sidebar({ role = 'user', collapsed, setCollapsed }) {
  const pathname = usePathname() || ''
  // Use local state if not provided from parent
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed
  const toggleCollapsed = setCollapsed || setLocalCollapsed

  // Demo: Load collapsed state from localStorage on component mount
  useEffect(() => {
    if (collapsed === undefined) {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        setLocalCollapsed(JSON.parse(savedState))
      }
    }
  }, [collapsed])

  // Demo: Save to localStorage when state changes
  const handleToggle = () => {
    const newState = !isCollapsed
    toggleCollapsed(newState)
    if (collapsed === undefined) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
    }
  }

  // Auto-collapse on mobile/tablet screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && collapsed === undefined && !isCollapsed) {
        handleToggle()
      }
    }

    // Check on mount
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed, isCollapsed])

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
    <div className={`fixed inset-y-0 left-0 bg-green-700 text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 shadow-[6px_0_12px_-2px_rgba(0,0,0,0.25),_3px_0_20px_-4px_rgba(0,0,0,0.15)]' : 'w-64 shadow-lg'}`} aria-label={`${role} navigation`}>
      {/* Header */}
      <div className="p-4 border-b border-green-700/30 transition-all duration-300 ease-in-out">
        <div className="flex items-center transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/10">
              <img src="/images/barangay_logo.png" alt="Barangay Logo" className="object-contain" />
            </div>
            <div className={`ml-3 transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <h2 className="text-lg font-semibold whitespace-nowrap">SMART LIAS</h2>
              <p className="text-green-200 text-sm whitespace-nowrap">{role === 'admin' ? 'Admin Portal' : 'User Portal'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-2 space-y-2" role="navigation">
        {items.map((it) => {
          const active = pathname === it.href || (pathname.startsWith(it.href + '/') && it.href !== '/resident' && it.href !== '/admin')
          const classes = `flex items-center text-white hover:bg-black/10 cursor-pointer transition-all duration-200 ease-in-out rounded-md px-4 py-3 mx-2 ${active ? 'bg-black/15 font-bold' : ''}`
          return (
            <div key={it.href} className="relative group">
              <Link href={it.href} className={classes} aria-current={active ? 'page' : undefined}>
                <i className={`bi ${it.icon} flex-shrink-0 text-lg ${active ? 'font-black' : 'font-normal'} ${isCollapsed ? 'mr-0' : 'mr-3'} transition-all duration-200`} aria-hidden></i>
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{it.name}</span>
              </Link>
              {/* Custom Tooltip */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-black text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                  {it.name}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-black"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <button 
        onClick={handleToggle}
        className="absolute -right-6 bottom-8 w-12 h-12 bg-green-700 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3),_0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15),_0_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-center text-white hover:text-white hover:font-bold active:font-bold transition-all duration-300 ease-in-out z-10 cursor-pointer"
      >
        <i className={`bi ${isCollapsed ? 'bi-layout-sidebar-reverse' : 'bi-chevron-right'} text-lg font-normal hover:font-black transition-all duration-500 ease-in-out transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}></i>
      </button>
    </div>
  )
}
