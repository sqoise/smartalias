'use client'

import { useRef } from 'react'
import DocumentRequestsGrid from '../../components/authenticated/resident/DocumentRequestsGrid'
import ToastNotification from '../../components/common/ToastNotification'

export default function ResidentDashboard() {
  const toastRef = useRef()

  return (
    <div className="space-y-6">

      {/* Document Requests Grid */}
      <DocumentRequestsGrid toastRef={toastRef} />

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
