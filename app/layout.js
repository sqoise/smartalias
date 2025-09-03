import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

import './globals.css'

export const metadata = {
  title: 'Login — SMARTLIAS',
  description: 'Barangay resident management system',
  icons: {
    icon: '/images/barangay_logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
