/**
 * Login Page - OAuth authentication
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { BookOpen, Github, Loader2 } from 'lucide-react'
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
      
      // Fetch user info
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/auth/me`, {
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/api/auth/${provider}/login`
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-50">Project Ohara</h1>
          <p className="text-dark-400 mt-2">Deep Research Engine</p>
        </div>
        
        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-dark-100 mb-6 text-center">
            Sign in to continue
          </h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleLogin('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 
                           bg-white text-gray-900 rounded-lg font-medium
                           hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button
                onClick={() => handleLogin('github')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 
                           bg-dark-700 text-dark-100 rounded-lg font-medium
                           hover:bg-dark-600 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          )}
        </div>
        
        <p className="text-xs text-dark-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
