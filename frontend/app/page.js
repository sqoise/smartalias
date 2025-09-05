'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLoading from '../components/PageLoading'
import { auth, ROLE_TYPES } from '../lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = () => {
      // Check if user is authenticated using frontend auth
      const session = auth.getSession()
      
      if (session) {
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
