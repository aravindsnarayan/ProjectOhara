/**
 * Progress Panel Component - Shows research progress
 */

import { Loader2, Link, Search, FileText, Sparkles } from 'lucide-react'
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
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'Synthesizing':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />
    }
  }
  
  const progressPercent = totalPoints > 0 
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0
  
  return (
    <div className="fixed bottom-24 right-6 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-dark-700 border-b border-dark-600 flex items-center gap-3">
        <div className="text-primary-400">
          {getPhaseIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-100">{phase}</p>
          <p className="text-xs text-dark-400 truncate">{message}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      {totalPoints > 0 && (
        <div className="px-4 py-3 border-b border-dark-700">
          <div className="flex items-center justify-between text-xs text-dark-400 mb-2">
            <span>Progress</span>
            <span>{completedPoints} / {totalPoints} points</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Sources */}
      {sources.length > 0 && (
        <div className="px-4 py-3 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-dark-400 mb-2 flex items-center gap-2">
            <Link className="w-3 h-3" />
            <span>Sources ({sources.length})</span>
          </p>
          <div className="space-y-1">
            {sources.slice(-5).map((url, i) => (
              <p
                key={i}
                className="text-xs text-dark-300 truncate"
                title={url}
              >
                {new URL(url).hostname}
              </p>
            ))}
            {sources.length > 5 && (
              <p className="text-xs text-dark-500">
                +{sources.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
