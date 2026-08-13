import { motion, AnimatePresence } from 'framer-motion';
import {
  Images,
  Clock,
  Users,
  Map,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import type { ViewMode } from '../../types';

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'gallery', label: 'Library', icon: Images },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'people', label: 'People', icon: Users },
  { id: 'trips', label: 'Trips', icon: Map },
];

const bottomItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar, openCommandPalette } = useAppStore();

  return (
    <motion.aside
      className="h-full bg-surface-raised border-r border-border-subtle flex flex-col shrink-0 relative select-none overflow-hidden"
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Search trigger */}
      <div className="px-3 pt-4 pb-2">
        <button
          id="sidebar-search-trigger"
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-overlay/60 border border-border-subtle text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-all duration-200 cursor-pointer group"
        >
          <Search size={15} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                className="text-xs tracking-wide flex-1 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Search memories…
              </motion.span>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <kbd className="text-[10px] text-text-tertiary/60 bg-surface-base/50 px-1.5 py-0.5 rounded font-mono group-hover:text-text-tertiary transition-colors">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {!sidebarCollapsed && (
          <motion.p
            className="px-3 pt-2 pb-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-text-tertiary/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Browse
          </motion.p>
        )}

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? 'text-text-primary bg-surface-active'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-accent-subtle border border-accent/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={18} className="shrink-0 relative z-10" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    className="relative z-10"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* AI Status indicator */}
      {!sidebarCollapsed && (
        <motion.div
          className="mx-3 mb-2 px-3 py-2.5 rounded-lg bg-accent-subtle/40 border border-accent/8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-accent" />
            <span className="text-[11px] font-medium text-text-secondary">All local · No cloud</span>
          </div>
        </motion.div>
      )}

      {/* Bottom navigation */}
      <div className="px-2 pb-3 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-text-primary bg-surface-active'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        id="sidebar-collapse-toggle"
        onClick={toggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-surface-overlay border border-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-all duration-200 opacity-0 hover:opacity-100 cursor-pointer z-20"
        style={{ opacity: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
