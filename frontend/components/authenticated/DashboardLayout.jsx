// Dashboard Layout Component - Layout for authenticated dashboard pages (JSX)
import React, { useState, createContext, useContext } from 'react'

// Create a context for sidebar state
const SidebarContext = createContext()

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export default function DashboardLayout({ 
  children, 
  header, 
  sidebar, 
  title = "smartlias",
  className = "" 
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Sidebar: fixed full-height on the left */}
        <aside className="z-20">
          {React.cloneElement(sidebar, { collapsed, setCollapsed })}
        </aside>

        {/* Main area: dynamic offset based on sidebar state */}
        <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-64'}`}>
          {header}

          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
