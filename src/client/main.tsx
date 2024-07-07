import {
  DocHandle,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import React from "react";
import ReactDOM from "react-dom/client";
import { AutomergeMonacoBinder } from "./components/AutomergeMonacoBinder/index";
import "./index.css";
import { MyDoc } from "./utils/shared-data";

const ws = new BrowserWebSocketClientAdapter("ws://127.0.0.1:8080");
const indexedDB = new IndexedDBStorageAdapter();

const repo = new Repo({
  network: [ws],
  storage: indexedDB,
});

let handle: DocHandle<MyDoc>;

const rootDocUrl = `${document.location.hash.substring(1)}`;

if (isValidAutomergeUrl(rootDocUrl)) {
  handle = repo.find<MyDoc>(rootDocUrl);
} else {
  handle = repo.create<MyDoc>({ text: "" });
}

const docUrl = (document.location.hash = handle.url);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RepoContext.Provider value={repo}>
      <AutomergeMonacoBinder docUrl={docUrl} />
    </RepoContext.Provider>
  </React.StrictMode>,
);
