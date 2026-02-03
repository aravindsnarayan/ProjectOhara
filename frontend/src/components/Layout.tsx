/**
 * Layout Component - Main app layout with sidebar
 */

import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Search, 
  History, 
  Settings, 
  LogOut, 
  Plus,
  BookOpen 
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
    { path: '/sessions', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-dark-50">Ohara</h1>
              <p className="text-xs text-dark-400">Deep Research</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          
          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-dark-700">
              <p className="px-4 text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
                Recent
              </p>
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className={`sidebar-item text-sm ${
                    activeSessionId === session.id ? 'active' : ''
                  }`}
                >
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{session.title}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>
        
        {/* User */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-dark-400 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 bg-dark-950 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
