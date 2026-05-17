'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, User, Map, Home, MessageCircle } from 'lucide-react'
import { useUIStore } from '@/lib/store/uiStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/trips', label: 'My Trips', icon: Map },
]

export function Navbar() {
  const pathname = usePathname()
  const { setChatOpen, chatOpen } = useUIStore()

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
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </nav>

        {/* AI Chat button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            chatOpen
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-gradient-to-r from-teal-500 to-sky-500 text-white hover:from-teal-600 hover:to-sky-600 shadow-sm hover:shadow-md'
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:block">AI Assistant</span>
        </button>
      </div>
    </header>
  )
}
