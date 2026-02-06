/**
 * Chat Component - Displays research conversation
 * Scholar's Sanctum aesthetic
 */

import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Library, Scroll, ListChecks, HelpCircle } from 'lucide-react'
import { Message } from '../stores/sessions'

interface ChatProps {
  messages: Message[]
  isLoading?: boolean
}

export default function Chat({ messages, isLoading }: ChatProps) {
  const endRef = useRef<HTMLDivElement>(null)
  
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
            <div className="bg-ink-900 border border-ink-800 rounded-2xl rounded-tl-sm p-5 mt-1">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-warm" 
                       style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-sm text-parchment-500 font-sans italic">
                  Consulting the archives...
                </span>
              </div>
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
        {message.type && message.type !== 'text' && (
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
