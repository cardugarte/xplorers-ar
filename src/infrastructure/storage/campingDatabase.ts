import * as SQLite from "expo-sqlite";

const DB_NAME = "xplorers.db";

let db: SQLite.SQLiteDatabase | null = null;

export async function getCampingDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS campings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      province TEXT NOT NULL,
      geohash TEXT NOT NULL,
      amenities TEXT NOT NULL DEFAULT '{}',
      prices TEXT,
      contact TEXT,
      photos TEXT,
      source TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      owner_npub TEXT,
      owner_lightning_address TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_campings_province ON campings(province);
    CREATE INDEX IF NOT EXISTS idx_campings_geohash ON campings(geohash);
    CREATE INDEX IF NOT EXISTS idx_campings_lat_lng ON campings(latitude, longitude);
  `);

  return db;
}

export async function getCampingsInBoundingBox(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
): Promise<Record<string, unknown>[]> {
  const database = await getCampingDatabase();

  return database.getAllAsync(
    `SELECT * FROM campings
     WHERE latitude BETWEEN ? AND ?
     AND longitude BETWEEN ? AND ?`,
    [minLat, maxLat, minLng, maxLng],
  );
}

export async function upsertCamping(camping: {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  province: string;
  geohash: string;
  amenities: string;
  prices: string | null;
  contact: string | null;
  photos: string | null;
  source: string;
  verified: boolean;
  owner_npub: string | null;
  owner_lightning_address: string | null;
  created_at: string;
  updated_at: string;
}): Promise<void> {
  const database = await getCampingDatabase();

  await database.runAsync(
    `INSERT OR REPLACE INTO campings
     (id, name, slug, latitude, longitude, province, geohash, amenities, prices, contact, photos, source, verified, owner_npub, owner_lightning_address, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      camping.id,
      camping.name,
      camping.slug,
      camping.latitude,
      camping.longitude,
      camping.province,
      camping.geohash,
      camping.amenities,
      camping.prices,
      camping.contact,
      camping.photos,
      camping.source,
      camping.verified ? 1 : 0,
      camping.owner_npub,
      camping.owner_lightning_address,
      camping.created_at,
      camping.updated_at,
    ],
  );
}
