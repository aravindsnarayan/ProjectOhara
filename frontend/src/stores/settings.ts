/**
 * Settings Store - User preferences and API keys
 * Scholar's Sanctum edition
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n/translations'

// Re-export Language for convenient imports
export type { Language }

// Provider configuration matching the original Lutum project
export type Provider = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'huggingface';

export const PROVIDER_CONFIG: Record<Provider, { 
  name: string; 
  baseUrl: string; 
  placeholder: string;
  description: string;
}> = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    placeholder: 'sk-or-v1-...',
    description: 'Access to 100+ models via single API'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    placeholder: 'sk-...',
    description: 'GPT-4 and other OpenAI models'
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    placeholder: 'sk-ant-...',
    description: 'Claude models'
  },
  google: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    placeholder: 'AIza...',
    description: 'Gemini Pro and Flash models'
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/v1/chat/completions',
    placeholder: 'hf_...',
    description: 'Open-source models'
  },
};

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
  defaultProvider: Provider
  workModel: string
  finalModel: string
  
  // UI Preferences
  language: Language
  theme: 'dark' | 'light'
  
  // Research Preferences
  academicMode: boolean
  
  // Actions
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  setDefaultProvider: (provider: Provider) => void
  setWorkModel: (model: string) => void
  setFinalModel: (model: string) => void
  setLanguage: (lang: Language) => void
  setTheme: (theme: 'dark' | 'light') => void
  setAcademicMode: (enabled: boolean) => void
  
  // Getters
  getActiveApiKey: () => string | undefined
  getProviderConfig: () => typeof PROVIDER_CONFIG[Provider]
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
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
      
      setDefaultProvider: (provider: Provider) =>
        set({ defaultProvider: provider }),
      
      setWorkModel: (model: string) =>
        set({ workModel: model }),
      
      setFinalModel: (model: string) =>
        set({ finalModel: model }),
      
      setLanguage: (lang: Language) =>
        set({ language: lang }),
      
      setTheme: (theme: 'dark' | 'light') =>
        set({ theme: theme }),
      
      setAcademicMode: (enabled: boolean) =>
        set({ academicMode: enabled }),
      
      getActiveApiKey: () => {
        const state = get()
        return state.apiKeys[state.defaultProvider]
      },
      
      getProviderConfig: () => {
        const state = get()
        return PROVIDER_CONFIG[state.defaultProvider]
      },
    }),
    {
      name: 'ohara-settings',
    }
  )
)
