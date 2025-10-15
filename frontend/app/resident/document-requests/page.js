'use client'

import { useRef } from 'react'
import Link from 'next/link'
import DocumentRequestsGrid from '../../../components/authenticated/resident/DocumentRequestsGrid'
import ToastNotification from '../../../components/common/ToastNotification'

export default function DocumentRequestPage() {
  const toastRef = useRef()

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
            <span className="font-medium text-gray-900">Document Requests</span>
          </li>
        </ol>
      </nav>

      {/* Document Requests Grid */}
      <DocumentRequestsGrid toastRef={toastRef} />

      {/* Toast Notification */}
      <ToastNotification ref={toastRef} />
    </div>
  )
}
