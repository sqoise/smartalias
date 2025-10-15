'use client'

import PageLoadingV2 from '../components/common/PageLoadingV2'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage immediately
    router.push('/home')
  }, [router])

  return <PageLoadingV2 isLoading={true} />
}
