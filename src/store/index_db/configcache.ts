import { openDB } from "idb";

const DB_NAME = "nordik_cache";
const STORE = "data_config";

type CachedConfig = {
  key: string; // config_<file_name>
  file_name: string;
  updated_at?: string; // RFC3339
  checksum?: string;
  version?: number;
  config?: any; // big json ok
};

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    },
  });
}

export async function idbGetConfig(key: string): Promise<CachedConfig | null> {
  const db = await getDB();
  return (await db.get(STORE, key)) || null;
}

export async function idbSetConfig(value: CachedConfig): Promise<void> {
  const db = await getDB();
  await db.put(STORE, value);
}