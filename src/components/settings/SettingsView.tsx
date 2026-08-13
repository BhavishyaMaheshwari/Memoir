import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  FolderPlus,
  HardDrive,
  Cpu,
  Shield,
  Info,
  Trash2,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Folder,
} from 'lucide-react';
import { indexingApi, healthApi } from '../../services/api';

interface WatchedFolder {
  id: string;
  path: string;
  added_at?: string;
}

interface IndexStatus {
  status: string;
  total: number;
  processed: number;
}

interface HealthData {
  photos_count: number;
  indexed_count: number;
}

export function SettingsView() {
  const [folders, setFolders] = useState<WatchedFolder[]>([]);
  const [folderInput, setFolderInput] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [addError, setAddError] = useState('');
  const [indexStatus, setIndexStatus] = useState<IndexStatus>({ status: 'idle', total: 0, processed: 0 });
  const [health, setHealth] = useState<HealthData>({ photos_count: 0, indexed_count: 0 });
  const [isIndexing, setIsIndexing] = useState(false);

  // Load folders and status on mount
  useEffect(() => {
    loadFolders();
    loadStatus();
    loadHealth();

    // Poll indexing status when active
    const interval = setInterval(() => {
      if (isIndexing) {
        loadStatus();
        loadHealth();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isIndexing]);

  const loadFolders = useCallback(async () => {
    try {
      const res = await indexingApi.getFolders();
      setFolders(res.folders);
    } catch {
      // Backend might not be running
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await indexingApi.status();
      setIndexStatus(res);
      if (res.status === 'done' || res.status === 'failed' || res.status === 'idle') {
        setIsIndexing(false);
      }
    } catch {
      // Backend might not be running
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const res = await healthApi.check();
      setHealth(res);
    } catch {
      // Backend might not be running
    }
  }, []);

  const handleAddFolder = async () => {
    if (!folderInput.trim()) return;
    setAddingFolder(true);
    setAddError('');

    try {
      await indexingApi.addFolder(folderInput.trim());
      setFolderInput('');
      await loadFolders();
    } catch (e: any) {
      setAddError(e?.message || 'Failed to add folder');
    } finally {
      setAddingFolder(false);
    }
  };

  const handleRemoveFolder = async (id: string) => {
    try {
      await fetch(`/api/indexing/folders/${id}`, { method: 'DELETE' });
      await loadFolders();
    } catch {
      // Silently fail
    }
  };

  const handleStartIndexing = async () => {
    try {
      setIsIndexing(true);
      await indexingApi.start([]);
    } catch {
      setIsIndexing(false);
    }
  };

  const isActivelyIndexing = indexStatus.status === 'scanning' || indexStatus.status === 'indexing';
  const progress = indexStatus.total > 0
    ? Math.round((indexStatus.processed / indexStatus.total) * 100)
    : 0;

  return (
    <div className="min-h-full" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <motion.div
        className="px-8 pt-8 pb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
            <Settings size={16} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Settings
          </h1>
        </div>
      </motion.div>

      <div className="px-8 pb-12 space-y-6">
        {/* Watched Folders */}
        <SettingsSection title="Watched Folders" icon={FolderPlus}>
          {/* Add folder input */}
          <div className="flex gap-2 mb-4">
            <input
              id="folder-path-input"
              type="text"
              value={folderInput}
              onChange={(e) => {
                setFolderInput(e.target.value);
                setAddError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              placeholder="Enter folder path, e.g. ~/Pictures"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary/50 outline-none focus:border-accent/40 transition-colors"
            />
            <button
              id="settings-add-folder"
              onClick={handleAddFolder}
              disabled={addingFolder || !folderInput.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {addingFolder ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
              Add
            </button>
          </div>

          {addError && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
              <AlertCircle size={13} />
              {addError}
            </div>
          )}

          {/* Folder list */}
          {folders.length === 0 ? (
            <div className="p-6 border border-dashed border-border-default rounded-xl text-center">
              <Folder size={24} className="text-text-tertiary/30 mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">
                No folders added yet. Add a folder to start indexing your photos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-overlay/60 border border-border-subtle group"
                >
                  <Folder size={15} className="text-accent/60 shrink-0" />
                  <span className="text-sm text-text-secondary flex-1 font-mono truncate">
                    {folder.path}
                  </span>
                  <button
                    onClick={() => handleRemoveFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md hover:bg-error/10 flex items-center justify-center text-text-tertiary hover:text-error transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Start indexing button */}
              <button
                id="start-indexing-btn"
                onClick={handleStartIndexing}
                disabled={isActivelyIndexing}
                className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isActivelyIndexing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Indexing… {progress}%
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Start Indexing
                  </>
                )}
              </button>

              {/* Progress bar */}
              <AnimatePresence>
                {isActivelyIndexing && indexStatus.total > 0 && (
                  <motion.div
                    className="mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="h-1.5 rounded-full bg-surface-base overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1.5 text-center">
                      {indexStatus.processed} / {indexStatus.total} photos processed
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {indexStatus.status === 'done' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-success">
                  <CheckCircle2 size={13} />
                  Indexing complete
                </div>
              )}
            </div>
          )}
        </SettingsSection>

        {/* Storage */}
        <SettingsSection title="Storage" icon={HardDrive}>
          <div className="space-y-3">
            <SettingsRow label="Photos indexed" value={`${health.photos_count}`} />
            <SettingsRow label="AI processed" value={`${health.indexed_count}`} />
          </div>
        </SettingsSection>

        {/* AI Processing */}
        <SettingsSection title="AI Processing" icon={Cpu}>
          <div className="space-y-3">
            <SettingsRow label="Embedding Model" value="SigLIP" />
            <SettingsRow label="Face Recognition" value="InsightFace" />
            <SettingsRow label="OCR Engine" value="PaddleOCR" />
            <SettingsRow label="Processing" value="100% Local" />
          </div>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy" icon={Shield}>
          <div className="p-4 rounded-xl bg-accent-subtle/30 border border-accent/10">
            <p className="text-sm text-text-secondary leading-relaxed">
              Memoir runs entirely on your device. No data is sent to any server.
              No telemetry. No cloud processing. No accounts required.
            </p>
            <p className="text-xs text-accent mt-2 font-medium">
              Your memories stay yours.
            </p>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About" icon={Info}>
          <div className="space-y-3">
            <SettingsRow label="Version" value="0.1.0-alpha" />
            <SettingsRow label="Architecture" value="React + FastAPI" />
            <SettingsRow label="License" value="MIT" />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border-subtle">
        <Icon size={15} className="text-text-tertiary" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm text-text-tertiary font-mono">{value}</span>
    </div>
  );
}
