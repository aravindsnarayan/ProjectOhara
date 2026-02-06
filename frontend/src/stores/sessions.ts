/**
 * Sessions Store - Research session management
 * Enhanced message types for rich UI rendering
 */

import { create } from 'zustand'

// Rich message types matching Lutum-Veritas
export type MessageType = 
  | 'text' 
  | 'plan' 
  | 'clarification' 
  | 'progress' 
  | 'report'
  | 'sources'           // URL sources box
  | 'point_summary'     // Research point completion
  | 'synthesis_waiting' // Waiting for synthesis
  | 'log'               // System log message

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: MessageType
  data?: Record<string, unknown>
  
  // For sources type
  sources?: string[]
  
  // For point_summary type
  pointTitle?: string
  pointNumber?: number
  totalPoints?: number
  dossierFull?: string
  skipped?: boolean
  skipReason?: string
  
  // For log type
  logLevel?: 'warning' | 'error'
  
  // For synthesis_waiting type
  estimatedMinutes?: number
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
  planVersion?: number
  finalDocument?: string
  sourceRegistry?: Record<number, string>
  totalSources?: number
  durationSeconds?: number
  
  // Context state from backend
  contextState?: {
    user_query: string
    clarification_questions: string[]
    clarification_answers: string[]
    research_plan: string[]
    plan_version: number
    session_title: string
    current_step: number
    academic_bereiche?: Record<string, string[]>
  }
  
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
    elapsedSeconds?: number
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
