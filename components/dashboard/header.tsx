'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Image
              src="/Logo/ncip.png"
              alt="NCIP Logo"
              width={50}
              height={50}
              className="object-contain rounded-full"
            />
          <div>
            <h2 className="font-bold text-lg text-white">DocLog</h2>
            <p className="text-xs text-white/70">Document Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{userEmail}</p>
            <p className="text-xs text-white/70">Administrator</p>
          </div>
          <Button
            onClick={handleLogout}
            size="sm"
            className="gap-2 bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
