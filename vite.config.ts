import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import { configDefaults, defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), react()],

  test: {
    exclude: [...configDefaults.exclude, "**/tests/**"],
  },

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
