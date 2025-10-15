'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-600">500</h2>
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
          Something went wrong
        </h1>
        <p className="mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
          Sorry, we encountered an unexpected error. Please try again.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/" className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
                ← Back to homepage
              </Link>
        </div>
      </div>
    </main>
  )
}
