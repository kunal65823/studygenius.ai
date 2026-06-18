import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Zap, Layers, Brain, MessageSquare,
  BarChart3, Target, Bookmark, Search, User, Moon, Sun,
  LogOut, Menu, X, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuthStore }  from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/notes',      label: 'My Notes',    icon: FileText },
  { to: '/flashcards', label: 'Flashcards',  icon: Layers },
  { to: '/mcq',        label: 'MCQs & Quiz', icon: Brain },
  { to: '/chat',       label: 'AI Chat',     icon: MessageSquare },
  { to: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { to: '/goals',      label: 'Goals',       icon: Target },
  { to: '/bookmarks',  label: 'Bookmarks',   icon: Bookmark },
  { to: '/search',     label: 'Search',      icon: Search },
];

function NavItem({ to, label, Icon, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative
         ${isActive
           ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
           : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white'}`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {label}
        </div>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut }  = useAuthStore();
  const { dark, toggle }   = useThemeStore();
  const navigate           = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-surface-card-dark border-r border-gray-100
                  dark:border-white/10 transition-all duration-300
                  ${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">StudyGenius</span>
            <span className="block text-[10px] text-brand-500 font-semibold tracking-wider">AI</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon}
                   collapsed={collapsed && !mobile}
                   onClick={() => mobile && setMobileOpen(false)} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-white/10 space-y-1">
        {/* Theme toggle */}
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500
                     dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-all text-sm font-medium">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {(!collapsed || mobile) && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Profile */}
        <NavLink to="/profile"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500
                     dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-all text-sm font-medium">
          <User size={18} />
          {(!collapsed || mobile) && <span>Profile</span>}
        </NavLink>

        {/* Sign out */}
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50
                     dark:hover:bg-red-950/30 transition-all text-sm font-medium">
          <LogOut size={18} />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle (desktop) */}
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                       text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-all">
            <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-dark">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-100
                           dark:border-white/10 bg-white dark:bg-surface-card-dark shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <NavLink to="/search" className="btn-ghost p-2">
              <Search size={18} />
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
