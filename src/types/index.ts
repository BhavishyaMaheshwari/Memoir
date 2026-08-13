// ═══════════════════════════════════════════════════════
// Memoir — Core Type Definitions
// ═══════════════════════════════════════════════════════

export interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  mime_type: string;
  width: number;
  height: number;
  created_at: string;
  modified_at: string;
  indexed_at: string;
  thumbnail_path: string;
  // EXIF
  camera_make?: string;
  camera_model?: string;
  focal_length?: number;
  aperture?: number;
  iso?: number;
  exposure_time?: string;
  gps_lat?: number;
  gps_lng?: number;
  // AI
  ocr_text?: string;
  is_screenshot: boolean;
  embedding_status: 'pending' | 'done' | 'failed';
  face_status: 'pending' | 'done' | 'failed';
  ocr_status: 'pending' | 'done' | 'failed';
}

export interface Face {
  id: string;
  photo_id: string;
  person_id?: string;
  bbox: { x: number; y: number; w: number; h: number };
  confidence: number;
  thumbnail?: string;
}

export interface Person {
  id: string;
  name?: string;
  photo_count: number;
  cover_face?: string;
  created_at: string;
}

export interface Trip {
  id: string;
  title?: string;
  start_date: string;
  end_date: string;
  location?: string;
  photo_count: number;
}

export interface WatchedFolder {
  id: string;
  path: string;
  added_at: string;
  last_scan?: string;
}

export interface IndexingJob {
  id: string;
  status: 'pending' | 'scanning' | 'indexing' | 'done' | 'failed';
  total: number;
  processed: number;
  started_at?: string;
  finished_at?: string;
}

export interface SearchResult {
  photo: Photo;
  score: number;
  match_type: 'semantic' | 'ocr' | 'metadata' | 'combined';
}

export interface DateGroup {
  date: string;
  label: string;
  photos: Photo[];
}

export type ViewMode = 'gallery' | 'timeline' | 'people' | 'trips' | 'search' | 'settings';
export type GallerySize = 'small' | 'medium' | 'large';
