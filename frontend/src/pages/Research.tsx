/**
 * Research Page - Main research interface
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
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <p className="text-sm text-red-400">{error}</p>
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
          placeholder={phase === 'done' ? 'Start a new research...' : 'Enter your research question...'}
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
        <div className="border-t border-dark-700 bg-dark-900 p-6 text-center">
          <p className="text-dark-400">
            Research in progress... This may take several minutes.
          </p>
          <button
            onClick={cancelResearch}
            className="btn btn-secondary mt-4"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
