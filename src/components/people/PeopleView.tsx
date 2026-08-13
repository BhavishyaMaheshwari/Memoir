import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const DEMO_PEOPLE = [
  { id: '1', name: 'Unnamed Person', count: 142 },
  { id: '2', name: 'Unnamed Person', count: 98 },
  { id: '3', name: 'Unnamed Person', count: 76 },
  { id: '4', name: 'Unnamed Person', count: 54 },
  { id: '5', name: 'Unnamed Person', count: 43 },
  { id: '6', name: 'Unnamed Person', count: 31 },
];

export function PeopleView() {
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
            <Users size={16} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            People
          </h1>
        </div>
        <p className="text-sm text-text-tertiary ml-11">
          Faces detected and grouped automatically
        </p>
      </motion.div>

      <div className="px-8 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {DEMO_PEOPLE.map((person, i) => (
            <motion.button
              key={person.id}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-surface-hover transition-all duration-200 cursor-pointer group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border-subtle group-hover:ring-accent/30 transition-all duration-300">
                <img
                  src={`https://picsum.photos/seed/face${i}/160/160`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  {person.name}
                </p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {person.count} photos
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
