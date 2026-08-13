import { motion } from 'framer-motion';
import { Map, Calendar, MapPin } from 'lucide-react';

const DEMO_TRIPS = [
  { id: '1', title: 'Untitled Trip', location: 'Mountain Region', dates: 'Dec 20 – Dec 27, 2024', count: 234 },
  { id: '2', title: 'Untitled Trip', location: 'Coastal Area', dates: 'Nov 5 – Nov 12, 2024', count: 187 },
  { id: '3', title: 'Untitled Trip', location: 'City Center', dates: 'Oct 14 – Oct 18, 2024', count: 96 },
];

export function TripsView() {
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
            <Map size={16} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Trips
          </h1>
        </div>
        <p className="text-sm text-text-tertiary ml-11">
          Auto-grouped by location and time
        </p>
      </motion.div>

      <div className="px-8 pb-12 space-y-4">
        {DEMO_TRIPS.map((trip, i) => (
          <motion.button
            key={trip.id}
            className="w-full rounded-2xl overflow-hidden bg-surface-raised border border-border-subtle hover:border-border-default transition-all duration-300 cursor-pointer group text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ scale: 1.005 }}
          >
            {/* Cover image strip */}
            <div className="h-32 relative overflow-hidden">
              <div className="absolute inset-0 flex">
                {[0, 1, 2, 3].map((j) => (
                  <img
                    key={j}
                    src={`https://picsum.photos/seed/trip${i}${j}/400/200`}
                    alt=""
                    className="h-full flex-1 object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-transparent" />
            </div>

            <div className="p-5 -mt-4 relative">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                {trip.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {trip.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {trip.dates}
                </span>
                <span className="ml-auto text-text-tertiary/50">
                  {trip.count} photos
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
