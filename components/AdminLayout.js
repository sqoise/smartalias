// Admin Layout Component - Base structure for admin pages
import React from 'react'

export default function AdminLayout({ children }) {
  return (
    <div>
      {/* 
        TODO: Paste your admin template HTML structure here
        Example structure:
        - Header component
        - Sidebar component  
        - Main content area
      */}
      
      {/* Header placeholder */}
      <header>
        {/* Your header HTML goes here */}
      </header>
      
      {/* Sidebar placeholder */}
      <aside>
        {/* Your sidebar HTML goes here */}
      </aside>
      
      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  )
}
