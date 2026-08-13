import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images, Plus, ArrowUpRight, Loader2 } from 'lucide-react';
import { Lightbox } from './Lightbox';
import { photosApi } from '../../services/api';
import type { Photo } from '../../types';
import { useAppStore } from '../../stores/appStore';

// Demo photos for when backend has no data yet
function generateDemoPhotos(count: number) {
  const categories = [
    'nature', 'architecture', 'portrait', 'city', 'landscape',
    'abstract', 'travel', 'food', 'ocean', 'forest',
  ];
  const dateClusters = [
    { date: 'December 25, 2024', count: 12 },
    { date: 'December 14, 2024', count: 8 },
    { date: 'November 28, 2024', count: 10 },
    { date: 'November 10, 2024', count: 6 },
    { date: 'October 22, 2024', count: 9 },
    { date: 'October 5, 2024', count: 7 },
    { date: 'September 18, 2024', count: 8 },
  ];

  const photos: DemoPhoto[] = [];
  let idx = 0;

  for (const cluster of dateClusters) {
    for (let j = 0; j < cluster.count && idx < count; j++, idx++) {
      const category = categories[idx % categories.length];
      const w = 300 + ((idx * 7 + 13) % 200);
      const aspects = [[4, 3], [3, 4], [16, 9], [1, 1], [3, 2], [5, 4]];
      const [aw, ah] = aspects[idx % aspects.length];
      const h = Math.round(w * ah / aw);

      photos.push({
        id: `demo-${idx}`,
        src: `https://picsum.photos/seed/memoir${idx}/${w}/${h}`,
        width: w,
        height: h,
        category,
        date: cluster.date,
      });
    }
  }
  return photos;
}

interface DemoPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  category: string;
  date: string;
}

function groupByDate(photos: DemoPhoto[]) {
  const groups: { date: string; photos: DemoPhoto[] }[] = [];
  const map = new Map<string, DemoPhoto[]>();
  for (const photo of photos) {
    const existing = map.get(photo.date);
    if (existing) {
      existing.push(photo);
    } else {
      const arr = [photo];
      map.set(photo.date, arr);
      groups.push({ date: photo.date, photos: arr });
    }
  }
  return groups;
}

// Convert backend photos to display format
function backendToDisplay(photos: Photo[]): DemoPhoto[] {
  return photos.map((p) => ({
    id: p.id,
    src: photosApi.thumbnail(p.id),
    width: p.width || 400,
    height: p.height || 300,
    category: p.camera_model || '',
    date: p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })
      : 'Unknown Date',
  }));
}

export function GalleryView() {
  const [photos, setPhotos] = useState<DemoPhoto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lightbox state from global store
  const { lightboxPhoto, openLightbox: setLightboxPhoto, closeLightbox } = useAppStore();

  // Flatten all photos for lightbox navigation
  const allPhotos = photos;

  // Try to load from backend; fall back to demo
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      try {
        const res = await photosApi.list(0, 500);
        if (!cancelled && res.photos.length > 0) {
          setPhotos(backendToDisplay(res.photos));
          setTotalCount(res.total);
          setIsLive(true);
        } else if (!cancelled) {
          // No photos in backend — use demo data
          const demo = generateDemoPhotos(60);
          setPhotos(demo);
          setTotalCount(demo.length);
          setIsLive(false);
        }
      } catch {
        // Backend unavailable — use demo
        if (!cancelled) {
          const demo = generateDemoPhotos(60);
          setPhotos(demo);
          setTotalCount(demo.length);
          setIsLive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPhotos();
    return () => { cancelled = true; };
  }, []);

  const groups = groupByDate(photos);

  const openLightbox = useCallback((photo: DemoPhoto) => {
    setLightboxPhoto(photo.id);
  }, [setLightboxPhoto]);

  // Find the current photo index based on the global state
  const lightboxIndex = lightboxPhoto ? allPhotos.findIndex(p => p.id === lightboxPhoto) : -1;
  const currentLightboxPhoto = lightboxIndex !== -1 ? allPhotos[lightboxIndex] : null;

  return (
    <div className="min-h-full">
      {/* Minimal Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 bg-surface-base/80 backdrop-blur-xl z-20 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
              Photos
            </h1>
            <p className="text-xs text-text-tertiary mt-1">
              {loading ? 'Loading…' : `${totalCount} items`}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="text-accent animate-spin" />
        </div>
      )}

      {/* Photo grid grouped by date */}
      {!loading && (
        <div className="px-1 pb-12 space-y-6 mt-2">
          {groups.map((group, gi) => (
            <section key={group.date}>
              <div className="mb-2 sticky top-[92px] bg-surface-base/90 backdrop-blur-md z-10 py-2 px-3 border-t border-border-subtle">
                <h2 className="text-sm font-medium text-text-primary tracking-wide">
                  {group.date}
                </h2>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-[2px] px-[2px]">
                {group.photos.map((photo, pi) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={pi}
                    onClick={() => openLightbox(photo)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {currentLightboxPhoto && lightboxIndex !== -1 && (
          <Lightbox
            src={isLive ? photosApi.fullsize(currentLightboxPhoto.id) : currentLightboxPhoto.src}
            alt={currentLightboxPhoto.category}
            category={currentLightboxPhoto.category}
            date={currentLightboxPhoto.date}
            onClose={closeLightbox}
            onPrev={() => setLightboxPhoto(lightboxIndex > 0 ? allPhotos[lightboxIndex - 1].id : lightboxPhoto)}
            onNext={() => setLightboxPhoto(lightboxIndex < allPhotos.length - 1 ? allPhotos[lightboxIndex + 1].id : lightboxPhoto)}
            hasPrev={lightboxIndex > 0}
            hasNext={lightboxIndex < allPhotos.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  onClick,
}: {
  photo: DemoPhoto;
  index: number;
  onClick: () => void;
}) {
  return (
    <div
      className="photo-thumbnail relative cursor-pointer group bg-surface-overlay aspect-square"
      onClick={onClick}
    >
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
