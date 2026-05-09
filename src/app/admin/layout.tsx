'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users, ListChecks, Target, PiggyBank, Gift, Settings,
  Star, LogOut, ChevronLeft, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const navItems = [
  { href: '/admin/children', label: 'Children', icon: Users },
  { href: '/admin/chores', label: 'Chores', icon: ListChecks },
  { href: '/admin/challenges', label: 'Challenges', icon: Target },
  { href: '/admin/piggybank', label: 'Piggybank', icon: PiggyBank },
  { href: '/admin/rewards', label: 'Rewards', icon: Gift },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-primary leading-none">Missionly</span>
              <p className="text-xs text-neutral-400 mt-0.5">Admin Mode</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            className="md:hidden p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Back to kids view */}
        <div className="px-3 py-3 border-b border-neutral-100">
          <Link href="/kids" onClick={closeSidebar}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-600 hover:text-primary">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kids View
            </Button>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={closeSidebar}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-neutral-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-neutral-500 hover:text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-neutral-600 hover:text-primary hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-primary">Missionly</span>
          <span className="text-xs text-neutral-400 font-normal">Admin</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
