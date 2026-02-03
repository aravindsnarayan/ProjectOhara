/**
 * Sessions Page - View and manage research history
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Clock, FileText, Loader2 } from 'lucide-react'
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
    
    if (!confirm('Delete this research session?')) return
    
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
    
    return date.toLocaleDateString()
  }
  
  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      idle: 'New',
      overview: 'Starting',
      searching: 'Searching',
      clarifying: 'Clarifying',
      planning: 'Planning',
      researching: 'Researching',
      done: 'Complete',
    }
    return labels[phase] || phase
  }
  
  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-dark-600',
      overview: 'bg-yellow-600',
      searching: 'bg-blue-600',
      clarifying: 'bg-purple-600',
      planning: 'bg-orange-600',
      researching: 'bg-cyan-600',
      done: 'bg-green-600',
    }
    return colors[phase] || 'bg-dark-600'
  }
  
  if (sessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-dark-400" />
          </div>
          <h2 className="text-xl font-semibold text-dark-100 mb-2">
            No research sessions yet
          </h2>
          <p className="text-dark-400">
            Start a new research to see your history here.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Research History</h1>
            <p className="text-dark-400 mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenSession(session)}
              className="card hover:bg-dark-800 cursor-pointer transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-dark-700">
                  <FileText className="w-5 h-5 text-dark-400" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-dark-100 truncate">
                      {session.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getPhaseColor(session.phase)}`}>
                      {getPhaseLabel(session.phase)}
                    </span>
                    {session.academicMode && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400">
                        Academic
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(session.updatedAt)}
                    </span>
                    {session.totalSources !== undefined && session.totalSources > 0 && (
                      <span>{session.totalSources} sources</span>
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
                  className="p-2 text-dark-500 hover:text-red-400 hover:bg-dark-700 
                             rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
