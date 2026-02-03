/**
 * Plan Panel - Shows research plan and allows starting deep research
 */

import { Play, ListChecks } from 'lucide-react'

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
    <div className="border-t border-dark-700 bg-dark-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-100">
              Research Plan Ready
            </h3>
            <p className="text-sm text-dark-400">
              {planPoints.length} research points to investigate
            </p>
          </div>
        </div>
        
        <div className="bg-dark-800 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
          <ul className="space-y-2">
            {planPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-dark-300">
                  {index + 1}
                </span>
                <span className="text-dark-200">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={onStartResearch}
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          <span>Start Deep Research</span>
        </button>
        
        <p className="text-xs text-dark-500 mt-2 text-center">
          This may take several minutes depending on the topic complexity
        </p>
      </div>
    </div>
  )
}
