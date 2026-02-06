/**
 * API Hooks - React Query hooks for API calls
 */

import { useAuthStore } from '../stores/auth'

// Use relative /api path in production (nginx proxies to backend)
// Use full URL in development
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Timeout for different operations (in milliseconds)
const TIMEOUTS = {
  default: 30_000,      // 30 seconds for most requests
  scraping: 300_000,    // 5 minutes for scraping operations
  research: 600_000,    // 10 minutes for deep research
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
  timeout?: number
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, timeout = TIMEOUTS.default, ...fetchOptions } = options
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  
  if (!skipAuth) {
    const token = useAuthStore.getState().token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().logout()
        throw new Error('Session expired. Please log in again.')
      }
      
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `Request failed: ${response.status}`)
    }
    
    return response.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. The server is processing your request - please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export function useApi() {
  return {
    // Auth
    async getOAuthUrl(provider: 'google' | 'github'): Promise<{ url: string }> {
      return apiFetch(`/auth/${provider}/login`, { skipAuth: true })
    },
    
    async handleCallback(
      provider: string,
      code: string
    ): Promise<{ access_token: string; user: { id: string; email: string; name: string } }> {
      return apiFetch(`/auth/${provider}/callback?code=${code}`, { skipAuth: true })
    },
    
    // User settings
    async updateApiKeys(apiKeys: Record<string, string>): Promise<{ message: string }> {
      return apiFetch('/auth/me/api-keys', {
        method: 'PATCH',
        body: JSON.stringify(apiKeys),
      })
    },
    
    // Sessions
    async getSessions(): Promise<{ sessions: Session[] }> {
      return apiFetch('/research/sessions')
    },
    
    async getSession(id: string): Promise<Session> {
      return apiFetch(`/research/sessions/${id}`)
    },
    
    async deleteSession(id: string): Promise<void> {
      return apiFetch(`/research/sessions/${id}`, { method: 'DELETE' })
    },
    
    // Research
    async startOverview(data: {
      message: string
      provider: string
      work_model: string
      language: string
    }): Promise<OverviewResponse> {
      return apiFetch('/research/overview', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    
    async searchAndPick(sessionId: string, queries: string[]): Promise<SearchResponse> {
      return apiFetch('/research/search', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, queries }),
        timeout: TIMEOUTS.scraping,
      })
    },
    
    async clarify(sessionId: string, urls: string[]): Promise<ClarifyResponse> {
      return apiFetch('/research/clarify', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, urls }),
        timeout: TIMEOUTS.scraping,
      })
    },
    
    async createPlan(
      sessionId: string,
      clarificationAnswers: string[],
      academicMode: boolean
    ): Promise<PlanResponse> {
      return apiFetch('/research/plan', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          clarification_answers: clarificationAnswers,
          academic_mode: academicMode,
        }),
      })
    },
    
    // Deep research returns a stream
    async deepResearch(
      sessionId: string,
      planPoints: string[],
      provider: string,
      workModel: string,
      finalModel: string,
      language: string
    ): Promise<ReadableStream<Uint8Array> | null> {
      const token = useAuthStore.getState().token
      
      const response = await fetch(`${API_BASE}/research/deep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          plan_points: planPoints,
          provider,
          work_model: workModel,
          final_model: finalModel,
          language,
        }),
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout()
          throw new Error('Session expired. Please log in again.')
        }
        const error = await response.json().catch(() => ({ detail: 'Research request failed' }))
        throw new Error(error.detail || `Request failed: ${response.status}`)
      }
      
      return response.body
    },
  }
}

// Type definitions
interface Session {
  id: string
  title: string
  phase: string
  academic_mode: boolean
  total_sources: number
  created_at: string
  updated_at: string
}

interface OverviewResponse {
  session_id: string
  session_title: string
  queries: string[]
  error?: string
}

interface SearchResponse {
  urls: string[]
  error?: string
}

interface ClarifyResponse {
  clarification: string
  scraped_count: number
  error?: string
}

interface PlanResponse {
  plan_points: string[]
  plan_text: string
  error?: string
}
