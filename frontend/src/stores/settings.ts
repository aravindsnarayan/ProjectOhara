/**
 * Settings Store - User preferences and API keys
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiKeys {
  openrouter?: string
  openai?: string
  anthropic?: string
  google?: string
  huggingface?: string
}

interface SettingsState {
  // API Configuration
  apiKeys: ApiKeys
  defaultProvider: string
  workModel: string
  finalModel: string
  
  // UI Preferences
  language: string
  theme: 'dark' | 'light'
  
  // Research Preferences
  academicMode: boolean
  
  // Actions
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  setDefaultProvider: (provider: string) => void
  setWorkModel: (model: string) => void
  setFinalModel: (model: string) => void
  setLanguage: (lang: string) => void
  setAcademicMode: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {},
      defaultProvider: 'openrouter',
      workModel: 'google/gemini-2.5-flash-lite-preview-09-2025',
      finalModel: 'anthropic/claude-sonnet-4.5',
      language: 'en',
      theme: 'dark',
      academicMode: false,
      
      setApiKey: (provider: keyof ApiKeys, key: string) =>
        set((state: SettingsState) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),
      
      setDefaultProvider: (provider: string) =>
        set({ defaultProvider: provider }),
      
      setWorkModel: (model: string) =>
        set({ workModel: model }),
      
      setFinalModel: (model: string) =>
        set({ finalModel: model }),
      
      setLanguage: (lang: string) =>
        set({ language: lang }),
      
      setAcademicMode: (enabled: boolean) =>
        set({ academicMode: enabled }),
    }),
    {
      name: 'ohara-settings',
    }
  )
)
