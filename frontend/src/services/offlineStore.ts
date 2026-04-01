import { openDB, type IDBPDatabase } from 'idb';
import api from './api';

interface TaglyDB {
  pendingActions: {
    key: number;
    value: PendingAction;
  };
  cachedAssets: {
    key: string;
    value: CachedAsset;
  };
}

export interface PendingAction {
  id?: number;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  createdAt: string;
}

export interface CachedAsset {
  guid: string;
  name: string;
  status: string;
  data: Record<string, unknown>;
  cachedAt: string;
}

const DB_NAME = 'tagly-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TaglyDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TaglyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TaglyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains('cachedAssets')) {
          db.createObjectStore('cachedAssets', { keyPath: 'guid' });
        }
      },
    });
  }
  return dbPromise;
}

export async function addPendingAction(
  action: Omit<PendingAction, 'id' | 'createdAt'>,
): Promise<number> {
  const db = await getDb();
  const entry: PendingAction = { ...action, createdAt: new Date().toISOString() };
  return db.add('pendingActions', entry) as Promise<number>;
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDb();
  return db.getAll('pendingActions');
}

export async function clearPendingActions(): Promise<void> {
  const db = await getDb();
  await db.clear('pendingActions');
}

export async function cacheAsset(asset: CachedAsset): Promise<void> {
  const db = await getDb();
  await db.put('cachedAssets', { ...asset, cachedAt: new Date().toISOString() });
}

export async function getCachedAsset(guid: string): Promise<CachedAsset | undefined> {
  const db = await getDb();
  return db.get('cachedAssets', guid);
}

export async function syncPendingActions(): Promise<void> {
  const actions = await getPendingActions();
  if (actions.length === 0) return;

  console.info(`[Offline Sync] Processing ${actions.length} pending action(s)…`);

  for (const action of actions) {
    try {
      await api.request({ method: action.method, url: action.url, data: action.data });
    } catch (err) {
      console.error(`[Offline Sync] Failed to sync action ${action.id}`, err);
      return;
    }
  }

  await clearPendingActions();
  console.info('[Offline Sync] All pending actions synced successfully');
}
