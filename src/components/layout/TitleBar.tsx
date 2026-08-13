import { motion } from 'framer-motion';

export function TitleBar() {
  return (
    <motion.header
      className="drag-region h-12 flex items-center px-5 border-b border-border-subtle bg-surface-base/80 backdrop-blur-xl shrink-0 z-50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* macOS traffic light spacing */}
      <div className="w-[72px] shrink-0" />

      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-xs font-medium tracking-[0.2em] uppercase text-text-tertiary select-none">
          Memoir
        </h1>
      </div>

      <div className="w-[72px] shrink-0" />
    </motion.header>
  );
}
