import { create } from 'zustand';
import type { SearchResult } from '../types';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;

  results: SearchResult[];
  setResults: (results: SearchResult[]) => void;

  isSearching: boolean;
  setSearching: (searching: boolean) => void;

  recentQueries: string[];
  addRecentQuery: (query: string) => void;

  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),

  results: [],
  setResults: (results) => set({ results }),

  isSearching: false,
  setSearching: (searching) => set({ isSearching: searching }),

  recentQueries: [],
  addRecentQuery: (query) => set((s) => ({
    recentQueries: [query, ...s.recentQueries.filter(q => q !== query)].slice(0, 10),
  })),

  clear: () => set({ query: '', results: [], isSearching: false }),
}));
