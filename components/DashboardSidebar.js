// Dashboard Sidebar Component - Shared sidebar with different menus for admin/users
import React from 'react'

export default function DashboardSidebar({ userType = 'user' }) {
  return (
    <aside>
      {/* 
        TODO: Paste your sidebar HTML template here
        This sidebar will show different menu items based on userType prop
        
        For Admin (userType="admin"):
        - Dashboard
        - Residents Management
        - Certificate Management
        - Reports
        - Settings
        
        For Users (userType="user"):
        - Dashboard
        - My Profile
        - My Certificates
        - Request Certificate
      */}
      
      {/* Your sidebar HTML goes here */}
      {/* You can use {userType} to conditionally show different menu items */}
    </aside>
  )
}
