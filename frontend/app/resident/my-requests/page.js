'use client'

import { useRef } from 'react'
import Link from 'next/link'
import MyRequestsContainer from '../../../components/authenticated/resident/MyRequestsContainer'
import ToastNotification from '../../../components/common/ToastNotification'

export default function RequestHistory() {
  const toastRef = useRef(null)

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1 text-sm text-gray-500">
          <li>
            <Link href="/resident" className="hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">My Requests</span>
          </li>
        </ol>
      </nav>

      {/* Timeline-Based Requests Container */}
      <MyRequestsContainer toastRef={toastRef} />

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
