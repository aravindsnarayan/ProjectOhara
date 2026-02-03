/**
 * Sessions Store - Research session management
 */

import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'plan' | 'clarification' | 'progress' | 'report'
  data?: Record<string, unknown>
}

export interface ResearchSession {
  id: string
  title: string
  phase: 'idle' | 'overview' | 'searching' | 'clarifying' | 'planning' | 'researching' | 'done'
  messages: Message[]
  academicMode: boolean
  
  // Research state
  queries?: string[]
  urls?: string[]
  planPoints?: string[]
  finalDocument?: string
  sourceRegistry?: Record<number, string>
  totalSources?: number
  durationSeconds?: number
  
  createdAt: string
  updatedAt: string
}

interface SessionsState {
  sessions: ResearchSession[]
  activeSessionId: string | null
  
  // Current research progress
  currentProgress: {
    phase: string
    message: string
    completedPoints: number
    totalPoints: number
    sources: string[]
  } | null
  
  // Actions
  createSession: (session: ResearchSession) => void
  updateSession: (id: string, updates: Partial<ResearchSession>) => void
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  addMessage: (sessionId: string, message: Message) => void
  setProgress: (progress: SessionsState['currentProgress']) => void
  clearProgress: () => void
  
  // Getters
  getActiveSession: () => ResearchSession | null
}

export const useSessionsStore = create<SessionsState>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  currentProgress: null,
  
  createSession: (session: ResearchSession) =>
    set((state: SessionsState) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
    })),
  
  updateSession: (id: string, updates: Partial<ResearchSession>) =>
    set((state: SessionsState) => ({
      sessions: state.sessions.map((s: ResearchSession) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    })),
  
  deleteSession: (id: string) =>
    set((state: SessionsState) => ({
      sessions: state.sessions.filter((s: ResearchSession) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
  
  setActiveSession: (id: string | null) =>
    set({ activeSessionId: id }),
  
  addMessage: (sessionId: string, message: Message) =>
    set((state: SessionsState) => ({
      sessions: state.sessions.map((s: ResearchSession) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() }
          : s
      ),
    })),
  
  setProgress: (progress: SessionsState['currentProgress']) =>
    set({ currentProgress: progress }),
  
  clearProgress: () =>
    set({ currentProgress: null }),
  
  getActiveSession: () => {
    const state = get()
    return state.sessions.find((s: ResearchSession) => s.id === state.activeSessionId) || null
  },
}))
