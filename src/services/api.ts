// ═══════════════════════════════════════════════════════
// Memoir — Backend API Client
// All requests go through the Vite proxy → FastAPI
// ═══════════════════════════════════════════════════════

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Photos ───

export const photosApi = {
  list: (offset = 0, limit = 100) =>
    request<{ photos: any[]; total: number }>(`/photos?offset=${offset}&limit=${limit}`),

  get: (id: string) =>
    request<any>(`/photos/${id}`),

  thumbnail: (id: string) =>
    `${BASE}/photos/${id}/thumbnail`,

  fullsize: (id: string) =>
    `${BASE}/photos/${id}/full`,
};

// ─── Search ───

export const searchApi = {
  semantic: (query: string, limit = 50) =>
    request<{ results: any[] }>('/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    }),
};

// ─── Indexing ───

export const indexingApi = {
  start: (folders: string[]) =>
    request<any>('/indexing/start', {
      method: 'POST',
      body: JSON.stringify({ folders }),
    }),

  status: () =>
    request<any>('/indexing/status'),

  addFolder: (path: string) =>
    request<any>('/indexing/folders', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),

  getFolders: () =>
    request<{ folders: any[] }>('/indexing/folders'),
};

// ─── People ───

export const peopleApi = {
  list: () =>
    request<{ people: any[] }>('/people'),

  rename: (id: string, name: string) =>
    request<any>(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
};

// ─── Health ───

export const healthApi = {
  check: () => request<{ status: string }>('/health'),
};
