import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Image, Sparkles, X, Loader2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { searchApi } from '../../services/api';

const suggestions = [
  { icon: Sparkles, label: 'Photos of sunset at the beach', type: 'semantic' },
  { icon: Image, label: 'Screenshots with code', type: 'ocr' },
  { icon: Sparkles, label: 'Family dinner last Christmas', type: 'semantic' },
  { icon: Image, label: 'Mountain landscapes', type: 'semantic' },
  { icon: Sparkles, label: 'Concert photos with crowd', type: 'semantic' },
];

export function CommandPalette() {
  const { closeCommandPalette, setView, openLightbox } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await searchApi.semantic(query.trim());
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleResultClick = (photoId: string) => {
    closeCommandPalette();
    setView('gallery');
    // small timeout to ensure gallery is mounted before opening lightbox
    setTimeout(() => {
      openLightbox(photoId);
    }, 50);
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeCommandPalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const max = hasSearched ? searchResults.length - 1 : suggestions.length - 1;
        setSelectedIndex((i) => Math.min(i + 1, max));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!hasSearched && !query) {
          // Select a suggestion
          const suggestion = suggestions[selectedIndex];
          if (suggestion) {
            setQuery(suggestion.label);
          }
        } else if (hasSearched && searchResults.length > 0 && searchResults[selectedIndex]) {
           handleResultClick(searchResults[selectedIndex].photo.id);
        } else {
          handleSearch();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCommandPalette, handleSearch, hasSearched, query, selectedIndex, searchResults]);

  const filteredSuggestions = query && !hasSearched
    ? suggestions.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : !hasSearched
    ? suggestions
    : [];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closeCommandPalette}
      />

      {/* Palette */}
      <motion.div
        className="fixed top-[20%] left-1/2 w-full max-w-[580px] z-[301]"
        initial={{ opacity: 0, y: -16, x: '-50%', scale: 0.96 }}
        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
        exit={{ opacity: 0, y: -16, x: '-50%', scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="glass-heavy rounded-2xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
            {isSearching ? (
              <Loader2 size={18} className="text-accent animate-spin shrink-0" />
            ) : (
              <Search size={18} className="text-text-tertiary shrink-0" />
            )}
            <input
              ref={inputRef}
              id="command-palette-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
                setHasSearched(false);
                setSearchResults([]);
              }}
              placeholder="Search your memories…"
              className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-tertiary/60 outline-none font-medium"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setHasSearched(false);
                  setSearchResults([]);
                }}
                className="text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="text-[10px] text-text-tertiary/50 bg-surface-base/50 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* Suggestions (before search) */}
          {!hasSearched && (
            <div className="py-2 max-h-[320px] overflow-y-auto">
              {!query && (
                <p className="px-5 py-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-text-tertiary/50">
                  Try searching for
                </p>
              )}

              {filteredSuggestions.map((suggestion, i) => {
                const Icon = suggestion.icon;
                const isSelected = i === selectedIndex;

                return (
                  <button
                    key={i}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100 cursor-pointer ${
                      isSelected
                        ? 'bg-accent-subtle/60 text-text-primary'
                        : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => {
                      setQuery(suggestion.label);
                      inputRef.current?.focus();
                    }}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-accent/15' : 'bg-surface-overlay'
                    }`}>
                      <Icon size={14} className={isSelected ? 'text-accent' : 'text-text-tertiary'} />
                    </div>
                    <span className="text-sm font-medium">{suggestion.label}</span>
                    <span className="ml-auto text-[10px] text-text-tertiary/50 uppercase tracking-wider">
                      {suggestion.type}
                    </span>
                  </button>
                );
              })}

              {query && filteredSuggestions.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Sparkles size={20} className="text-accent/40 mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">
                    Press <kbd className="text-[10px] bg-surface-overlay px-1.5 py-0.5 rounded font-mono">Enter</kbd> to search with AI
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search results */}
          {hasSearched && (
            <div className="py-2 max-h-[400px] overflow-y-auto">
              {isSearching ? (
                <div className="px-5 py-8 text-center">
                  <Loader2 size={20} className="text-accent animate-spin mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">Searching with SigLIP…</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <p className="px-5 py-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-text-tertiary/50">
                    {searchResults.length} results
                  </p>
                  {searchResults.slice(0, 12).map((result, i) => (
                    <button
                      key={i}
                      className={`w-full flex items-center gap-3 px-5 py-2 text-left transition-colors duration-100 cursor-pointer ${
                        i === selectedIndex
                          ? 'bg-accent-subtle/60 text-text-primary'
                          : 'text-text-secondary hover:bg-surface-hover'
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => handleResultClick(result.photo.id)}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-overlay shrink-0">
                        <img
                          src={`/api/photos/${result.photo.id}/thumbnail`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.photo.file_name}</p>
                        <p className="text-[10px] text-text-tertiary">
                          Score: {(result.score * 100).toFixed(1)}%
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Search size={20} className="text-text-tertiary/30 mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">No results found</p>
                  <p className="text-xs text-text-tertiary/50 mt-1">
                    Try indexing photos first via Settings
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-border-subtle flex items-center gap-4 text-[10px] text-text-tertiary/40">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Instant semantic search
            </span>
            <span>·</span>
            <span>Powered by SigLIP — 100% local</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
