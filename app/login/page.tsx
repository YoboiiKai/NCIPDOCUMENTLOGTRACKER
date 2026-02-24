"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

const DEMO_PASSWORD = 'ncip2026'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    if (!password) {
      setError('Please enter your password')
      setLoading(false)
      return
    }
    if (password !== DEMO_PASSWORD) {
      setError('Incorrect password. Please try again.')
      setLoading(false)
      return
    }

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    login(email)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      </div>

      {/* Glass morphism container */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative p-8 md:p-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
          {/* Logo section with glow effect */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-xl ring-2 ring-white/30 w-20 h-20 sm:w-24 sm:h-24">
                <Image
                  src="/Logo/ncip.png"
                  alt="NCIP Logo"
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-blue-100/90 text-sm md:text-base">
              National Commission on Indigenous People
            </p>
            <p className="text-blue-200/70 text-xs md:text-sm mt-2">
              Document Log Management System
            </p>
          </div>

          {/* Form section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address
              </label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-white/10 border border-white/20 placeholder:text-white/50 text-white h-12 rounded-lg focus:bg-white/15 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white/10 border border-white/20 placeholder:text-white/50 text-white h-12 pr-11 rounded-lg focus:bg-white/15 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-red-200 text-sm font-medium text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
              <p className="text-xs text-blue-100/80 text-center">
                💡 Demo Mode — Email: any valid address &nbsp;·&nbsp; Password: <code className="font-mono text-blue-300">ncip2026</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
