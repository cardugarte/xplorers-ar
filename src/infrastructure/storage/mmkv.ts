import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "xplorers-storage",
});

export const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};
