import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * https://docs.render.com/environment-variables#all-runtimes
 */
const getWebsocketUrl = () =>
  process.env.RENDER
    ? `wss://${process.env.RENDER_EXTERNAL_HOSTNAME}`
    : "ws://localhost:8080";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },

  define: {
    __WEBSOCKET_URL__: JSON.stringify(getWebsocketUrl()),
  },

  plugins: [wasm(), react()],

  test: {
    exclude: [...configDefaults.exclude, "**/tests/**"],
  },

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
