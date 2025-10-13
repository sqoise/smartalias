'use client'

import { useRef } from 'react'
import ToastNotification from '../../components/common/ToastNotification'

export default function ResidentDashboard() {
  const toastRef = useRef()

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1 text-sm text-gray-500">
          <li>
            <span className="font-medium text-gray-900">Dashboard</span>
          </li>
        </ol>
      </nav>

      {/* Improved Jumbotron Welcome Section */}
      <div 
        className="rounded-lg shadow-sm overflow-hidden"
        style={{ background: 'linear-gradient(to right, #333843, #3d434f)' }}
      >
        <div className="px-8 py-10">
          <div className="max-w-4xl mx-auto">
            {/* Enhanced Welcome Header */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Welcome to SmartLIAS
              </h1>
              <p className="text-slate-200 text-xl font-medium leading-relaxed">
                Your comprehensive digital platform for efficient barangay services
              </p>
            </div>
            
            {/* Organized Description Content */}
            <div className="space-y-4 text-slate-300">
              <p className="text-base leading-relaxed">
                SmartLIAS revolutionizes how residents interact with their local government. Request official documents, 
                track application status, receive important community announcements, and manage your personal information 
                seamlessly through our user-friendly interface.
              </p>
              <p className="text-base leading-relaxed">
                Built for the modern Filipino community, our platform ensures transparency, accessibility, and 
                efficiency in all barangay operations. Experience hassle-free government services from the comfort 
                of your home.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
          onClick={() => window.location.href = '/resident/document-requests'}
        >
          {/* Hover Arrow */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <i className="bi bi-arrow-right text-gray-400 text-lg"></i>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-file-earmark-plus text-gray-600 text-lg"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Online Services</h3>
          </div>
          <p className="text-sm text-gray-600">
            Request certificates and clearances online
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
          onClick={() => window.location.href = '/resident/announcements'}
        >
          {/* Hover Arrow */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <i className="bi bi-arrow-right text-gray-400 text-lg"></i>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-megaphone text-gray-600 text-lg"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Announcements</h3>
          </div>
          <p className="text-sm text-gray-600">
            Stay informed with barangay updates
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
          onClick={() => window.location.href = '/resident/profile'}
        >
          {/* Hover Arrow */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <i className="bi bi-arrow-right text-gray-400 text-lg"></i>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-person-gear text-gray-600 text-lg"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Profile Management</h3>
          </div>
          <p className="text-sm text-gray-600">
            Update your personal information
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
