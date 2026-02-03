/**
 * Settings Page - User preferences and API keys
 */

import { useState } from 'react'
import { Key, Globe, Bot, GraduationCap, Check } from 'lucide-react'
import { useSettingsStore } from '../stores/settings'
import { useApi } from '../hooks/useApi'

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', description: 'Access multiple models with one API key' },
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
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Settings</h1>
          <p className="text-dark-400 mt-1">Configure your research preferences</p>
        </div>
        
        {/* Saved notification */}
        {saved && (
          <div className="fixed top-6 right-6 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Settings saved</span>
          </div>
        )}
        
        {/* API Keys */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">API Keys</h2>
              <p className="text-sm text-dark-400">Configure your LLM provider API keys</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {PROVIDERS.map((provider) => (
              <div key={provider.id}>
                <label className="block text-sm font-medium text-dark-300 mb-1">
                  {provider.name}
                </label>
                <input
                  type="password"
                  placeholder={`Enter ${provider.name} API key`}
                  value={settings.apiKeys[provider.id as keyof typeof settings.apiKeys] || ''}
                  onChange={(e) => settings.setApiKey(provider.id as keyof typeof settings.apiKeys, e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleApiKeyChange(provider.id as keyof typeof settings.apiKeys, e.target.value)
                    }
                  }}
                  className="input"
                />
                <p className="text-xs text-dark-500 mt-1">{provider.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Model Selection */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Model Preferences</h2>
              <p className="text-sm text-dark-400">Choose your default models</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Default Provider
              </label>
              <select
                value={settings.defaultProvider}
                onChange={(e) => {
                  settings.setDefaultProvider(e.target.value)
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
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Work Model
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
              <p className="text-xs text-dark-500 mt-1">
                Used for search, analysis, and dossier creation
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Final Model
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
              <p className="text-xs text-dark-500 mt-1">
                Used for final synthesis and report generation
              </p>
            </div>
          </div>
        </section>
        
        {/* Language & Mode */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Research Preferences</h2>
              <p className="text-sm text-dark-400">Customize research behavior</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Output Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => {
                  settings.setLanguage(e.target.value)
                  showSaved()
                }}
                className="input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm font-medium text-dark-200">Academic Mode</p>
                  <p className="text-xs text-dark-500">
                    Generates formal academic-style reports with citations
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  settings.setAcademicMode(!settings.academicMode)
                  showSaved()
                }}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.academicMode ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.academicMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
