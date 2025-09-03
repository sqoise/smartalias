// Base Layout Component - Generic layout for all dashboard pages
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
      {/* Header */}
      {header && (
        <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200">
          {header}
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto z-20">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${sidebar ? 'ml-64' : ''} ${header ? 'pt-16' : ''}`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
