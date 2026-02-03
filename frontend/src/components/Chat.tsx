/**
 * Chat Component - Displays research conversation
 */

import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot, FileText, ListChecks, HelpCircle } from 'lucide-react'
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
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-dark-100 mb-2">
            What would you like to research?
          </h2>
          <p className="text-dark-400">
            Enter a topic or question below and I'll conduct a comprehensive research analysis.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="bg-dark-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
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
        return <FileText className="w-4 h-4" />
      default:
        return null
    }
  }
  
  const getTypeLabel = () => {
    switch (message.type) {
      case 'plan':
        return 'Research Plan'
      case 'clarification':
        return 'Clarification'
      case 'report':
        return 'Final Report'
      default:
        return null
    }
  }
  
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-dark-700' : 'bg-primary-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-dark-300" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      {/* Content */}
      <div
        className={`max-w-[80%] rounded-xl p-4 ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-dark-800 text-dark-100'
        }`}
      >
        {/* Type badge */}
        {message.type && message.type !== 'text' && (
          <div className="flex items-center gap-2 text-xs text-dark-400 mb-2 pb-2 border-b border-dark-700">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>
        )}
        
        {/* Message content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
