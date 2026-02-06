/**
 * Input Bar Component - Research query input
 * Scholar's Sanctum aesthetic
 */

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Square, Feather } from 'lucide-react'

interface InputBarProps {
  onSubmit: (message: string) => void
  isLoading?: boolean
  onCancel?: () => void
  placeholder?: string
  disabled?: boolean
}

export default function InputBar({
  onSubmit,
  isLoading,
  onCancel,
  placeholder = 'What shall we investigate today?',
  disabled,
}: InputBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading || disabled) return
    
    onSubmit(trimmed)
    setValue('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }
  
  return (
    <div className="border-t border-ink-800/60 bg-ink-950/80 backdrop-blur-sm p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Decorative corner elements */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-accent-500/30 rounded-tl" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-accent-500/30 rounded-tr" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-accent-500/30 rounded-bl" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-accent-500/30 rounded-br" />
          
          <div className="flex items-end gap-3 bg-ink-900 rounded-xl border border-ink-700 p-3
                          shadow-inner-light focus-within:border-accent-600/50 focus-within:ring-2 
                          focus-within:ring-accent-500/20 transition-all duration-300">
            <Feather className="w-5 h-5 text-accent-500/60 mb-2 flex-shrink-0 hidden md:block" />
            
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={placeholder}
              disabled={isLoading || disabled}
              rows={1}
              className="flex-1 bg-transparent text-parchment-100 placeholder-parchment-600 
                         font-sans text-base leading-relaxed
                         resize-none px-2 py-2 focus:outline-none max-h-48"
            />
            
            {isLoading ? (
              <button
                onClick={onCancel}
                className="btn btn-danger flex items-center gap-2 mb-0.5"
              >
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || disabled}
                className="btn btn-primary flex items-center gap-2 mb-0.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Research</span>
              </button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-parchment-600 mt-3 text-center font-sans">
          <kbd className="px-1.5 py-0.5 bg-ink-800 border border-ink-700 rounded text-parchment-400 font-mono text-[10px]">
            Enter
          </kbd>
          <span className="mx-2">to send</span>
          <kbd className="px-1.5 py-0.5 bg-ink-800 border border-ink-700 rounded text-parchment-400 font-mono text-[10px]">
            Shift + Enter
          </kbd>
          <span className="ml-2">for new line</span>
        </p>
      </div>
    </div>
  )
}
