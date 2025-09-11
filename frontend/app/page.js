'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLoading from '../components/common/PageLoading'
import ApiClient from '../lib/api'
import { ROLE_TYPES } from '../lib/constants'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      // Check if user is authenticated using ApiClient
      const session = await ApiClient.getSession()
      
      if (session && session.success) {
        // User is authenticated, redirect to appropriate dashboard
        const dashboardUrl = session.user.role === ROLE_TYPES.ADMIN ? '/admin' : '/resident'
        router.push(dashboardUrl)
      } else {
        // No session, redirect to login
        router.push('/login')
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return <PageLoading/>
}
