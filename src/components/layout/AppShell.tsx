import { motion, AnimatePresence } from 'framer-motion';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../../stores/appStore';
import { GalleryView } from '../gallery/GalleryView';
import { TimelineView } from '../timeline/TimelineView';
import { PeopleView } from '../people/PeopleView';
import { TripsView } from '../trips/TripsView';
import { SettingsView } from '../settings/SettingsView';
import { CommandPalette } from '../search/CommandPalette';

const viewComponents = {
  gallery: GalleryView,
  timeline: TimelineView,
  people: PeopleView,
  trips: TripsView,
  search: GalleryView, // Search results render in gallery layout
  settings: SettingsView,
};

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

export function AppShell() {
  const { currentView, commandPaletteOpen } = useAppStore();
  const ViewComponent = viewComponents[currentView] || GalleryView;

  return (
    <div className="flex flex-col w-full h-screen bg-surface-base overflow-hidden">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden"
              {...pageTransition}
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette overlay */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette />}
      </AnimatePresence>
    </div>
  );
}
