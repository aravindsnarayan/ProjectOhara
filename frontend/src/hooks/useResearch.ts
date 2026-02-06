/**
 * Research Hook - Manages the research workflow
 * Enhanced with live status updates
 */

import { useState, useCallback, useRef } from 'react'
import { useApi } from './useApi'
import { useSessionsStore, ResearchSession, Message } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'

export interface ResearchEvent {
  type: string
  message: string
  data?: Record<string, unknown>
}

export function useResearch() {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const { createSession, updateSession, addMessage, setProgress, clearProgress } = useSessionsStore()
  const settings = useSettingsStore()
  
  const startResearch = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentStatus('Initiating research...')
    
    try {
      // Step 1: Get overview
      setCurrentStatus('Analyzing your question...')
      const overview = await api.startOverview({
        message: query,
        provider: settings.defaultProvider,
        work_model: settings.workModel,
        language: settings.language,
      })
      
      if (overview.error) {
        throw new Error(overview.error)
      }
      
      // Create local session
      const newSession: ResearchSession = {
        id: overview.session_id,
        title: overview.session_title,
        phase: 'searching',
        messages: [
          { role: 'user', content: query },
        ],
        academicMode: settings.academicMode,
        queries: overview.queries,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      createSession(newSession)
      
      // Step 2: Search and pick URLs
      setCurrentStatus('Searching for sources...')
      setProgress({
        phase: 'Searching',
        message: 'Searching for sources...',
        completedPoints: 0,
        totalPoints: 0,
        sources: [],
      })
      
      const searchResult = await api.searchAndPick(overview.session_id, overview.queries)
      
      if (searchResult.error) {
        throw new Error(searchResult.error)
      }
      
      updateSession(overview.session_id, {
        urls: searchResult.urls,
        phase: 'clarifying',
      })
      
      // Add sources message
      addMessage(overview.session_id, {
        role: 'assistant',
        content: `Found ${searchResult.urls.length} relevant sources`,
        type: 'sources',
        sources: searchResult.urls,
      })
      
      // Step 3: Clarify
      setCurrentStatus(`Analyzing ${searchResult.urls.length} sources...`)
      setProgress({
        phase: 'Analyzing',
        message: `Analyzing ${searchResult.urls.length} sources...`,
        completedPoints: 0,
        totalPoints: 0,
        sources: searchResult.urls,
      })
      
      const clarifyResult = await api.clarify(overview.session_id, searchResult.urls)
      
      if (clarifyResult.error) {
        throw new Error(clarifyResult.error)
      }
      
      addMessage(overview.session_id, {
        role: 'assistant',
        content: clarifyResult.clarification,
        type: 'clarification',
      })
      
      updateSession(overview.session_id, { phase: 'clarifying' })
      clearProgress()
      setCurrentStatus('')
      
      return { sessionId: overview.session_id, needsClarification: true }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setCurrentStatus('')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [api, settings, createSession, updateSession, addMessage, setProgress, clearProgress])
  
  const submitClarification = useCallback(async (
    sessionId: string,
    answers: string[]
  ) => {
    setIsLoading(true)
    setError(null)
    setCurrentStatus('Processing your answers...')
    
    try {
      // Add user's answers as a message
      if (answers.length > 0) {
        addMessage(sessionId, {
          role: 'user',
          content: answers.join('\n'),
        })
      }
      
      // Create plan
      setCurrentStatus('Creating research plan...')
      setProgress({
        phase: 'Planning',
        message: 'Creating research plan...',
        completedPoints: 0,
        totalPoints: 0,
        sources: [],
      })
      
      const planResult = await api.createPlan(
        sessionId,
        answers,
        settings.academicMode
      )
      
      if (!planResult.plan_points.length) {
        throw new Error('Failed to create research plan')
      }
      
      addMessage(sessionId, {
        role: 'assistant',
        content: planResult.plan_text,
        type: 'plan',
        data: { planPoints: planResult.plan_points },
      })
      
      updateSession(sessionId, {
        planPoints: planResult.plan_points,
        phase: 'planning',
      })
      
      clearProgress()
      setCurrentStatus('')
      
      return { planPoints: planResult.plan_points }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setCurrentStatus('')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [api, settings, addMessage, updateSession, setProgress, clearProgress])
  
  const startDeepResearch = useCallback(async (
    sessionId: string,
    planPoints: string[]
  ) => {
    setIsLoading(true)
    setError(null)
    setCurrentStatus('Starting deep research...')
    
    updateSession(sessionId, { phase: 'researching' })
    
    try {
      const stream = await api.deepResearch(
        sessionId,
        planPoints,
        settings.defaultProvider,
        settings.workModel,
        settings.finalModel,
        settings.language
      )
      
      if (!stream) {
        throw new Error('Failed to start research stream')
      }
      
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let allSources: string[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const event: ResearchEvent = JSON.parse(line)
            
            // Handle different event types
            if (event.type === 'status') {
              setCurrentStatus(event.message)
              setProgress({
                phase: 'Researching',
                message: event.message,
                completedPoints: Number(event.data?.point_number || 0),
                totalPoints: Number(event.data?.total_points || planPoints.length),
                sources: allSources,
              })
            } else if (event.type === 'sources') {
              const newSources = (event.data?.urls as string[]) || []
              allSources = [...allSources, ...newSources]
              
              // Add sources message
              addMessage(sessionId, {
                role: 'assistant',
                content: `Found ${newSources.length} sources`,
                type: 'sources',
                sources: newSources,
              })
            } else if (event.type === 'point_complete') {
              const sources = (event.data?.sources as string[]) || []
              allSources = [...allSources, ...sources]
              
              setCurrentStatus(`Completed point ${event.data?.point_number}/${event.data?.total_points}`)
              setProgress({
                phase: 'Researching',
                message: event.message,
                completedPoints: Number(event.data?.point_number || 0),
                totalPoints: Number(event.data?.total_points || planPoints.length),
                sources: allSources,
              })
              
              // Add point summary message
              const pointMessage: Message = {
                role: 'assistant',
                content: String(event.data?.key_learnings || event.message),
                type: 'point_summary',
                pointTitle: String(event.data?.point_title || ''),
                pointNumber: Number(event.data?.point_number || 0),
                totalPoints: Number(event.data?.total_points || planPoints.length),
                dossierFull: event.data?.dossier_full as string | undefined,
                skipped: Boolean(event.data?.skipped),
                skipReason: event.data?.skip_reason as string | undefined,
              }
              addMessage(sessionId, pointMessage)
              
            } else if (event.type === 'synthesis_start') {
              setCurrentStatus('Creating final synthesis...')
              setProgress({
                phase: 'Synthesizing',
                message: 'Creating final report...',
                completedPoints: planPoints.length,
                totalPoints: planPoints.length,
                sources: allSources,
              })
              
              // Add synthesis waiting message
              addMessage(sessionId, {
                role: 'assistant',
                content: event.message || 'Compiling final report from all dossiers...',
                type: 'synthesis_waiting',
                estimatedMinutes: Number(event.data?.estimated_minutes || 5),
              })
            } else if (event.type === 'log') {
              // Add log message
              addMessage(sessionId, {
                role: 'assistant',
                content: event.message,
                type: 'log',
                logLevel: (event.data?.level as 'warning' | 'error') || 'warning',
              })
            } else if (event.type === 'done') {
              clearProgress()
              setCurrentStatus('')
              
              const finalDocument = event.data?.final_document as string
              
              addMessage(sessionId, {
                role: 'assistant',
                content: finalDocument || 'Research complete.',
                type: 'report',
                data: event.data,
              })
              
              updateSession(sessionId, {
                finalDocument,
                sourceRegistry: event.data?.source_registry as Record<number, string>,
                totalSources: Number(event.data?.total_sources || 0),
                durationSeconds: Number(event.data?.duration_seconds || 0),
                phase: 'done',
              })
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseError) {
            console.warn('Failed to parse event:', line, parseError)
          }
        }
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setCurrentStatus('')
      updateSession(sessionId, { phase: 'done' })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [api, settings, updateSession, addMessage, setProgress, clearProgress])
  
  const cancelResearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    clearProgress()
    setCurrentStatus('')
    setIsLoading(false)
  }, [clearProgress])
  
  return {
    isLoading,
    error,
    currentStatus,
    startResearch,
    submitClarification,
    startDeepResearch,
    cancelResearch,
  }
}
