import {
  DocHandle,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import React from "react";
import ReactDOM from "react-dom/client";
import { AutomergeMonacoBinder } from "./components/AutomergeMonacoBinder/index.ts";
import "./index.css";
import { MyDoc } from "./utils/shared-data.ts";

const broadcast = new BroadcastChannelNetworkAdapter();
const indexedDB = new IndexedDBStorageAdapter();

const repo = new Repo({
  network: [broadcast],
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
