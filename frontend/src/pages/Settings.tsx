/**
 * Settings Page - User preferences and API keys
 * Scholar's Sanctum aesthetic
 */

import { useState } from 'react'
import { Key, Globe, Bot, GraduationCap, Check, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react'
import { useSettingsStore, Provider, Language } from '../stores/settings'
import { useApi } from '../hooks/useApi'

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', description: 'Access diverse models with a unified key' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 and GPT-3.5 models' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models' },
  { id: 'google', name: 'Google', description: 'Gemini models' },
  { id: 'huggingface', name: 'HuggingFace', description: 'Open source models' },
]

const WORK_MODELS = [
  { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.0 Flash (Fast)' },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.0 Flash (Standard)' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku' },
]

const FINAL_MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Recommended)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
]

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'de', name: 'German' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'it', name: 'Italian' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ko', name: 'Korean' },
  { id: 'zh', name: 'Chinese' },
]

export default function SettingsPage() {
  const settings = useSettingsStore()
  const api = useApi()
  const [saved, setSaved] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  
  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const handleApiKeyChange = async (provider: keyof typeof settings.apiKeys, value: string) => {
    settings.setApiKey(provider, value)
    // Sync to backend
    try {
      await api.updateApiKeys({ [provider]: value })
      showSaved()
    } catch (err) {
      console.error('Failed to save API key to backend:', err)
      showSaved() // Still show saved locally
    }
  }
  
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <SettingsIcon className="w-8 h-8 text-accent-500" strokeWidth={1.5} />
            <h1 className="font-display text-3xl font-semibold text-parchment-100">
              Settings
            </h1>
          </div>
          <p className="text-body text-parchment-500 ml-12">
            Configure your research preferences and API credentials
          </p>
        </div>
        
        {/* Saved notification */}
        {saved && (
          <div className="fixed top-6 right-6 bg-green-500/10 border border-green-500/30 
                          rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-up
                          shadow-elevated z-50">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm text-green-400 font-sans">Settings preserved</span>
          </div>
        )}
        
        {/* API Keys */}
        <section className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center
                            border border-accent-500/20">
              <Key className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-parchment-100">API Credentials</h2>
              <p className="text-sm text-parchment-500 font-sans">Configure your LLM provider access</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {PROVIDERS.map((provider) => (
              <div key={provider.id}>
                <label className="text-label mb-2 block">
                  {provider.name}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey === provider.id ? 'text' : 'password'}
                    placeholder={`Enter ${provider.name} API key`}
                    value={settings.apiKeys[provider.id as keyof typeof settings.apiKeys] || ''}
                    onChange={(e) => settings.setApiKey(provider.id as keyof typeof settings.apiKeys, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleApiKeyChange(provider.id as keyof typeof settings.apiKeys, e.target.value)
                      }
                    }}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(showApiKey === provider.id ? null : provider.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 
                               text-parchment-500 hover:text-parchment-300 transition-colors"
                  >
                    {showApiKey === provider.id ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-parchment-600 mt-1.5 font-sans">{provider.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Model Selection */}
        <section className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center
                            border border-accent-500/20">
              <Bot className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-parchment-100">Model Preferences</h2>
              <p className="text-sm text-parchment-500 font-sans">Select your preferred AI models</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-label mb-2 block">
                Default Provider
              </label>
              <select
                value={settings.defaultProvider}
                onChange={(e) => {
                  settings.setDefaultProvider(e.target.value as Provider)
                  showSaved()
                }}
                className="input"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-label mb-2 block">
                Research Model
              </label>
              <select
                value={settings.workModel}
                onChange={(e) => {
                  settings.setWorkModel(e.target.value)
                  showSaved()
                }}
                className="input"
              >
                {WORK_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <p className="text-xs text-parchment-600 mt-1.5 font-sans">
                Used for search, analysis, and dossier compilation
              </p>
            </div>
            
            <div>
              <label className="text-label mb-2 block">
                Synthesis Model
              </label>
              <select
                value={settings.finalModel}
                onChange={(e) => {
                  settings.setFinalModel(e.target.value)
                  showSaved()
                }}
                className="input"
              >
                {FINAL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <p className="text-xs text-parchment-600 mt-1.5 font-sans">
                Used for final synthesis and report generation
              </p>
            </div>
          </div>
        </section>
        
        {/* Language & Mode */}
        <section className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center
                            border border-accent-500/20">
              <Globe className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-parchment-100">Research Preferences</h2>
              <p className="text-sm text-parchment-500 font-sans">Customize research behavior</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-label mb-2 block">
                Output Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => {
                  settings.setLanguage(e.target.value as Language)
                  showSaved()
                }}
                className="input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            {/* Academic Mode Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-ink-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-burgundy-500/10 rounded-lg flex items-center justify-center
                                border border-burgundy-500/20">
                  <GraduationCap className="w-5 h-5 text-burgundy-400" />
                </div>
                <div>
                  <p className="font-sans font-medium text-parchment-200">Academic Mode</p>
                  <p className="text-xs text-parchment-600 font-sans">
                    Generate formal reports with proper citations
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  settings.setAcademicMode(!settings.academicMode)
                  showSaved()
                }}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  settings.academicMode 
                    ? 'bg-accent-600 shadow-glow-amber' 
                    : 'bg-ink-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-parchment-100 rounded-full 
                              shadow-md transition-transform duration-300 ${
                    settings.academicMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
        
        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  )
}
