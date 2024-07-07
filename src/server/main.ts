import fs from "fs";
import { WebSocketServer } from "ws";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { Repo } from "@automerge/automerge-repo";
import express from "express";
import ViteExpress from "vite-express";

/**
 * - https://docs.render.com/environment-variables#all-runtimes-1
 * - https://github.com/render-examples/express-hello-world/blob/main/app.js#L3
 */
const port = process.env.port ? Number(process.env.port) : 8080;
const dir = "automerge-sync-server-data";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const wss = new WebSocketServer({ noServer: true });
const app = express();

wss.on("error", console.error);

const config = {
  network: [new NodeWSServerAdapter(wss)],
  storage: new NodeFSStorageAdapter(dir),
};

new Repo(config);

app.get("/foo", (req, res) => {
  return res.send("Hello World!");
});

const server = ViteExpress.listen(app, port, () =>
  console.log(`Server is listening on port ${port}...`),
);

server.on("upgrade", (request, socket, head) => {
  console.log("server upgrading");
  if (request.url?.startsWith("/automerge")) {
    wss.handleUpgrade(request, socket, head, (socket) => {
      console.log("socket emitting");
      wss.emit("connection", socket, request);
    });
  }
});
