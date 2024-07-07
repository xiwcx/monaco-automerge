import fs from "fs";
import { WebSocketServer } from "ws";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { Repo } from "@automerge/automerge-repo";
import express from "express";
import ViteExpress from "vite-express";

const dir = "automerge-sync-server-data";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const wss = new WebSocketServer({ noServer: true });
const app = express();

const config = {
  network: [new NodeWSServerAdapter(wss)],
  storage: new NodeFSStorageAdapter(dir),
};

new Repo(config);

app.get("/foo", (req, res) => {
  return res.send("Hello World!");
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);

const server = app.listen(8080);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});
