 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Sidebar({ role = 'user', collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  const pathname = usePathname() || ''
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({}) // Track which menus are expanded
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed

  // Load collapsed state from localStorage
  useEffect(() => {
    if (collapsed === undefined) {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        setLocalCollapsed(JSON.parse(savedState))
      }
    }
    
    // Load expanded menus state
    const savedExpandedMenus = localStorage.getItem('sidebarExpandedMenus')
    if (savedExpandedMenus !== null) {
      setExpandedMenus(JSON.parse(savedExpandedMenus))
    }
  }, [collapsed])

  // Auto-close menus when navigating away from their sections
  useEffect(() => {
    const items = menus[role] || menus.user
    const newExpandedMenus = { ...expandedMenus }
    let hasChanges = false

    items.forEach(item => {
      if (item.children) {
        const isAnyChildActive = item.children.some(child => 
          pathname === child.href || pathname.startsWith(child.href + '/')
        )
        
        // If no child is active and menu was manually opened, close it
        if (!isAnyChildActive && expandedMenus[item.key]) {
          newExpandedMenus[item.key] = false
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      setExpandedMenus(newExpandedMenus)
      localStorage.setItem('sidebarExpandedMenus', JSON.stringify(newExpandedMenus))
    }
  }, [pathname, role])

  // Save to localStorage when state changes
  const handleToggle = () => {
    const newState = !isCollapsed
    if (setCollapsed) {
      setCollapsed(newState)
    } else {
      setLocalCollapsed(newState)
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
    }
  }

  // Toggle submenu expansion
  const toggleSubmenu = (menuKey) => {
    const newExpandedMenus = {
      ...expandedMenus,
      [menuKey]: !expandedMenus[menuKey]
    }
    setExpandedMenus(newExpandedMenus)
  }

  const menus = {
    resident: [
      { 
        name: 'Online Services', 
        icon: 'bi-clipboard-check',
        key: 'online-services',
        children: [
          { name: 'Document Requests', href: '/resident/document-requests', icon: 'bi-file-earmark-plus' }
        ]
      },
      { name: 'My Requests', href: '/resident/my-requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/resident/announcements', icon: 'bi-megaphone' },
      { name: 'My Profile', href: '/resident/profile', icon: 'bi-person' },
    ],
    staff: [
      { name: 'Dashboard', href: '/admin', icon: 'bi-speedometer2' },
      { 
        name: 'Managed Services', 
        icon: 'bi-file-earmark-text',
        key: 'documents',
        children: [
          { name: 'Announcements', href: '/admin/announcements', icon: 'bi-megaphone' },
          { name: 'Document Requests', href: '/admin/documents', icon: 'bi-file-earmark-plus' },
          { name: 'Residents', href: '/admin/residents', icon: 'bi-people' },
        ]
      },
      { 
        name: 'Maintenance', 
        href: '/admin/settings',
        icon: 'bi-gear',
        key: 'settings',
        children: [
          { name: 'User Management', href: '/admin/settings/user-management', icon: 'bi-person-gear' },
        ]
      },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'bi-speedometer2' },
      // { name: 'Households', href: '/admin/households', icon: 'bi-house' },
      { 
        name: 'Managed Services', 
        icon: 'bi-file-earmark-text',
        key: 'documents',
        children: [
          { name: 'Announcements', href: '/admin/announcements', icon: 'bi-megaphone' },
          { name: 'Document Requests', href: '/admin/documents', icon: 'bi-file-earmark-plus' },
          { name: 'Residents', href: '/admin/residents', icon: 'bi-people' },
        ]
      },
      { 
        name: 'Maintenance', 
        href: '/admin/settings',
        icon: 'bi-gear',
        key: 'settings',
        children: [
          { name: 'User Management', href: '/admin/settings/user-management', icon: 'bi-person-gear' },
          // { name: 'Backup & Restore', href: '/admin/settings/backup', icon: 'bi-cloud-download' }
        ]
      },
    ]
  }

  // For staff role, use the admin menu items
  const items = role === 'staff' ? menus.admin : (menus[role] || menus.user)

  // Check if any menu item is currently active
  const hasActiveMenu = items.some(item => {
    if (item.children) {
      // Check if any child is active
      return item.children.some(child => 
        pathname === child.href || pathname.startsWith(child.href + '/')
      )
    } else {
      // Check if this item is active (including dashboard/home pages)
      return pathname === item.href || 
             (pathname.startsWith(item.href + '/') && item.href !== '/resident' && item.href !== '/admin') ||
             (item.href === '/admin' && pathname === '/admin') ||
             (item.href === '/resident' && pathname === '/resident')
    }
  })

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        />
      )}
      
      <div 
        className={`fixed inset-y-0 left-0 bg-white text-gray-700 transition-all duration-200 ease-in-out shadow-lg z-40 ${
          isCollapsed ? 'w-18' : 'w-64 lg:w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0 w-full lg:w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-3 right-3 z-10">
                <button
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none bg-gray-100 hover:bg-gray-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div className={`py-3 border-b border-gray-200 bg-white px-2`}>
        <div className="flex items-center">
          <div className="flex items-center justify-center rounded-md w-14 h-14 flex-shrink-0">
            <img 
              src="/images/barangay_logo.png" 
              alt="Logo" 
              className={`w-8 h-8 object-contain transition-all duration-200 ${
                hasActiveMenu ? 'filter drop-shadow-md contrast-125 brightness-75' : ''
              }`} 
            />
          </div>
          {!isCollapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <h2 className={`text-lg font-semibold text-gray-900 transition-all duration-200 ${
                hasActiveMenu ? 'font-bold text-black' : ''
              }`}>SMARTLIAS</h2>
              <p className="text-sm text-gray-500">{role === 'resident' ? 'User' : 'Admin'}</p>
            </div>
          )}
        </div>
        
        {/* Toggle Button - Desktop Only */}
        <button 
          onClick={handleToggle}
          className="hidden lg:flex absolute -right-3 top-8 w-7 h-7 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-600 hover:border-gray-300 transition-colors shadow-sm cursor-pointer hover:shadow-lg" 
        >
          <i className={`bi bi-chevron-left text-sm ${isCollapsed ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-1">
        {items.map((item) => {
          // Check if this item has children (submenu)
          if (item.children) {
            const isParentActive = item.children.some(child => 
              pathname === child.href || pathname.startsWith(child.href + '/')
            )
            const isExpanded = expandedMenus[item.key] || isParentActive
            
            return (
              <div key={item.key} className="relative">
                {/* Parent Menu Item */}
                <div className="relative group">
                  <button
                    onClick={() => !isCollapsed && toggleSubmenu(item.key)}
                    className={`w-full flex items-center justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 rounded-md px-3 py-2.5 text-sm cursor-pointer ${
                      isParentActive ? 'text-gray-900 bg-gray-100 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex justify-center flex-shrink-0 w-6">
                        <i className={`bi ${item.icon} text-base ${isParentActive ? 'font-black text-black drop-shadow-md' : ''}`}></i>
                      </div>
                      {!isCollapsed && <span className="ml-3">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <i className={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}></i>
                    )}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="hidden lg:block absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                    </div>
                  )}
                </div>
                
                {/* Submenu Items */}
                {!isCollapsed && isExpanded && (
                  <div className="ml-4.5 mt-1 relative">
                    {item.children.map((child, index) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                      const isLastChild = index === item.children.length - 1
                      return (
                        <div key={child.href} className="relative flex items-center pl-3.5 py-1">
                          {/* Vertical line segment - from top to bottom for each item except last */}
                          {!isLastChild && (
                            <div className="absolute left-1 top-0 w-0.5 bg-gray-200 h-full"></div>
                          )}
                          {/* Vertical line segment - from top to middle for last item only */}
                          {isLastChild && (
                            <div className="absolute left-1 top-0 w-0.5 bg-gray-200 h-1/2"></div>
                          )}
                          {/* Horizontal line with curved corner for last item */}
                          {!isLastChild ? (
                            <div className="absolute left-1 top-1/2 w-3 h-0.5 bg-gray-200"></div>
                          ) : (
                            /* Curved corner using border */
                            <div className="absolute left-1 top-1/2 w-3 h-3 border-l-2 border-b-2 border-gray-200 rounded-bl-md transform -translate-y-1/2"></div>
                          )}
                          <div className="flex-1 ml-2">
                            {childActive ? (
                              <div className="text-gray-900 bg-gray-100 rounded-md px-3.5 py-2.5 text-sm font-bold cursor-default">
                                {child.name}
                              </div>
                            ) : (
                              <Link
                                href={child.href}
                                className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md px-3 py-2.5 text-sm cursor-pointer"
                                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                              >
                                {child.name}
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          
          // Regular menu item (no children)
          const active = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/resident' && item.href !== '/admin')
          return (
            <div key={item.href} className="relative group">
              {active ? (
                <div 
                  className={`flex items-center text-gray-900 bg-gray-100 rounded-md px-3 py-2.5 text-sm font-bold cursor-default`}
                >
                  <div className="flex justify-center flex-shrink-0 w-6">
                    <i className={`bi ${item.icon} text-base font-black text-black drop-shadow-md`}></i>
                  </div>
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </div>
              ) : (
                <Link 
                  href={item.href} 
                  className={`flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 rounded-md px-3 py-2.5 text-sm cursor-pointer`}
                  onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                >
                  <div className="flex justify-center flex-shrink-0 w-6">
                    <i className={`bi ${item.icon} text-base`}></i>
                  </div>
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
    </>
  )
}
