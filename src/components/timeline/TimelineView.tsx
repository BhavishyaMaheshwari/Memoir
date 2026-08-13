import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';

const MONTHS = [
  { label: 'December 2024', count: 156 },
  { label: 'November 2024', count: 243 },
  { label: 'October 2024', count: 189 },
  { label: 'September 2024', count: 312 },
  { label: 'August 2024', count: 267 },
  { label: 'July 2024', count: 198 },
];

export function TimelineView() {
  return (
    <div className="min-h-full">
      <motion.div
        className="px-8 pt-8 pb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
            <Clock size={16} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Timeline
          </h1>
        </div>
        <p className="text-sm text-text-tertiary ml-11">
          Browse your memories chronologically
        </p>
      </motion.div>

      <div className="px-8 pb-12 space-y-3">
        {MONTHS.map((month, i) => (
          <motion.button
            key={month.label}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-border-default transition-all duration-200 cursor-pointer group text-left"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ x: 4 }}
          >
            {/* Month preview thumbnails */}
            <div className="flex -space-x-2">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="w-12 h-12 rounded-lg overflow-hidden border-2 border-surface-raised"
                >
                  <img
                    src={`https://picsum.photos/seed/timeline${i}${j}/96/96`}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary">{month.label}</h3>
              <p className="text-xs text-text-tertiary mt-0.5">{month.count} photos</p>
            </div>

            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
