/**
 * Clarification Panel - Shows clarification questions and accepts answers
 */

import { useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'

interface ClarificationPanelProps {
  clarificationText: string
  onSubmit: (answers: string[]) => void
  isLoading?: boolean
}

export default function ClarificationPanel({
  clarificationText,
  onSubmit,
  isLoading,
}: ClarificationPanelProps) {
  const [answers, setAnswers] = useState('')
  
  const handleSubmit = () => {
    const answerList = answers
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean)
    onSubmit(answerList)
  }
  
  const handleSkip = () => {
    onSubmit([])
  }
  
  return (
    <div className="border-t border-dark-700 bg-dark-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-800 rounded-xl p-6 mb-4">
          <p className="text-sm text-dark-300 whitespace-pre-wrap">
            {clarificationText}
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Your answers (one per line, or leave empty to skip)
            </label>
            <textarea
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              placeholder="Type your answers here..."
              disabled={isLoading}
              rows={4}
              className="input"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Continue Research</span>
            </button>
            
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="btn btn-ghost flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip & Use Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
