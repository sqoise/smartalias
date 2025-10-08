'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ApiClient from '../../lib/apiClient'
import SessionExpiredModal from '../common/SessionExpiredModal'

/**
 * AuthProvider - Global authentication handler
 * Wraps all authenticated pages to handle session expiration
 */
export default function AuthProvider({ children }) {
  const router = useRouter()
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const modalStateRef = useRef(false)

  // Set up global session expired handler
  useEffect(() => {
    ApiClient.onSessionExpired = () => {
      modalStateRef.current = true
      setShowSessionExpiredModal(true)
    }

    // Cleanup
    return () => {
      ApiClient.onSessionExpired = null
    }
  }, [])

  const handleSessionExpiredClose = () => {
    setShowSessionExpiredModal(false)
    // Clear token and redirect to login
    ApiClient.removeStoredToken()
    router.push('/login')
  }

  return (
    <>
      {children}
      
      {/* Global Session Expired Modal */}
      <SessionExpiredModal
        isOpen={showSessionExpiredModal}
        onClose={handleSessionExpiredClose}
      />
    </>
  )
}
