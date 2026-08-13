import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useAppStore } from './stores/appStore';

export default function App() {
  const { toggleCommandPalette } = useAppStore();

  // Global keyboard shortcut: ⌘K for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return <AppShell />;
}
