/**
 * Clarification Panel - Shows clarification questions and accepts answers
 * Scholar's Sanctum aesthetic
 */

import { useState } from 'react'
import { ArrowRight, SkipForward, HelpCircle } from 'lucide-react'

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
    <div className="border-t border-ink-800/60 bg-ink-950/80 backdrop-blur-sm p-6">
      <div className="max-w-2xl mx-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-accent-500/10 rounded-xl flex items-center justify-center
                          border border-accent-500/20">
            <HelpCircle className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-medium text-parchment-100">
              A Moment of Clarification
            </h3>
            <p className="text-sm text-parchment-500 font-sans">
              Help me understand your needs better
            </p>
          </div>
        </div>
        
        {/* Question card */}
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 mb-5">
          <p className="text-body text-parchment-300 whitespace-pre-wrap leading-relaxed">
            {clarificationText}
          </p>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="text-label mb-2 block">
              Your Response
            </label>
            <p className="text-xs text-parchment-500 mb-3 font-sans">
              One answer per line, or leave empty to proceed with reasonable defaults
            </p>
            <textarea
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              placeholder="Enter your clarifications here..."
              disabled={isLoading}
              rows={4}
              className="input"
            />
          </div>
          
          <div className="flex items-center gap-3 pt-2">
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
              <span>Proceed with Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
