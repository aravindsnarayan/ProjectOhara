/**
 * Plan Panel - Shows research plan and allows starting deep research
 * Scholar's Sanctum aesthetic
 */

import { Play, Scroll } from 'lucide-react'

interface PlanPanelProps {
  planPoints: string[]
  onStartResearch: () => void
  isLoading?: boolean
}

export default function PlanPanel({
  planPoints,
  onStartResearch,
  isLoading,
}: PlanPanelProps) {
  return (
    <div className="border-t border-ink-800/60 bg-ink-950/80 backdrop-blur-sm p-6">
      <div className="max-w-2xl mx-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500/20 to-accent-600/10 
                          rounded-xl flex items-center justify-center
                          border border-accent-500/30 shadow-glow-amber">
            <Scroll className="w-6 h-6 text-accent-500" />
          </div>
          <div>
            <h3 className="font-display text-xl font-medium text-parchment-100">
              Research Plan Prepared
            </h3>
            <p className="text-sm text-parchment-500 font-sans">
              {planPoints.length} investigation point{planPoints.length !== 1 ? 's' : ''} outlined
            </p>
          </div>
        </div>
        
        {/* Plan points */}
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 mb-5 max-h-52 overflow-y-auto">
          <ol className="space-y-3">
            {planPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <span className="w-7 h-7 bg-accent-500/10 border border-accent-500/20
                                rounded-lg flex items-center justify-center flex-shrink-0 
                                font-display text-sm text-accent-400
                                group-hover:bg-accent-500/20 transition-colors">
                  {index + 1}
                </span>
                <span className="text-body text-parchment-300 pt-0.5">{point}</span>
              </li>
            ))}
          </ol>
        </div>
        
        {/* Action button */}
        <button
          onClick={onStartResearch}
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
        >
          <Play className="w-5 h-5" />
          <span className="font-display font-medium">Begin Deep Research</span>
        </button>
        
        <p className="text-xs text-parchment-600 mt-4 text-center font-sans italic">
          The investigation may take several minutes depending on the depth of inquiry
        </p>
      </div>
    </div>
  )
}
