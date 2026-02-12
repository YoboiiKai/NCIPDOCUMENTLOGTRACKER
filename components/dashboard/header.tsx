'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
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
              <Image
                src="/Logo/ncip.png"
                alt="NCIP Logo"
                width={52}
                height={52}
                className="object-contain w-full h-full"
              />
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

        <div className="flex items-center gap-5">
          {/* User Profile Circle with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white font-semibold text-sm hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-2xl z-[101] overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {userEmail?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{userEmail}</p>
                        <p className="text-xs text-muted-foreground">Administrator</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        // Add settings navigation here
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-muted transition-colors"
                    >
                      <Settings size={16} className="text-muted-foreground" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-muted transition-colors text-destructive"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
    </header>
  )
}
