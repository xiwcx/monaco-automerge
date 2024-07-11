import { DocHandle, isValidAutomergeUrl } from "@automerge/automerge-repo";
import React from "react";
import ReactDOM from "react-dom/client";
import { AutomergeMonacoBinder } from "./components/AutomergeMonacoBinder/index";
import "./index.css";
import { MyDoc } from "./utils/shared-data";
import { repo } from "./utils/repo";

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
    <AutomergeMonacoBinder docUrl={docUrl} />
  </React.StrictMode>,
);
