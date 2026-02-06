/**
 * Research Page - Main research interface
 * Scholar's Sanctum aesthetic with timer and progress tracking
 */

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { useResearch } from '../hooks/useResearch'
import { t } from '../i18n/translations'
import Chat from '../components/Chat'
import InputBar from '../components/InputBar'
import ProgressPanel from '../components/ProgressPanel'
import ClarificationPanel from '../components/ClarificationPanel'
import PlanPanel from '../components/PlanPanel'
import { AlertTriangle, BookOpen, Clock, BookMarked } from 'lucide-react'

type Phase = 'idle' | 'overview' | 'searching' | 'clarifying' | 'planning' | 'researching' | 'done'

export default function ResearchPage() {
  const { sessionId } = useParams()
  const [phase, setPhase] = useState<Phase>('idle')
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const { sessions, setActiveSession, getActiveSession, currentProgress } = useSessionsStore()
  const { language, academicMode, setAcademicMode } = useSettingsStore()
  const session = getActiveSession()
  
  const {
    isLoading,
    error,
    currentStatus,
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
  
  // Timer management - start/stop based on loading state
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isLoading])
  
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
  
  const handleAcademicToggle = () => {
    setAcademicMode(!academicMode)
  }
  
  const messages = session?.messages || []
  const clarificationMessage = messages.find((m) => m.type === 'clarification')
  
  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Research Header - Timer and Mode Toggle */}
      {(isLoading || phase === 'researching') && (
        <div className="border-b border-ink-800/60 bg-ink-950/60 backdrop-blur-sm 
                        px-6 py-3 flex items-center justify-between">
          {/* Timer and Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-accent-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTimer(elapsedSeconds)}</span>
            </div>
            {currentStatus && (
              <span className="text-sm text-parchment-400 animate-pulse-warm">
                {currentStatus}
              </span>
            )}
          </div>
          
          {/* Academic Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm transition-colors 
                            ${!academicMode ? 'text-parchment-200 font-medium' : 'text-parchment-500'}`}>
              {t('normal', language)}
            </span>
            <button
              onClick={handleAcademicToggle}
              disabled={phase !== 'idle'}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 
                         ${academicMode 
                           ? 'bg-burgundy-500' 
                           : 'bg-ink-700 border border-ink-600'
                         }
                         ${phase !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={t('academicModeActive', language)}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-parchment-100 
                           shadow-sm transition-transform duration-200
                           ${academicMode ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm transition-colors flex items-center gap-1
                            ${academicMode ? 'text-parchment-200 font-medium' : 'text-parchment-500'}`}>
              <BookMarked className="w-4 h-4" />
              {t('academic', language)}
            </span>
          </div>
        </div>
      )}
      
      {/* Error banner */}
      {error && (
        <div className="bg-burgundy-500/10 border-b border-burgundy-500/30 px-6 py-4 
                        flex items-center gap-3 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-burgundy-400 flex-shrink-0" />
          <p className="text-sm text-burgundy-300 font-sans">{error}</p>
        </div>
      )}
      
      {/* Chat area with timer and status */}
      <Chat 
        messages={messages} 
        isLoading={isLoading && phase !== 'done'} 
        currentStatus={currentStatus}
        elapsedSeconds={isLoading ? elapsedSeconds : undefined}
      />
      
      {/* Progress panel */}
      <ProgressPanel />
      
      {/* Input area - changes based on phase */}
      {(phase === 'idle' || phase === 'done') && (
        <InputBar
          onSubmit={handleNewResearch}
          isLoading={isLoading}
          onCancel={cancelResearch}
          placeholder={phase === 'done' 
            ? 'Commence a new investigation...' 
            : t('startResearch', language)}
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
            
            {/* Progress info */}
            {currentProgress && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-parchment-500 mb-2">
                  <span>{t('pointCompleted', language)}{currentProgress.completedPoints}/{currentProgress.totalPoints}</span>
                  <span>{Math.round((currentProgress.completedPoints / currentProgress.totalPoints) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-500"
                    style={{ width: `${(currentProgress.completedPoints / currentProgress.totalPoints) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <p className="font-display text-lg text-parchment-200 mb-2">
              {t('researchRunning', language)}
            </p>
            <p className="text-body text-sm text-parchment-500">
              {currentProgress?.message || 'The investigation is underway. This may take several minutes...'}
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
