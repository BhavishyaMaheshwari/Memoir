import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt?: string;
  category?: string;
  date?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function Lightbox({
  src,
  alt = '',
  category,
  date,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: LightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev && onPrev) onPrev();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
      }
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/95"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Top bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3">
          {date && (
            <span className="text-sm text-white/50 font-medium">{date}</span>
          )}
          {category && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-sm text-white/40 capitalize">{category}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            title="Photo info"
          >
            <Info size={16} />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            title="Download"
          >
            <Download size={16} />
          </button>
          <button
            id="lightbox-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer ml-2"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>

      {/* Navigation arrows */}
      {hasPrev && onPrev && (
        <button
          id="lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {hasNext && onNext && (
        <button
          id="lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Image */}
      <motion.div
        className="relative z-[1] max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        key={src}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}
