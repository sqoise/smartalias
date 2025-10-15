'use client'

import { useState, useEffect } from 'react'
import HouseholdsContainer from '../../../components/authenticated/admin/HouseholdsContainer'
import PageLoadingV2 from '../../../components/common/PageLoadingV2'

export default function HouseholdsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <PageLoadingV2 isLoading={true} />
  }

  return <HouseholdsContainer />
}
