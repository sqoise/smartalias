// Dashboard Layout Component - Shared layout for admin and users
import React from 'react'

export default function DashboardLayout({ children }) {
  return (
    <div>
      {/* 
        TODO: Paste your dashboard layout HTML template here
        This layout will be shared between admin and user dashboards
        
        Common layout elements:
        - Header/Navbar
        - Sidebar
        - Main content area
        - Footer (if any)
      */}
      
      {/* Your dashboard layout HTML goes here */}
      <div className="dashboard-container">
        {/* Sidebar will go here */}
        
        {/* Main content area */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
