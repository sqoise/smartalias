'use client'

import { useRef } from 'react'
import DocumentRequestsGrid from '../../components/authenticated/resident/DocumentRequestsGrid'
import ToastNotification from '../../components/common/ToastNotification'

export default function ResidentDashboard() {
  const toastRef = useRef()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Online Document Requests</h1>
        <p className="text-sm text-gray-600 mt-1">Easily submit and process barangay requests anytime, anywhere.</p>
      </div>

      {/* Document Requests Grid */}
      <DocumentRequestsGrid toastRef={toastRef} />

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
