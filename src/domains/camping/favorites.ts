import { storage } from "@/src/infrastructure/storage/mmkv";

const FAVORITES_KEY = "favorites";

export function getLocalFavorites(): string[] {
  const raw = storage.getString(FAVORITES_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setLocalFavorites(ids: string[]): void {
  storage.set(FAVORITES_KEY, JSON.stringify(ids));
}

/**
 * Toggles a camping ID in local MMKV storage.
 * @returns true if the camping was added, false if it was removed.
 */
export function toggleLocalFavorite(campingId: string): boolean {
  const favorites = getLocalFavorites();
  const index = favorites.indexOf(campingId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(campingId);
  }
  setLocalFavorites(favorites);
  return index < 0;
}
