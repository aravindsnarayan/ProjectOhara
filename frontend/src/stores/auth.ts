/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  setAuth: (user: User, token: string) => void
  setToken: (token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user: User, token: string) => 
        set({ user, token, isAuthenticated: true }),
      
      setToken: (token: string) =>
        set({ token }),
      
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false }),
      
      updateUser: (updates: Partial<User>) =>
        set((state: AuthState) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'ohara-auth',
    }
  )
)
