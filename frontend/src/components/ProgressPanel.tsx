/**
 * Progress Panel Component - Shows research progress
 * Scholar's Sanctum aesthetic
 */

import { Search, FileText, Sparkles, BookOpen, ExternalLink } from 'lucide-react'
import { useSessionsStore } from '../stores/sessions'

export default function ProgressPanel() {
  const progress = useSessionsStore((s) => s.currentProgress)
  
  if (!progress) return null
  
  const { phase, message, completedPoints, totalPoints, sources } = progress
  
  const getPhaseIcon = () => {
    switch (phase) {
      case 'Searching':
        return <Search className="w-5 h-5" />
      case 'Analyzing':
        return <FileText className="w-5 h-5" />
      case 'Planning':
        return <FileText className="w-5 h-5" />
      case 'Researching':
        return <BookOpen className="w-5 h-5" />
      case 'Synthesizing':
        return <Sparkles className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }
  
  const progressPercent = totalPoints > 0 
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0
  
  return (
    <div className="fixed bottom-28 right-6 w-80 animate-slide-up">
      <div className="card-elevated overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-ink-900 border-b border-ink-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center
                          text-accent-500 border border-accent-500/20">
            {getPhaseIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-medium text-parchment-100">{phase}</p>
            <p className="text-xs text-parchment-500 font-sans truncate">{message}</p>
          </div>
          {/* Animated indicator */}
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse-warm" 
                 style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse-warm" 
                 style={{ animationDelay: '200ms' }} />
            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse-warm" 
                 style={{ animationDelay: '400ms' }} />
          </div>
        </div>
        
        {/* Progress bar */}
        {totalPoints > 0 && (
          <div className="px-4 py-3 border-b border-ink-800">
            <div className="flex items-center justify-between text-xs font-sans mb-2">
              <span className="text-parchment-500">Investigation Progress</span>
              <span className="text-accent-400 font-medium">{completedPoints} / {totalPoints}</span>
            </div>
            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full progress-bar rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Sources */}
        {sources.length > 0 && (
          <div className="px-4 py-3 max-h-36 overflow-y-auto bg-ink-925">
            <p className="text-label text-xs mb-2 flex items-center gap-2">
              <ExternalLink className="w-3 h-3" />
              <span>Sources Consulted ({sources.length})</span>
            </p>
            <div className="space-y-1.5">
              {sources.slice(-5).map((url, i) => {
                let hostname = url
                try {
                  hostname = new URL(url).hostname.replace('www.', '')
                } catch {}
                return (
                  <p
                    key={i}
                    className="text-xs text-parchment-400 font-sans truncate
                              hover:text-accent-400 transition-colors cursor-default"
                    title={url}
                  >
                    <span className="text-accent-500/60 mr-1.5">◆</span>
                    {hostname}
                  </p>
                )
              })}
              {sources.length > 5 && (
                <p className="text-xs text-parchment-600 font-sans italic pl-4">
                  +{sources.length - 5} additional sources
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
