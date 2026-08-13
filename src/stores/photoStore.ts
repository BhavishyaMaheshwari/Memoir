import { create } from 'zustand';
import type { Photo, DateGroup } from '../types';

interface PhotoState {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;
  addPhotos: (photos: Photo[]) => void;

  // Selection
  selectedIds: Set<string>;
  selectPhoto: (id: string) => void;
  deselectPhoto: (id: string) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  // Grouping
  dateGroups: DateGroup[];
  setDateGroups: (groups: DateGroup[]) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;

  // Stats
  totalCount: number;
  setTotalCount: (count: number) => void;
}

export const usePhotoStore = create<PhotoState>((set) => ({
  photos: [],
  setPhotos: (photos) => set({ photos }),
  addPhotos: (newPhotos) => set((s) => ({ photos: [...s.photos, ...newPhotos] })),

  selectedIds: new Set(),
  selectPhoto: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    next.add(id);
    return { selectedIds: next };
  }),
  deselectPhoto: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    next.delete(id);
    return { selectedIds: next };
  }),
  toggleSelect: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  }),
  clearSelection: () => set({ selectedIds: new Set() }),

  dateGroups: [],
  setDateGroups: (groups) => set({ dateGroups: groups }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  hasMore: true,
  setHasMore: (hasMore) => set({ hasMore }),

  totalCount: 0,
  setTotalCount: (count) => set({ totalCount: count }),
}));
