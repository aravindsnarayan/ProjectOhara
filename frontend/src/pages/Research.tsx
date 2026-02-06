/**
 * Research Page - Main research interface
 * Scholar's Sanctum aesthetic
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSessionsStore } from '../stores/sessions'
import { useResearch } from '../hooks/useResearch'
import Chat from '../components/Chat'
import InputBar from '../components/InputBar'
import ProgressPanel from '../components/ProgressPanel'
import ClarificationPanel from '../components/ClarificationPanel'
import PlanPanel from '../components/PlanPanel'
import { AlertTriangle, BookOpen } from 'lucide-react'

type Phase = 'idle' | 'overview' | 'searching' | 'clarifying' | 'planning' | 'researching' | 'done'

export default function ResearchPage() {
  const { sessionId } = useParams()
  const [phase, setPhase] = useState<Phase>('idle')
  
  const { sessions, setActiveSession, getActiveSession } = useSessionsStore()
  const session = getActiveSession()
  
  const {
    isLoading,
    error,
    startResearch,
    submitClarification,
    startDeepResearch,
    cancelResearch,
  } = useResearch()
  
  // Load session from URL
  useEffect(() => {
    if (sessionId) {
      setActiveSession(sessionId)
      const s = sessions.find((s) => s.id === sessionId)
      if (s) {
        setPhase(s.phase)
      }
    } else {
      setActiveSession(null)
      setPhase('idle')
    }
  }, [sessionId, sessions, setActiveSession])
  
  // Update phase from session
  useEffect(() => {
    if (session) {
      setPhase(session.phase)
    }
  }, [session?.phase])
  
  const handleNewResearch = async (query: string) => {
    try {
      const result = await startResearch(query)
      if (result.needsClarification) {
        setPhase('clarifying')
      }
    } catch (err) {
      console.error('Research failed:', err)
    }
  }
  
  const handleClarification = async (answers: string[]) => {
    if (!session) return
    
    try {
      await submitClarification(session.id, answers)
      setPhase('planning')
    } catch (err) {
      console.error('Clarification failed:', err)
    }
  }
  
  const handleStartDeepResearch = async () => {
    if (!session || !session.planPoints) return
    
    try {
      setPhase('researching')
      await startDeepResearch(session.id, session.planPoints)
      setPhase('done')
    } catch (err) {
      console.error('Deep research failed:', err)
    }
  }
  
  const messages = session?.messages || []
  const clarificationMessage = messages.find((m) => m.type === 'clarification')
  
  return (
    <div className="h-full flex flex-col">
      {/* Error banner */}
      {error && (
        <div className="bg-burgundy-500/10 border-b border-burgundy-500/30 px-6 py-4 
                        flex items-center gap-3 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-burgundy-400 flex-shrink-0" />
          <p className="text-sm text-burgundy-300 font-sans">{error}</p>
        </div>
      )}
      
      {/* Chat area */}
      <Chat messages={messages} isLoading={isLoading && phase !== 'done'} />
      
      {/* Progress panel */}
      <ProgressPanel />
      
      {/* Input area - changes based on phase */}
      {(phase === 'idle' || phase === 'done') && (
        <InputBar
          onSubmit={handleNewResearch}
          isLoading={isLoading}
          onCancel={cancelResearch}
          placeholder={phase === 'done' ? 'Commence a new investigation...' : 'What shall we investigate today?'}
        />
      )}
      
      {phase === 'clarifying' && clarificationMessage && (
        <ClarificationPanel
          clarificationText={clarificationMessage.content}
          onSubmit={handleClarification}
          isLoading={isLoading}
        />
      )}
      
      {phase === 'planning' && session?.planPoints && (
        <PlanPanel
          planPoints={session.planPoints}
          onStartResearch={handleStartDeepResearch}
          isLoading={isLoading}
        />
      )}
      
      {phase === 'researching' && (
        <div className="border-t border-ink-800/60 bg-ink-950/80 backdrop-blur-sm p-8 text-center">
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-accent-500/10 rounded-2xl animate-pulse-warm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-accent-500" />
              </div>
            </div>
            <p className="font-display text-lg text-parchment-200 mb-2">
              Research in Progress
            </p>
            <p className="text-body text-sm text-parchment-500">
              The investigation is underway. This may take several minutes as we consult various sources...
            </p>
            <button
              onClick={cancelResearch}
              className="btn btn-danger mt-6"
            >
              Cancel Investigation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
