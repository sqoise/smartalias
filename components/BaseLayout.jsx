// Base Layout Component - Generic layout for all dashboard pages (JSX)
import React from 'react'

export default function BaseLayout({ 
  children, 
  header, 
  sidebar, 
  title = "smartlias",
  className = "" 
}) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Sidebar: fixed full-height on the left */}
      <aside className="fixed inset-y-0 left-0 w-64 z-20">
        {sidebar}
      </aside>

      {/* Main area: offset by sidebar width so header sits at top of content */}
      <div className="ml-64">
        {header}

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
