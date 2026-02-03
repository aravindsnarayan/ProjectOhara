/**
 * Input Bar Component - Research query input
 */

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'

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
  placeholder = 'Enter your research question...',
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
    <div className="border-t border-dark-700 bg-dark-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 bg-dark-800 rounded-xl border border-dark-600 p-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 bg-transparent text-dark-100 placeholder-dark-400 
                       resize-none px-3 py-2 focus:outline-none max-h-48"
          />
          
          {isLoading ? (
            <button
              onClick={onCancel}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Research</span>
            </button>
          )}
        </div>
        
        <p className="text-xs text-dark-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
