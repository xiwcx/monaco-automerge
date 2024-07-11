import { Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";

const ws = new BrowserWebSocketClientAdapter(`${__WEBSOCKET_URL__}/automerge`);
const indexedDB = new IndexedDBStorageAdapter();

export const repo = new Repo({
  network: [ws],
  storage: indexedDB,
});
