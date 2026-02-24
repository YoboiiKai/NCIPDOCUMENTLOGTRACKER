'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User, LayoutDashboard, FileText, BarChart3, Users } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeNav, setActiveNav] = useState('documents')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/dashboard' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id)
    if (item.path) {
      router.push(item.path)
    }
  }

  return (
    <header className="bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] shadow-2xl border-b border-white/10 relative">
      {/* Decorative background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-5 max-w-7xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Enhanced logo container with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
            <div className="relative bg-white/95 rounded-full shadow-lg ring-2 ring-white/30 backdrop-blur-sm w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/Logo/ncip.png"
                  alt="NCIP Logo"
                  fill
                  sizes="(max-width: 640px) 36px, 56px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h2 className="font-bold text-xs sm:text-sm md:text-xl text-white tracking-wide leading-tight drop-shadow-lg">
              NATIONAL COMMISSION ON INDIGENOUS PEOPLE
            </h2>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
              <p className="text-[10px] sm:text-sm text-blue-100 font-medium tracking-wider">Document Log System</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>

      {/* Navigation Menu Bar */}
      <div className="bg-[#0A2D55]/95 backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto px-3 sm:px-6 max-w-7xl">
          <nav className="flex items-center overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-all
                    border-b-2 whitespace-nowrap
                    ${
                      isActive
                        ? 'border-accent text-white bg-white/10'
                        : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
