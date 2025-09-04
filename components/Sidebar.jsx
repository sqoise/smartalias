 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ role = 'user' }) {
  const pathname = usePathname() || ''

  const menus = {
    user: [
      { name: 'Dashboard', href: '/user', icon: 'bi-speedometer2' },
      { name: 'My Documents', href: '/user/documents', icon: 'bi-file-earmark-text' },
      { name: 'Request History', href: '/user/requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/user/announcements', icon: 'bi-megaphone' },
      { name: 'Profile', href: '/user/profile', icon: 'bi-person' },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'bi-speedometer2' },
      { name: 'Residents', href: '/admin/residents', icon: 'bi-people' },
      { name: 'Documents', href: '/admin/documents', icon: 'bi-file-earmark-text' },
      { name: 'Reports', href: '/admin/reports', icon: 'bi-graph-up' },
      { name: 'Settings', href: '/admin/settings', icon: 'bi-gear' },
    ],
  }

  const items = menus[role] || menus.user

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-green-800 text-white" aria-label={`${role} navigation`}>
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-green-800 font-bold">B</div>
          <div>
            <h2 className="text-lg font-semibold">SMARTLIAS</h2>
            <p className="text-green-200 text-sm">{role === 'admin' ? 'Admin Panel' : 'User Portal'}</p>
          </div>
        </div>
      </div>

      <nav className="mt-8" role="navigation">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/')
          const classes = `flex items-center px-6 py-3 text-white hover:bg-green-700 cursor-pointer ${active ? 'bg-green-700' : ''}`
          return (
            <Link key={it.href} href={it.href} className={classes} aria-current={active ? 'page' : undefined}>
              <i className={`bi ${it.icon} mr-3`} aria-hidden></i>
              <span>{it.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
