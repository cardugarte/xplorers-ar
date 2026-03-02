import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { mmkvStorageAdapter } from "@/src/infrastructure/storage/mmkv";

export const queryPersister = createSyncStoragePersister({
  storage: mmkvStorageAdapter,
  key: "XPLORERS_QUERY_CACHE",
});
