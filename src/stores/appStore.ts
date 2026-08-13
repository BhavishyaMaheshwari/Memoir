import { create } from 'zustand';
import type { ViewMode, GallerySize } from '../types';

interface AppState {
  // Navigation
  currentView: ViewMode;
  setView: (view: ViewMode) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Gallery
  gallerySize: GallerySize;
  setGallerySize: (size: GallerySize) => void;

  // Command palette
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Lightbox
  lightboxPhoto: string | null;
  openLightbox: (photoId: string) => void;
  closeLightbox: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'gallery',
  setView: (view) => set({ currentView: view }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  gallerySize: 'medium',
  setGallerySize: (size) => set({ gallerySize: size }),

  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  lightboxPhoto: null,
  openLightbox: (photoId) => set({ lightboxPhoto: photoId }),
  closeLightbox: () => set({ lightboxPhoto: null }),
}));
