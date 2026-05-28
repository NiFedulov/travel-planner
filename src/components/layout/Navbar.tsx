'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plane, Map, Home, MessageCircle, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { useUIStore } from '@/lib/store/uiStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/trips', label: 'My Trips', icon: Map },
]

interface Me { id: string; name: string | null; email: string; image: string | null }

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setChatOpen, chatOpen } = useUIStore()
  const [me, setMe] = useState<Me | null>(null)
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null))
  }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMe(null)
    router.push('/auth/signin')
    router.refresh()
  }

  const initials = me?.name
    ? me.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : me?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center px-4 gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 shadow-md">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent hidden sm:block">
            TravelPlan AI
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* AI Chat */}
          <button onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              chatOpen
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-gradient-to-r from-teal-500 to-sky-500 text-white hover:from-teal-600 hover:to-sky-600 shadow-sm hover:shadow-md'
            )}>
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:block">AI Assistant</span>
          </button>

          {/* User menu */}
          {me ? (
            <div className="relative">
              <button onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors">
                {me.image
                  ? <img src={me.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                }
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {me.name ?? me.email.split('@')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {dropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <div className="text-sm font-semibold text-gray-900 truncate">{me.name ?? 'Traveler'}</div>
                      <div className="text-xs text-gray-400 truncate">{me.email}</div>
                    </div>
                    <Link href="/account" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="h-4 w-4 text-gray-400" /> Account
                    </Link>
                    <Link href="/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 text-gray-400" /> Travel Profile
                    </Link>
                    <Link href="/account/services" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="h-4 w-4 flex items-center justify-center text-xs">🔗</span> Connected Services
                    </Link>
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/signin"
              className="text-sm font-medium text-gray-600 hover:text-teal-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
