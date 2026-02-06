/**
 * Chat Component - Displays research conversation
 * Scholar's Sanctum aesthetic with rich message rendering
 */

import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { 
  User, 
  Library, 
  Scroll, 
  ListChecks, 
  HelpCircle,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  SkipForward,
  BookOpen
} from 'lucide-react'
import { Message } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { t } from '../i18n/translations'

interface ChatProps {
  messages: Message[]
  isLoading?: boolean
  currentStatus?: string
  elapsedSeconds?: number
}

// Format elapsed time as MM:SS
function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Extract domain from URL for display
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Collapsible Sources Box Component
function SourcesBox({ sources }: { sources: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const lang = useSettingsStore((state) => state.language)
  
  return (
    <div className="mt-4 rounded-xl border border-ink-800 overflow-hidden bg-ink-950/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 
                   hover:bg-ink-900/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-parchment-200">
          <BookOpen className="w-4 h-4 text-accent-500" />
          {t('sourcesUsed', lang)}{sources.length})
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-parchment-500 transition-transform duration-200 
                     ${expanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {expanded && (
        <div className="border-t border-ink-800 divide-y divide-ink-800/50">
          {sources.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-ink-900/30 
                         transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-accent-500/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-parchment-300 
                               group-hover:text-accent-400 transition-colors">
                  {getDomain(url)}
                </span>
                <div className="text-xs text-parchment-600 truncate mt-0.5">
                  {url}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Point Summary Box Component
function PointSummaryBox({ message }: { message: Message }) {
  const [showFull, setShowFull] = useState(false)
  const lang = useSettingsStore((state) => state.language)
  
  const progress = message.pointNumber && message.totalPoints 
    ? Math.round((message.pointNumber / message.totalPoints) * 100)
    : 0
  
  if (message.skipped) {
    return (
      <div className="rounded-xl border-2 border-accent-500/30 overflow-hidden 
                      bg-gradient-to-br from-accent-500/5 to-accent-600/10">
        <div className="px-4 py-3 bg-accent-500/10 border-b border-accent-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-bold text-accent-400">
              <SkipForward className="w-4 h-4" />
              {t('pointSkipped', lang)}{message.pointNumber}/{message.totalPoints}{t('skipped', lang)}
            </span>
            <span className="text-xs font-semibold text-accent-400/80">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-ink-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full 
                         transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="px-4 py-2 border-b border-accent-500/10">
          <span className="text-sm font-semibold text-parchment-200">
            {message.pointTitle}
          </span>
        </div>
        <div className="px-4 py-3 text-sm text-accent-400/80">
          <strong>{t('reason', lang)}</strong> {message.skipReason || 'Unknown'}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl border-2 border-green-500/30 overflow-hidden 
                    bg-gradient-to-br from-green-500/5 to-green-600/10">
      {/* Header with progress */}
      <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 text-sm font-bold text-green-400">
            <CheckCircle className="w-4 h-4" />
            {t('pointCompleted', lang)}{message.pointNumber}/{message.totalPoints}{t('completed', lang)}
          </span>
          <span className="text-xs font-semibold text-green-400/80">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-ink-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full 
                       transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Point title */}
      <div className="px-4 py-2 border-b border-green-500/10">
        <span className="text-sm font-semibold text-parchment-200">
          {message.pointTitle}
        </span>
      </div>
      
      {/* Key learnings */}
      <div className="px-4 py-3 text-sm text-parchment-400 leading-relaxed">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      
      {/* Full dossier toggle */}
      {message.dossierFull && (
        <div className="border-t border-green-500/20">
          <button
            onClick={() => setShowFull(!showFull)}
            className="w-full flex items-center justify-between px-4 py-2 
                       hover:bg-green-500/10 transition-colors text-sm"
          >
            <span className="flex items-center gap-2 text-green-400 font-medium">
              <Scroll className="w-4 h-4" />
              {showFull ? t('hideDossier', lang) : t('showFullDossier', lang)}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-green-400 transition-transform duration-200 
                         ${showFull ? 'rotate-180' : ''}`}
            />
          </button>
          
          {showFull && (
            <div className="px-4 py-4 border-t border-green-500/10 bg-ink-950/30 
                           text-sm text-parchment-400 leading-relaxed 
                           max-h-[500px] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.dossierFull}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Synthesis Waiting Box
function SynthesisWaitingBox({ message }: { message: Message }) {
  const lang = useSettingsStore((state) => state.language)
  
  return (
    <div className="rounded-xl border-2 border-burgundy-500/30 overflow-hidden 
                    bg-gradient-to-br from-burgundy-500/5 to-burgundy-600/10">
      <div className="px-4 py-3 bg-burgundy-500/10 border-b border-burgundy-500/20">
        <div className="flex items-center gap-2 text-sm font-bold text-burgundy-400">
          <div className="w-4 h-4 animate-spin">
            <Scroll className="w-4 h-4" />
          </div>
          {t('finalSynthesisRunning', lang)}
          {message.estimatedMinutes && (
            <span className="ml-auto text-xs font-normal opacity-80">
              ~{message.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3 text-sm text-parchment-400 leading-relaxed">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      <div className="px-4 py-2 bg-burgundy-500/5 border-t border-burgundy-500/10">
        <div className="flex items-center gap-2 text-xs text-burgundy-400/70">
          <span className="animate-pulse-warm">●</span>
          <span className="animate-pulse-warm" style={{ animationDelay: '200ms' }}>●</span>
          <span className="animate-pulse-warm" style={{ animationDelay: '400ms' }}>●</span>
          <span className="ml-2">{t('processing', lang)}</span>
        </div>
      </div>
    </div>
  )
}

// Log Message Component
function LogMessage({ message }: { message: Message }) {
  const isError = message.logLevel === 'error'
  
  return (
    <div className={`relative overflow-hidden rounded-xl border px-4 py-3 text-sm 
                    ${isError 
                      ? 'border-red-500/40 bg-gradient-to-r from-red-500/10 to-red-500/5' 
                      : 'border-accent-500/40 bg-gradient-to-r from-accent-500/10 to-accent-500/5'
                    }`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-accent-400" />
        )}
        <span className={isError ? 'text-red-400' : 'text-accent-400'}>
          {isError ? 'System Error' : 'System Notice'}
        </span>
      </div>
      <div className={isError ? 'text-red-200' : 'text-accent-200'}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export default function Chat({ messages, isLoading, currentStatus, elapsedSeconds }: ChatProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const lang = useSettingsStore((state) => state.language)
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg animate-fade-in">
          {/* Ornate frame */}
          <div className="relative mb-8">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-display text-3xl text-accent-500/30">
              ❧
            </div>
            <div className="w-24 h-24 mx-auto rounded-2xl
                            bg-gradient-to-br from-accent-500/10 to-accent-600/5
                            border border-accent-500/20
                            flex items-center justify-center
                            shadow-glow-amber">
              <Library className="w-12 h-12 text-accent-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-display text-3xl text-accent-500/30 rotate-180">
              ❧
            </div>
          </div>
          
          <h2 className="font-display text-3xl font-medium text-parchment-100 mb-4">
            Begin Your Research
          </h2>
          <p className="text-body text-parchment-400 max-w-md mx-auto leading-relaxed">
            Ask any question and I shall conduct a comprehensive investigation, 
            drawing from the vast archives of human knowledge.
          </p>
          
          {/* Decorative divider */}
          <div className="mt-8 flex items-center justify-center gap-3 text-parchment-600">
            <span className="w-16 h-px bg-gradient-to-r from-transparent to-ink-700" />
            <span className="font-display text-sm italic">scroll down to inquire</span>
            <span className="w-16 h-px bg-gradient-to-l from-transparent to-ink-700" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto stagger-fade-in">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-4 animate-fade-in">
            <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-600 
                            rounded-xl flex items-center justify-center flex-shrink-0
                            shadow-glow-amber">
              <Library className="w-5 h-5 text-ink-950" strokeWidth={2} />
            </div>
            <div className="flex-1 bg-ink-900 border border-ink-800 rounded-2xl rounded-tl-sm p-5 mt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-sm text-parchment-500 font-sans italic">
                  {currentStatus || t('consultingArchives', lang)}
                </span>
              </div>
              
              {/* Timer and progress bar */}
              {elapsedSeconds !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-parchment-500">{t('elapsed', lang)}</span>
                    <span className="text-accent-400 font-mono">{formatTimer(elapsedSeconds)}</span>
                  </div>
                  <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 
                                  rounded-full animate-shimmer" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div ref={endRef} className="h-4" />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  const getTypeIcon = () => {
    switch (message.type) {
      case 'plan':
        return <ListChecks className="w-4 h-4" />
      case 'clarification':
        return <HelpCircle className="w-4 h-4" />
      case 'report':
        return <Scroll className="w-4 h-4" />
      default:
        return null
    }
  }
  
  const getTypeLabel = () => {
    switch (message.type) {
      case 'plan':
        return 'Research Plan'
      case 'clarification':
        return 'Clarification Needed'
      case 'report':
        return 'Research Report'
      default:
        return null
    }
  }
  
  // Special rendering for rich message types
  if (message.type === 'sources' && message.sources) {
    return (
      <div className="mb-6">
        <SourcesBox sources={message.sources} />
      </div>
    )
  }
  
  if (message.type === 'point_summary') {
    return (
      <div className="mb-6">
        <PointSummaryBox message={message} />
      </div>
    )
  }
  
  if (message.type === 'synthesis_waiting') {
    return (
      <div className="mb-6">
        <SynthesisWaitingBox message={message} />
      </div>
    )
  }
  
  if (message.type === 'log') {
    return (
      <div className="mb-6">
        <LogMessage message={message} />
      </div>
    )
  }
  
  return (
    <div className={`flex items-start gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-11 h-11 bg-ink-800 border border-ink-700 
                        rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-parchment-400" strokeWidth={2} />
        </div>
      ) : (
        <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-600 
                        rounded-xl flex items-center justify-center flex-shrink-0
                        shadow-glow-amber">
          <Library className="w-5 h-5 text-ink-950" strokeWidth={2} />
        </div>
      )}
      
      {/* Content */}
      <div
        className={`max-w-[85%] rounded-2xl p-5 ${
          isUser 
            ? 'bg-accent-500/10 border border-accent-500/20 rounded-tr-sm text-parchment-100' 
            : 'bg-ink-900 border border-ink-800 rounded-tl-sm text-parchment-200'
        }`}
      >
        {/* Type badge */}
        {message.type && message.type !== 'text' && !['sources', 'point_summary', 'synthesis_waiting', 'log'].includes(message.type) && (
          <div className={`inline-flex items-center gap-2 text-xs font-sans font-medium 
                          mb-3 pb-3 border-b border-ink-800
                          ${message.type === 'report' ? 'text-accent-400' : 'text-parchment-400'}`}>
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
            {message.type === 'report' && (
              <span className="badge badge-amber ml-2">Complete</span>
            )}
          </div>
        )}
        
        {/* Message content */}
        {isUser ? (
          <p className="whitespace-pre-wrap font-sans text-parchment-100 leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
