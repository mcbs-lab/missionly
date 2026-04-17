'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users, ListChecks, Target, PiggyBank, Gift, Settings,
  Star, LogOut, ChevronLeft,
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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-primary">Missionly</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 ml-10">Admin Mode</p>
        </div>

        {/* Back to kids view */}
        <div className="px-3 py-3 border-b border-neutral-100">
          <Link href="/kids">
            <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-600 hover:text-primary">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kids View
            </Button>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}>
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

      {/* Main content */}
      <main className="ml-64 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
