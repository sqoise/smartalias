import React from 'react'
import config from '../lib/config'
import Header from '../components/Header'
import AdminDashboard from '../components/AdminDashboard'
import UserDashboard from '../components/UserDashboard'
import Sidebar from '../components/Sidebar'
import ResidentsList from '../components/ResidentsList'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">SmartLias</h1>
          <p className="text-gray-600">Barangay Lias Management System - Components Showcase</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Server URL:</span> {config.baseUrl}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Port:</span> {config.port}
              </p>
            </div>
          </div>
        </div>

        {/* Components Showcase */}
        <div className="space-y-8">
          {/* Header Component */}
          <section className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Header Component</h2>
              <p className="text-gray-600 text-sm">Navigation header for the application</p>
            </div>
            <div className="p-6">
              <Header />
            </div>
          </section>

          {/* Admin Dashboard Component */}
          <section className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard Component</h2>
              <p className="text-gray-600 text-sm">Administrative dashboard with statistics and management tools</p>
            </div>
            <div className="p-6">
              <AdminDashboard />
            </div>
          </section>

          {/* User Dashboard Component */}
          <section className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">User Dashboard Component</h2>
              <p className="text-gray-600 text-sm">Resident dashboard for personal information and services</p>
            </div>
            <div className="p-6">
              <UserDashboard />
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sidebar Component */}
            <section className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Sidebar Component</h2>
                <p className="text-gray-600 text-sm">Navigation sidebar menu</p>
              </div>
              <div className="p-6">
                <Sidebar />
              </div>
            </section>

            {/* Residents List Component */}
            <section className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Residents List Component</h2>
                <p className="text-gray-600 text-sm">List and management of barangay residents</p>
              </div>
              <div className="p-6">
                <ResidentsList />
              </div>
            </section>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin" className="block p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
              <h3 className="font-semibold text-blue-900">Admin Panel</h3>
              <p className="text-blue-700 text-sm">Administrative interface</p>
            </a>
            <a href="/admin/residents" className="block p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
              <h3 className="font-semibold text-green-900">Residents Management</h3>
              <p className="text-green-700 text-sm">Manage barangay residents</p>
            </a>
            <a href="/api/residents" className="block p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
              <h3 className="font-semibold text-purple-900">API Endpoint</h3>
              <p className="text-purple-700 text-sm">Residents API endpoint</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
