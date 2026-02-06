/**
 * Sessions Page - View and manage research history
 * Scholar's Sanctum aesthetic
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Clock, Scroll, Loader2, Archive, BookOpen } from 'lucide-react'
import { useSessionsStore, ResearchSession } from '../stores/sessions'
import { useApi } from '../hooks/useApi'

export default function SessionsPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { sessions, deleteSession } = useSessionsStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const handleOpenSession = (session: ResearchSession) => {
    navigate(`/session/${session.id}`)
  }
  
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    
    if (!confirm('Remove this research from the archives?')) return
    
    setDeleteId(sessionId)
    
    try {
      await api.deleteSession(sessionId)
      deleteSession(sessionId)
    } catch (err) {
      console.error('Failed to delete session:', err)
    } finally {
      setDeleteId(null)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
  
  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      idle: 'New',
      overview: 'Beginning',
      searching: 'Searching',
      clarifying: 'Clarifying',
      planning: 'Planning',
      researching: 'Researching',
      done: 'Complete',
    }
    return labels[phase] || phase
  }
  
  const getPhaseStyles = (phase: string) => {
    const styles: Record<string, string> = {
      idle: 'bg-ink-700 text-parchment-400 border-ink-600',
      overview: 'bg-parchment-500/10 text-parchment-400 border-parchment-500/20',
      searching: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
      clarifying: 'bg-burgundy-500/10 text-burgundy-400 border-burgundy-500/20',
      planning: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
      researching: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
      done: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return styles[phase] || 'bg-ink-700 text-parchment-400 border-ink-600'
  }
  
  if (sessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-display text-3xl text-accent-500/30">
              ❧
            </div>
            <div className="w-24 h-24 mx-auto rounded-2xl
                            bg-ink-900 border border-ink-800
                            flex items-center justify-center">
              <Archive className="w-12 h-12 text-parchment-600" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="font-display text-2xl font-medium text-parchment-100 mb-3">
            The Archives Await
          </h2>
          <p className="text-body text-parchment-500">
            Your research sessions shall be preserved here for future reference.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <BookOpen className="w-8 h-8 text-accent-500" strokeWidth={1.5} />
            <h1 className="font-display text-3xl font-semibold text-parchment-100">
              Research Archives
            </h1>
          </div>
          <p className="text-body text-parchment-500 ml-12">
            {sessions.length} investigation{sessions.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        
        {/* Sessions list */}
        <div className="space-y-3 stagger-fade-in">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenSession(session)}
              className="card-interactive p-5 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-ink-800 rounded-xl flex items-center justify-center 
                                flex-shrink-0 border border-ink-700
                                group-hover:bg-accent-500/10 group-hover:border-accent-500/20 
                                transition-all duration-300">
                  <Scroll className="w-6 h-6 text-parchment-500 
                                     group-hover:text-accent-400 transition-colors" strokeWidth={1.5} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-display text-lg font-medium text-parchment-100 
                                   group-hover:text-accent-300 transition-colors">
                      {session.title}
                    </h3>
                    <span className={`badge border ${getPhaseStyles(session.phase)}`}>
                      {getPhaseLabel(session.phase)}
                    </span>
                    {session.academicMode && (
                      <span className="badge badge-burgundy">
                        Academic
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-5 text-sm text-parchment-500 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-parchment-600" />
                      {formatDate(session.updatedAt)}
                    </span>
                    {session.totalSources !== undefined && session.totalSources > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-accent-500/60">◆</span>
                        {session.totalSources} sources
                      </span>
                    )}
                    {session.durationSeconds !== undefined && session.durationSeconds > 0 && (
                      <span>
                        {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  disabled={deleteId === session.id}
                  className="p-2.5 text-parchment-600 hover:text-burgundy-400 
                             hover:bg-burgundy-500/10 rounded-lg 
                             opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  {deleteId === session.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
