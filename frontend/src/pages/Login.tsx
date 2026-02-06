/**
 * Login Page - OAuth authentication
 * Scholar's Sanctum aesthetic
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Library, Github } from 'lucide-react'
import { useAuthStore } from '../stores/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Handle OAuth callback
  useEffect(() => {
    if (location.pathname.includes('/callback')) {
      // Backend returns token directly after OAuth
      const token = searchParams.get('token')
      const error = searchParams.get('error')
      
      if (error) {
        setError(decodeURIComponent(error))
        return
      }
      
      if (token) {
        handleToken(token)
      }
    }
  }, [location, searchParams])
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])
  
  const handleToken = async (token: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Save token first
      useAuthStore.getState().setToken(token)
      
      // Fetch user info - use relative URL in production
      const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get user info')
      }
      
      const user = await response.json()
      setAuth(user, token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      useAuthStore.getState().logout()
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    // Navigate directly to the backend OAuth endpoint
    // Use relative URL to leverage nginx proxy in production
    const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
    window.location.href = `${apiBase}/auth/${provider}/login`
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-975 p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[800px] h-[800px] 
                        bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04)_0%,transparent_70%)]" />
        
        {/* Decorative lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-parchment-400"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Corner ornaments */}
        <div className="absolute top-8 left-8 font-display text-4xl text-accent-500/10">❧</div>
        <div className="absolute bottom-8 right-8 font-display text-4xl text-accent-500/10 rotate-180">❧</div>
      </div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-700 
                          rounded-2xl flex items-center justify-center mx-auto mb-6
                          shadow-glow-amber shadow-lg">
            <Library className="w-10 h-10 text-ink-950" strokeWidth={2} />
          </div>
          <h1 className="font-display text-5xl font-semibold text-parchment-100 tracking-tight">
            Ohara
          </h1>
          <p className="font-display text-lg text-parchment-500 mt-2 italic">
            Where knowledge finds its voice
          </p>
        </div>
        
        {/* Card */}
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-medium text-parchment-100 mb-2">
              Enter the Library
            </h2>
            <p className="text-body text-sm">
              Sign in to begin your research journey
            </p>
          </div>
          
          {error && (
            <div className="bg-burgundy-500/10 border border-burgundy-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-burgundy-400 font-sans">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-accent-500/20 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-accent-500 rounded-full animate-spin" />
              </div>
              <p className="text-parchment-400 text-sm font-sans">Authenticating...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleLogin('google')}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 
                           bg-parchment-100 text-ink-900 rounded-xl font-sans font-medium
                           hover:bg-parchment-50 transition-all duration-200
                           shadow-md hover:shadow-lg group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button
                onClick={() => handleLogin('github')}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 
                           bg-ink-800 text-parchment-200 rounded-xl font-sans font-medium
                           border border-ink-700
                           hover:bg-ink-700 hover:border-ink-600 transition-all duration-200
                           group"
              >
                <Github className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="divider-ornate text-xs px-8">
            <span className="text-parchment-600 font-sans">
              By signing in, you agree to our Terms & Privacy Policy
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
