'use client'

import { useRef } from 'react'
import MyRequestsContainer from '../../../components/authenticated/resident/MyRequestsContainer'
import ToastNotification from '../../../components/common/ToastNotification'

export default function RequestHistory() {
  const toastRef = useRef(null)

  return (
    <div className="space-y-6">

      {/* Timeline-Based Requests Container */}
      <MyRequestsContainer toastRef={toastRef} />

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
