/**
 * Layout Component - Main app layout with sidebar
 * Scholar's Sanctum aesthetic
 */

import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Search, 
  History, 
  Settings, 
  LogOut, 
  Plus,
  Library,
  ChevronRight 
} from 'lucide-react'
import { useAuthStore } from '../stores/auth'
import { useSessionsStore } from '../stores/sessions'

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const sessions = useSessionsStore((s) => s.sessions)
  const activeSessionId = useSessionsStore((s) => s.activeSessionId)
  
  const recentSessions = sessions.slice(0, 5)
  
  const navItems = [
    { path: '/', icon: Plus, label: 'New Research' },
    { path: '/sessions', icon: History, label: 'Archives' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]
  
  return (
    <div className="flex h-screen bg-ink-975">
      {/* Sidebar */}
      <aside className="w-72 bg-ink-950 border-r border-ink-800/60 flex flex-col relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-500/[0.02] via-transparent to-transparent pointer-events-none" />
        
        {/* Logo */}
        <div className="relative p-6 border-b border-ink-800/60">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl 
                            flex items-center justify-center shadow-glow-amber
                            group-hover:shadow-lg group-hover:shadow-accent-500/20 transition-all duration-300">
              <Library className="w-6 h-6 text-ink-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-parchment-100 tracking-tight">
                Ohara
              </h1>
              <p className="font-sans text-xs text-parchment-500 mt-0.5 tracking-wide">
                Deep Research Engine
              </p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="relative flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item group ${isActive ? 'active' : ''}`}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-accent-400' : 'text-parchment-500 group-hover:text-parchment-300'
                }`} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-accent-500/60" />
                )}
              </Link>
            )
          })}
          
          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-ink-800/60">
              <p className="text-label px-4 mb-3 flex items-center gap-2">
                <span className="ornament text-sm">❧</span>
                Recent
              </p>
              <div className="space-y-0.5">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    to={`/session/${session.id}`}
                    className={`sidebar-item text-sm py-2.5 group ${
                      activeSessionId === session.id ? 'active' : ''
                    }`}
                  >
                    <Search className={`w-4 h-4 flex-shrink-0 ${
                      activeSessionId === session.id 
                        ? 'text-accent-400' 
                        : 'text-parchment-600 group-hover:text-parchment-400'
                    }`} />
                    <span className="truncate">{session.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
        
        {/* User */}
        <div className="relative p-4 border-t border-ink-800/60 bg-ink-950/80">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-xl border-2 border-ink-700"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500/20 to-accent-600/20 
                              rounded-xl flex items-center justify-center border border-accent-500/30">
                <span className="font-display text-lg font-medium text-accent-400">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-medium text-parchment-200 truncate">
                {user?.name}
              </p>
              <p className="font-sans text-xs text-parchment-500 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2.5 text-parchment-500 hover:text-burgundy-400 
                         hover:bg-burgundy-500/10 rounded-lg transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 bg-ink-975 overflow-hidden relative">
        {/* Subtle vignette effect */}
        <div className="absolute inset-0 pointer-events-none 
                        bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(18,17,16,0.4)_100%)]" />
        <div className="relative h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
